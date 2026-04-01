import { Account, JournalEntry, BankMovement } from './types';
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:54321/';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }
  return res.json();
};

export const api = {
  accounts: {
    getAll: async (): Promise<Account[]> => 
      fetch(`${API_BASE_URL}/accounts`, { headers: await getHeaders() }).then(handleResponse).then(data => data.map((a: any) => new Account(a))),
    create: async (account: Omit<Account, 'id'>): Promise<Account> =>
      fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(account),
      }).then(handleResponse).then(data => new Account(data)),
    update: async (id: string, updates: Partial<Account>): Promise<void> =>
      fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(updates),
      }).then(handleResponse),
    delete: async (id: string): Promise<void> =>
      fetch(`${API_BASE_URL}/accounts/${id}`, { 
        method: 'DELETE',
        headers: await getHeaders()
      }).then(handleResponse),
  },

  journalEntries: {
    getAll: async (): Promise<JournalEntry[]> => 
      fetch(`${API_BASE_URL}/journal-entries`, { headers: await getHeaders() }).then(handleResponse).then(data => data.map((e: any) => new JournalEntry(e))),
    create: async (entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> =>
      fetch(`${API_BASE_URL}/journal-entries`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(entry),
      }).then(handleResponse).then(data => new JournalEntry(data)),
    update: async (id: string, updates: Partial<JournalEntry>): Promise<void> =>
      fetch(`${API_BASE_URL}/journal-entries/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(updates),
      }).then(handleResponse),
    delete: async (id: string): Promise<void> =>
      fetch(`${API_BASE_URL}/journal-entries/${id}`, { 
        method: 'DELETE',
        headers: await getHeaders()
      }).then(handleResponse),
  },

  bankMovements: {
    getAll: async (): Promise<BankMovement[]> => 
      fetch(`${API_BASE_URL}/bank-movements`, { headers: await getHeaders() }).then(handleResponse).then(data => data.map((m: any) => new BankMovement(m))),
    create: async (movement: Omit<BankMovement, 'id' | 'isIdentified'>): Promise<BankMovement> =>
      fetch(`${API_BASE_URL}/bank-movements`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(movement),
      }).then(handleResponse).then(data => new BankMovement(data)),
    update: async (id: string, updates: Partial<BankMovement>): Promise<void> =>
      fetch(`${API_BASE_URL}/bank-movements/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(updates),
      }).then(handleResponse),
    delete: async (id: string): Promise<void> =>
      fetch(`${API_BASE_URL}/bank-movements/${id}`, { 
        method: 'DELETE',
        headers: await getHeaders()
      }).then(handleResponse),
  },
};
