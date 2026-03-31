import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { ImportCSV } from './ImportCSV';
import { 
  Plus, 
  Upload, 
  CheckCircle2, 
  Circle, 
  X, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Trash2,
  FileEdit,
  PiggyBank,
  Wallet
} from 'lucide-react';
import { Account, BankMovement, JournalEntry, JournalLine } from '../types';

export function BankStatement() {
  const { 
    accounts, 
    bankMovements, 
    addBankMovement, 
    updateBankMovement, 
    deleteBankMovement,
    addJournalEntry,
    updateJournalEntry,
    journalEntries
  } = useFinanceStore();

  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [reconcilingMovement, setReconcilingMovement] = useState<BankMovement | null>(null);
  const [identifyingMovement, setIdentifyingMovement] = useState<BankMovement | null>(null);
  const [reservingMovement, setReservingMovement] = useState<BankMovement | null>(null);
  const [payingFromSpaceMovement, setPayingFromSpaceMovement] = useState<BankMovement | null>(null);

  const [newMovement, setNewMovement] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  // Modal States
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [reservations, setReservations] = useState<{ spaceId: string, amount: number }[]>([]);

  // Reconciliation State
  const [reconEntry, setReconEntry] = useState<{
    description: string;
    date: string;
    lines: { accountId: string; debit: number; credit: number; id: string }[];
  } | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  const bankBalance = useMemo(() => {
    return bankMovements.reduce((sum: number, m: BankMovement) => sum + m.amount, 0);
  }, [bankMovements]);

  const entities = useMemo(() => accounts.filter((a: Account) => a.type === 'entity'), [accounts]);
  const spaces = useMemo(() => accounts.filter((a: Account) => a.type === 'space'), [accounts]);
  const mainAccount = useMemo(() => accounts.find((a: Account) => a.type === 'main'), [accounts]);
  const uncategorizedAccount = useMemo(() => accounts.find((a: Account) => a.id === 'acc-uncategorized'), [accounts]);

  const handleAddMovement = () => {
    if (!newMovement.description || !newMovement.amount) return;
    addBankMovement({
      date: newMovement.date,
      description: newMovement.description,
      amount: parseFloat(newMovement.amount)
    });
    setIsAdding(false);
    setNewMovement({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: ''
    });
  };

  const getOrCreateEntry = async (movement: BankMovement) => {
    if (movement.journalEntryId) {
      return journalEntries.find((e: JournalEntry) => e.id === movement.journalEntryId);
    }
    
    if (!mainAccount || !uncategorizedAccount) {
      console.error('Missing system accounts:', { mainAccount, uncategorizedAccount });
      alert('Error: No se han configurado las cuentas de sistema (Principal/Sin categorizar)');
      return undefined;
    }

    const isIncome = movement.amount > 0;
    const absAmount = Math.abs(movement.amount);

    const entry = await addJournalEntry({
      description: movement.description,
      date: movement.date,
      lines: [
        { 
          id: crypto.randomUUID(),
          accountId: mainAccount.id,
          debit: isIncome ? absAmount : 0, 
          credit: isIncome ? 0 : absAmount 
        },
        { 
          id: crypto.randomUUID(),
          accountId: uncategorizedAccount.id,
          debit: isIncome ? 0 : absAmount, 
          credit: isIncome ? absAmount : 0 
        }
      ]
    });

    await updateBankMovement(movement.id, { journalEntryId: entry.id });
    return entry;
  };

  const startReconciliation = async (movement: BankMovement) => {
    setReconcilingMovement(movement);
    
    const entry = await getOrCreateEntry(movement);
    if (!entry) return;

    setReconEntry({
      description: entry.description,
      date: entry.date,
      lines: entry.lines.map((l: JournalLine) => ({ ...l }))
    });
  };

  const handleSaveReconciliation = async () => {
    if (!reconEntry || !reconcilingMovement) return;

    if (reconEntry.lines.some(l => !l.accountId)) {
      alert('Todas las líneas deben tener una cuenta seleccionada');
      return;
    }

    const totalDebit = reconEntry.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = reconEntry.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert('El asiento no está cuadrado');
      return;
    }

    await updateJournalEntry(reconcilingMovement.journalEntryId!, {
      date: reconEntry.date,
      description: reconEntry.description,
      lines: reconEntry.lines
    });

    setReconcilingMovement(null);
    setReconEntry(null);
  };

  const handleIdentify = async () => {
    if (!identifyingMovement || !selectedEntityId) {
      alert('Por favor, selecciona una entidad');
      return;
    }
    
    const entry = await getOrCreateEntry(identifyingMovement);
    if (!entry) return;

    const newLines = entry.lines.map((l: JournalLine) => {
      if (l.accountId === uncategorizedAccount?.id) {
        return { ...l, accountId: selectedEntityId };
      }
      return l;
    });

    await updateJournalEntry(entry.id, { lines: newLines });
    await updateBankMovement(identifyingMovement.id, { 
      isIdentified: true, 
      entityId: selectedEntityId 
    });

    setIdentifyingMovement(null);
    setSelectedEntityId('');
  };

  const handleReserve = async () => {
    if (!reservingMovement || reservations.length === 0) return;
    
    if (!mainAccount) {
      alert('No se ha encontrado la cuenta principal');
      return;
    }

    const totalReserved = reservations.reduce((sum, r) => sum + r.amount, 0);
    if (totalReserved > reservingMovement.amount) {
      alert('La cantidad total reservada no puede superar el importe del movimiento');
      return;
    }

    if (reservations.some(r => !r.spaceId || r.amount <= 0)) {
      alert('Todas las reservas deben tener un espacio seleccionado y una cantidad mayor que cero');
      return;
    }

    const entry = await getOrCreateEntry(reservingMovement);
    if (!entry) return;

    const newLines = [...entry.lines];

    reservations.forEach(res => {
      // Debit Space, Credit Main
      newLines.push({
        id: crypto.randomUUID(),
        accountId: res.spaceId,
        debit: res.amount,
        credit: 0
      });
      newLines.push({
        id: crypto.randomUUID(),
        accountId: mainAccount.id,
        debit: 0,
        credit: res.amount
      });
    });

    await updateJournalEntry(entry.id, { lines: newLines });
    setReservingMovement(null);
    setReservations([]);
  };

  const handlePayFromSpace = async () => {
    if (!payingFromSpaceMovement || !selectedSpaceId) {
      alert('Por favor, selecciona un espacio');
      return;
    }
    
    if (!mainAccount) {
      alert('No se ha encontrado la cuenta principal');
      return;
    }

    const entry = await getOrCreateEntry(payingFromSpaceMovement);
    if (!entry) return;

    const newLines = entry.lines.map((l: JournalLine) => {
      if (l.accountId === mainAccount.id) {
        return { ...l, accountId: selectedSpaceId };
      }
      return l;
    });

    await updateJournalEntry(entry.id, { lines: newLines });
    setPayingFromSpaceMovement(null);
    setSelectedSpaceId('');
  };

  const handleImportCSV = () => {
    setIsImporting(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Balance */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Posición Global Bancaria</h2>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tighter numeric">
              {formatCurrency(bankBalance)}
            </span>
            <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">Saldo Real</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleImportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary border border-border hover:bg-surface-elevated transition-all rounded-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Importar CSV
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-primary-green text-background hover:bg-primary-green/90 transition-all rounded-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Movimiento
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-surface border border-border p-6 rounded-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Registrar Movimiento Manual</h3>
            <button onClick={() => setIsAdding(false)} className="text-text-secondary hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Fecha</label>
              <input 
                type="date" 
                value={newMovement.date}
                onChange={e => setNewMovement(prev => ({ ...prev, date: e.target.value }))}
                className="bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Concepto</label>
              <input 
                type="text" 
                value={newMovement.description}
                onChange={e => setNewMovement(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ej: Transferencia Recibida"
                className="bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Importe (+ Ingreso, - Gasto)</label>
              <input 
                type="number" 
                step="0.01"
                value={newMovement.amount}
                onChange={e => setNewMovement(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddMovement}
              className="bg-primary-green text-background px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-primary-green/90 transition-all"
            >
              Guardar Movimiento
            </button>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated/20">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Extracto de Movimientos Bancarios</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-green"></div>
              <span className="text-[9px] font-mono text-text-secondary uppercase">Identificado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-orange"></div>
              <span className="text-[9px] font-mono text-text-secondary uppercase">Pendiente</span>
            </div>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-elevated/10 border-b border-border">
              <th className="p-4 text-[9px] font-mono uppercase tracking-widest text-text-secondary w-16 text-center">Estado</th>
              <th className="p-4 text-[9px] font-mono uppercase tracking-widest text-text-secondary">Fecha</th>
              <th className="p-4 text-[9px] font-mono uppercase tracking-widest text-text-secondary">Concepto</th>
              <th className="p-4 text-[9px] font-mono uppercase tracking-widest text-text-secondary">Entidad</th>
              <th className="p-4 text-[9px] font-mono uppercase tracking-widest text-text-secondary text-right">Cantidad</th>
              <th className="p-4 text-[9px] font-mono uppercase tracking-widest text-text-secondary text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {bankMovements.map((m: BankMovement) => {
              const entity = accounts.find((a: Account) => a.id === m.entityId);
              
              return (
                <tr key={m.id} className="hover:bg-surface-elevated/10 transition-colors group">
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => !m.isIdentified && setIdentifyingMovement(m)}
                      className={`transition-all ${m.isIdentified ? 'cursor-default' : 'hover:scale-110'}`}
                      title={m.isIdentified ? 'Identificado' : 'Haga clic para identificar entidad'}
                    >
                      {m.isIdentified ? (
                        <CheckCircle2 className="w-5 h-5 text-primary-green mx-auto" />
                      ) : (
                        <Circle className="w-5 h-5 text-primary-orange mx-auto" />
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-xs font-mono text-text-secondary">{m.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {m.amount > 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-primary-green" />
                      ) : (
                        <ArrowDownLeft className="w-3 h-3 text-primary-orange" />
                      )}
                      <span className="text-xs font-medium">{m.description}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {entity ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{entity.name}</span>
                        <span className="text-[9px] font-mono text-text-secondary uppercase">{entity.code}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-text-secondary italic uppercase tracking-widest">Sin identificar</span>
                    )}
                  </td>
                  <td className={`p-4 numeric font-bold text-right ${m.amount >= 0 ? 'text-primary-green' : 'text-primary-orange'}`}>
                    {formatCurrency(m.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {m.amount > 0 && (
                        <button 
                          onClick={() => {
                            setReservingMovement(m);
                            setReservations([]);
                          }}
                          className="p-1.5 text-text-secondary hover:text-primary-orange transition-all"
                          title="Reservar Fondos"
                        >
                          <PiggyBank className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {m.amount < 0 && (
                        <button 
                          onClick={() => setPayingFromSpaceMovement(m)}
                          className="p-1.5 text-text-secondary hover:text-primary-orange transition-all"
                          title="Pagar desde Espacio"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button 
                        onClick={() => startReconciliation(m)}
                        className="p-1.5 text-text-secondary hover:text-primary-orange transition-all"
                        title="Editar Asiento Completo"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => deleteBankMovement(m.id)}
                        className="p-1.5 text-text-secondary hover:text-primary-orange opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {bankMovements.length === 0 && (
              <tr key="empty-bank">
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Search className="w-8 h-8" />
                    <p className="text-xs font-mono uppercase tracking-widest">No hay movimientos registrados</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {isImporting && (
        <ImportCSV onClose={() => setIsImporting(false)} />
      )}

      {/* Identify Modal */}
      {identifyingMovement && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-elevated/20">
              <h3 className="text-sm font-bold uppercase tracking-widest">Identificar Entidad</h3>
              <button onClick={() => setIdentifyingMovement(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Seleccionar Contraparte</label>
                <select 
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  className="w-full bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-green outline-none"
                >
                  <option value="">Seleccionar entidad...</option>
                  {entities.map((e: Account) => (
                    <option key={e.id} value={e.id}>{e.code} - {e.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIdentifyingMovement(null)} className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary">Cancelar</button>
                <button onClick={handleIdentify} className="bg-primary-green text-background px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm">Identificar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Modal */}
      {reservingMovement && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-lg rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-elevated/20">
              <h3 className="text-sm font-bold uppercase tracking-widest">Reservar Fondos</h3>
              <button onClick={() => setReservingMovement(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div className="bg-background border border-border p-3 rounded-sm flex justify-between items-center">
                <span className="text-xs text-text-secondary uppercase font-mono">Disponible para reservar</span>
                <span className="text-sm font-bold text-primary-green">{formatCurrency(reservingMovement.amount)}</span>
              </div>

              <div className="flex flex-col gap-4">
                {reservations.map((res, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <select 
                      value={res.spaceId}
                      onChange={e => {
                        const newRes = [...reservations];
                        newRes[idx].spaceId = e.target.value;
                        setReservations(newRes);
                      }}
                      className="flex-1 bg-background border border-border p-2 text-xs rounded-sm outline-none"
                    >
                      <option value="">Seleccionar espacio...</option>
                      {spaces.map((s: Account) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      value={res.amount}
                      onChange={e => {
                        const newRes = [...reservations];
                        newRes[idx].amount = parseFloat(e.target.value) || 0;
                        setReservations(newRes);
                      }}
                      className="w-24 bg-background border border-border p-2 text-xs rounded-sm outline-none font-mono"
                    />
                    <button 
                      onClick={() => setReservations(reservations.filter((_, i) => i !== idx))}
                      className="text-text-secondary hover:text-primary-orange"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setReservations([...reservations, { spaceId: '', amount: 0 }])}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary-orange hover:underline self-start"
                >
                  + Añadir Reserva
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button onClick={() => setReservingMovement(null)} className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary">Cancelar</button>
                <button onClick={handleReserve} className="bg-primary-green text-background px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm">Guardar Reservas</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay from Space Modal */}
      {payingFromSpaceMovement && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-elevated/20">
              <h3 className="text-sm font-bold uppercase tracking-widest">Pagar desde Espacio</h3>
              <button onClick={() => setPayingFromSpaceMovement(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Seleccionar Espacio de Origen</label>
                <select 
                  value={selectedSpaceId}
                  onChange={e => setSelectedSpaceId(e.target.value)}
                  className="w-full bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-green outline-none"
                >
                  <option value="">Seleccionar espacio...</option>
                  {spaces.map((s: Account) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPayingFromSpaceMovement(null)} className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary">Cancelar</button>
                <button onClick={handlePayFromSpace} className="bg-primary-green text-background px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm">Confirmar Pago</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      {reconcilingMovement && reconEntry && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-elevated/20 sticky top-0 z-10">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">Edición de Asiento Contable</h3>
                <p className="text-[10px] font-mono text-text-secondary">Ajustando registro para: {reconcilingMovement.description}</p>
              </div>
              <button onClick={() => setReconcilingMovement(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {/* Movement Summary */}
              <div className="bg-background border border-border p-4 mb-8 flex items-center justify-between rounded-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono uppercase text-text-secondary">Movimiento Bancario</span>
                  <span className="text-sm font-medium">{reconcilingMovement.description}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase text-text-secondary">Importe</span>
                  <p className={`text-lg font-bold numeric ${reconcilingMovement.amount >= 0 ? 'text-primary-green' : 'text-primary-orange'}`}>
                    {formatCurrency(reconcilingMovement.amount)}
                  </p>
                </div>
              </div>

              {/* Entry Editor */}
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Descripción del Asiento</label>
                    <input 
                      type="text" 
                      value={reconEntry.description}
                      onChange={e => setReconEntry(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                      className="bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Fecha Contable</label>
                    <input 
                      type="date" 
                      value={reconEntry.date}
                      onChange={e => setReconEntry(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                      className="bg-background border border-border p-2 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none"
                    />
                  </div>
                </div>

                <div className="bg-background border border-border rounded-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-elevated/10 border-b border-border">
                        <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-text-secondary">Cuenta</th>
                        <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-text-secondary text-right">Debe</th>
                        <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-text-secondary text-right">Haber</th>
                        <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-text-secondary w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {reconEntry.lines.map((line, idx) => (
                        <tr key={line.id || idx}>
                          <td className="p-2">
                            <select 
                              value={line.accountId}
                              onChange={e => {
                                const newLines = [...reconEntry.lines];
                                newLines[idx].accountId = e.target.value;
                                setReconEntry({ ...reconEntry, lines: newLines });
                              }}
                              className="w-full bg-transparent border-none text-xs focus:ring-0 outline-none"
                            >
                              {accounts.map((a: Account) => (
                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              value={line.debit || ''}
                              onChange={e => {
                                const newLines = [...reconEntry.lines];
                                newLines[idx].debit = parseFloat(e.target.value) || 0;
                                setReconEntry({ ...reconEntry, lines: newLines });
                              }}
                              placeholder="0.00"
                              className="w-full bg-transparent border-none text-xs text-right focus:ring-0 outline-none font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              value={line.credit || ''}
                              onChange={e => {
                                const newLines = [...reconEntry.lines];
                                newLines[idx].credit = parseFloat(e.target.value) || 0;
                                setReconEntry({ ...reconEntry, lines: newLines });
                              }}
                              placeholder="0.00"
                              className="w-full bg-transparent border-none text-xs text-right focus:ring-0 outline-none font-mono"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              onClick={() => {
                                const newLines = reconEntry.lines.filter((_, i) => i !== idx);
                                setReconEntry({ ...reconEntry, lines: newLines });
                              }}
                              className="text-text-secondary hover:text-primary-orange"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-elevated/5 border-t border-border">
                        <td className="p-3">
                          <button 
                            onClick={() => {
                              setReconEntry({
                                ...reconEntry,
                                lines: [...reconEntry.lines, { id: crypto.randomUUID(), accountId: accounts[0].id, debit: 0, credit: 0 }]
                              });
                            }}
                            className="text-[9px] font-bold uppercase tracking-widest text-primary-orange hover:underline"
                          >
                            + Añadir Línea
                          </button>
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-bold">
                          {formatCurrency(reconEntry.lines.reduce((sum, l) => sum + l.debit, 0))}
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-bold">
                          {formatCurrency(reconEntry.lines.reduce((sum, l) => sum + l.credit, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  {Math.abs(reconEntry.lines.reduce((sum, l) => sum + l.debit, 0) - reconEntry.lines.reduce((sum, l) => sum + l.credit, 0)) > 0.01 ? (
                    <div className="flex items-center gap-2 text-primary-orange animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Asiento Descuadrado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-primary-green">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Asiento Cuadrado</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setReconcilingMovement(null)}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveReconciliation}
                      className="bg-primary-green text-background px-8 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-primary-green/90 transition-all shadow-lg"
                    >
                      Confirmar y Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
