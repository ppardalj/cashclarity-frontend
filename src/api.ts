import { Account, JournalEntry, BankMovement } from './types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:54321/functions/v1/server';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }
  return res.json();
};

export const api = {
  accounts: {
    getAll: (): Promise<Account[]> => 
      fetch(`${API_BASE_URL}/accounts`).then(handleResponse).then(data => data.map((a: any) => new Account(a))),
    create: (account: Omit<Account, 'id'>): Promise<Account> =>
      fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then(handleResponse).then(data => new Account(data)),
    update: (id: string, updates: Partial<Account>): Promise<void> =>
      fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
    delete: (id: string): Promise<void> =>
      fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  journalEntries: {
    getAll: (): Promise<JournalEntry[]> => 
      fetch(`${API_BASE_URL}/journal-entries`).then(handleResponse).then(data => data.map((e: any) => new JournalEntry(e))),
    create: (entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> =>
      fetch(`${API_BASE_URL}/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).then(handleResponse).then(data => new JournalEntry(data)),
    update: (id: string, updates: Partial<JournalEntry>): Promise<void> =>
      fetch(`${API_BASE_URL}/journal-entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
    delete: (id: string): Promise<void> =>
      fetch(`${API_BASE_URL}/journal-entries/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  bankMovements: {
    getAll: (): Promise<BankMovement[]> => 
      fetch(`${API_BASE_URL}/bank-movements`).then(handleResponse).then(data => data.map((m: any) => new BankMovement(m))),
    create: (movement: Omit<BankMovement, 'id' | 'isIdentified'>): Promise<BankMovement> =>
      fetch(`${API_BASE_URL}/bank-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movement),
      }).then(handleResponse).then(data => new BankMovement(data)),
    update: (id: string, updates: Partial<BankMovement>): Promise<void> =>
      fetch(`${API_BASE_URL}/bank-movements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
    delete: (id: string): Promise<void> =>
      fetch(`${API_BASE_URL}/bank-movements/${id}`, { method: 'DELETE' }).then(handleResponse),
  },
};
