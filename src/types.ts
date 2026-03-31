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

export interface Bucket {
  id: string;
  name: string;
  description?: string;
  isDefaultOperational: boolean;
  active: boolean;
}

export interface Entity {
  id: string;
  name: string;
  aliases?: string[];
  notes?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive for income, negative for expense
  entityId?: string;
  incomeAllocations: IncomeAllocation[];
  expenseBucketId?: string; // For expenses, only one bucket
  reviewStatus: 'pending' | 'reviewed';
  notes?: string;
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

export interface IncomeAllocation {
  bucketId: string;
  amount: number;
}
