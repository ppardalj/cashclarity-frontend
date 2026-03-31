import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, JournalEntry, BankMovement, JournalLine } from '../types';

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-main', code: '0001', name: 'Cuenta Principal', type: 'main', isSystem: true, active: true },
  { id: 'acc-uncategorized', code: '9999', name: 'Sin categorizar', type: 'other', isSystem: true, active: true },
];

interface FinanceStore {
  accounts: Account[];
  journalEntries: JournalEntry[];
  bankMovements: BankMovement[];
  
  // Actions
  addAccount: (account: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => JournalEntry;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  updateJournalLine: (entryId: string, lineId: string, updates: Partial<JournalLine>) => void;
  
  addBankMovement: (movement: Omit<BankMovement, 'id' | 'isIdentified'>) => BankMovement;
  updateBankMovement: (id: string, updates: Partial<BankMovement>) => void;
  deleteBankMovement: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      accounts: INITIAL_ACCOUNTS,
      journalEntries: [],
      bankMovements: [],

      addAccount: (account) => {
        const newAccount: Account = { ...account, id: crypto.randomUUID() };
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
        return newAccount;
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteAccount: (id) => {
        set((state) => {
          const account = state.accounts.find((a) => a.id === id);
          if (account?.isSystem) return state;
          return { accounts: state.accounts.filter((a) => a.id !== id) };
        });
      },

      addJournalEntry: (entry) => {
        const newEntry: JournalEntry = { ...entry, id: crypto.randomUUID() };
        set((state) => ({ journalEntries: [newEntry, ...state.journalEntries] }));
        return newEntry;
      },

      updateJournalEntry: (id, updates) => {
        set((state) => ({
          journalEntries: state.journalEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      deleteJournalEntry: (id) => {
        set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id),
        }));
      },

      updateJournalLine: (entryId, lineId, updates) => {
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

      addBankMovement: (movement) => {
        const newMovement: BankMovement = {
          ...movement,
          id: crypto.randomUUID(),
          isIdentified: false,
        };
        set((state) => ({ bankMovements: [newMovement, ...state.bankMovements] }));
        return newMovement;
      },

      updateBankMovement: (id, updates) => {
        set((state) => ({
          bankMovements: state.bankMovements.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      deleteBankMovement: (id) => {
        set((state) => ({
          bankMovements: state.bankMovements.filter((m) => m.id !== id),
        }));
      },
    }),
    {
      name: 'cashclarity_storage'
    }
  )
);
