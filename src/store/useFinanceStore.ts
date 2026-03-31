import { create } from 'zustand';
import { Account, JournalEntry, BankMovement, JournalLine } from '../types';
import { api } from '../api';

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
      const [accounts, journalEntries, bankMovements] = await Promise.all([
        api.accounts.getAll(),
        api.journalEntries.getAll(),
        api.bankMovements.getAll(),
      ]);

      set({ accounts, journalEntries, bankMovements, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAccount: async (account) => {
    const newAccount = await api.accounts.create(account);
    set((state) => ({ accounts: [...state.accounts, newAccount] }));
    return newAccount;
  },

  updateAccount: async (id, updates) => {
    await api.accounts.update(id, updates);
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  deleteAccount: async (id) => {
    await api.accounts.delete(id);
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
  },

  addJournalEntry: async (entry) => {
    const newEntry = await api.journalEntries.create(entry);
    set((state) => ({ journalEntries: [newEntry, ...state.journalEntries] }));
    return newEntry;
  },

  updateJournalEntry: async (id, updates) => {
    await api.journalEntries.update(id, updates);
    set((state) => ({
      journalEntries: state.journalEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  deleteJournalEntry: async (id) => {
    await api.journalEntries.delete(id);
    set((state) => ({
      journalEntries: state.journalEntries.filter((e) => e.id !== id),
    }));
  },

  updateJournalLine: async (entryId, lineId, updates) => {
    const entry = get().journalEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    const newLines = entry.lines.map(l => l.id === lineId ? { ...l, ...updates } : l);
    
    await api.journalEntries.update(entryId, { lines: newLines });

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
    const newMovement = await api.bankMovements.create(movement);
    set((state) => ({ bankMovements: [newMovement, ...state.bankMovements] }));
    return newMovement;
  },

  updateBankMovement: async (id, updates) => {
    await api.bankMovements.update(id, updates);
    set((state) => ({
      bankMovements: state.bankMovements.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteBankMovement: async (id) => {
    await api.bankMovements.delete(id);
    set((state) => ({
      bankMovements: state.bankMovements.filter((m) => m.id !== id),
    }));
  },
}));
