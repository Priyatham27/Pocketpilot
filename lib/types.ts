export type TransactionType = 'income' | 'expense';

export type DebtStatus = 'pending' | 'partially_paid' | 'paid';
export type LoanStatus = 'pending' | 'partially_paid' | 'completed';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';

export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'business'
  | 'investment'
  | 'gift'
  | 'refund'
  | 'bonus'
  | 'rental'
  | 'other';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'travel'
  | 'groceries'
  | 'subscriptions'
  | 'investment'
  | 'gifts'
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory;
  description: string;
  date: string;
  time: string;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  paymentMethod?: PaymentMethod;
  source?: string;
  recurring?: boolean;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  remainingAmount: number;
  reason: string;
  dueDate: string;
  status: DebtStatus;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  originalAmount: number;
  remainingAmount: number;
  interest?: number;
  dueDate: string;
  status: LoanStatus;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyTarget {
  id: string;
  month: string; // YYYY-MM format
  targetAmount: number;
  currentEarned: number;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  type: 'debt_due' | 'loan_payment' | 'target_achieved' | 'large_expense';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  relatedId?: string;
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Settings {
  currency: Currency;
  theme: 'light' | 'dark' | 'system';
  largeExpenseThreshold: number;
}

export interface AppState {
  transactions: Transaction[];
  debts: Debt[];
  loans: Loan[];
  monthlyTargets: MonthlyTarget[];
  notifications: Notification[];
  settings: Settings;
}
