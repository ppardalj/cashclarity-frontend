export type AccountType = 'main' | 'space' | 'entity' | 'other';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isSystem?: boolean;
  active: boolean;
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalLine[];
}

export interface BankMovement {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive for income, negative for expense
  isIdentified: boolean;
  entityId?: string;
  journalEntryId?: string;
}
