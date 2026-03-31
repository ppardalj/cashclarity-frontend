import { create } from 'zustand';
import { Account, JournalEntry, BankMovement, JournalLine } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface FinanceStore {
  accounts: Account[];
  journalEntries: JournalEntry[];
  bankMovements: BankMovement[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<JournalEntry>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  updateJournalLine: (entryId: string, lineId: string, updates: Partial<JournalLine>) => Promise<void>;
  
  addBankMovement: (movement: Omit<BankMovement, 'id' | 'isIdentified'>) => Promise<BankMovement>;
  updateBankMovement: (id: string, updates: Partial<BankMovement>) => Promise<void>;
  deleteBankMovement: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  accounts: [],
  journalEntries: [],
  bankMovements: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [accRes, journalRes, bankRes] = await Promise.all([
        fetch(`${API_BASE_URL}/accounts`),
        fetch(`${API_BASE_URL}/journal-entries`),
        fetch(`${API_BASE_URL}/bank-movements`),
      ]);

      if (!accRes.ok || !journalRes.ok || !bankRes.ok) {
        throw new Error('Error al cargar datos de la API');
      }

      const [accounts, journalEntries, bankMovements] = await Promise.all([
        accRes.json(),
        journalRes.json(),
        bankRes.json(),
      ]);

      set({ accounts, journalEntries, bankMovements, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAccount: async (account) => {
    const res = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    if (!res.ok) throw new Error('Error al crear cuenta');
    const newAccount = await res.json();
    set((state) => ({ accounts: [...state.accounts, newAccount] }));
    return newAccount;
  },

  updateAccount: async (id, updates) => {
    const res = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error al actualizar cuenta');
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  deleteAccount: async (id) => {
    const res = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar cuenta');
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
  },

  addJournalEntry: async (entry) => {
    const res = await fetch(`${API_BASE_URL}/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Error al crear asiento');
    const newEntry = await res.json();
    set((state) => ({ journalEntries: [newEntry, ...state.journalEntries] }));
    return newEntry;
  },

  updateJournalEntry: async (id, updates) => {
    const res = await fetch(`${API_BASE_URL}/journal-entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error al actualizar asiento');
    set((state) => ({
      journalEntries: state.journalEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  deleteJournalEntry: async (id) => {
    const res = await fetch(`${API_BASE_URL}/journal-entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar asiento');
    set((state) => ({
      journalEntries: state.journalEntries.filter((e) => e.id !== id),
    }));
  },

  updateJournalLine: async (entryId, lineId, updates) => {
    const entry = get().journalEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    const newLines = entry.lines.map(l => l.id === lineId ? { ...l, ...updates } : l);
    
    const res = await fetch(`${API_BASE_URL}/journal-entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: newLines }),
    });
    if (!res.ok) throw new Error('Error al actualizar línea de asiento');

    set((state) => ({
      journalEntries: state.journalEntries.map((entry) => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          lines: entry.lines.map((line) => (line.id === lineId ? { ...line, ...updates } : line)),
        };
      }),
    }));
  },

  addBankMovement: async (movement) => {
    const res = await fetch(`${API_BASE_URL}/bank-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movement),
    });
    if (!res.ok) throw new Error('Error al crear movimiento');
    const newMovement = await res.json();
    set((state) => ({ bankMovements: [newMovement, ...state.bankMovements] }));
    return newMovement;
  },

  updateBankMovement: async (id, updates) => {
    const res = await fetch(`${API_BASE_URL}/bank-movements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error al actualizar movimiento');
    set((state) => ({
      bankMovements: state.bankMovements.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteBankMovement: async (id) => {
    const res = await fetch(`${API_BASE_URL}/bank-movements/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar movimiento');
    set((state) => ({
      bankMovements: state.bankMovements.filter((m) => m.id !== id),
    }));
  },
}));
