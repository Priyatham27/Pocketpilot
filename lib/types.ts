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
  targetAmount: number; // Income target
  currentEarned: number;
  savingsTargetAmount?: number; // Savings target
  spendingLimitAmount?: number; // Spending limit target
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  type:
    | 'debt_due'
    | 'loan_payment'
    | 'target_achieved'
    | 'large_expense'
    | 'bill_due'
    | 'purchase_due'
    | 'priority_purchase_due'
    | 'savings_goal_deadline'
    | 'monthly_goal_achieved'
    | 'trip_date_approaching'
    | 'trip_budget_funded'
    | 'trip_underfunded'
    | 'trip_target_near'
    | 'financial_note_reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  relatedId?: string;
}

export type PurchasePriority = 'low' | 'medium' | 'high';
export type PurchaseStatus = 'planned' | 'saving' | 'ready_to_buy' | 'purchased';

export interface PurchasePlannerItem {
  id: string;
  itemName: string;
  estimatedCost: number;
  category: string;
  priority: PurchasePriority;
  targetDate: string;
  notes: string;
  status: PurchaseStatus;
  createdAt: number;
  updatedAt: number;
}

export type PriorityLevel = 'low' | 'medium' | 'high';

export interface PriorityPurchaseItem {
  id: string;
  itemName: string;
  estimatedCost: number;
  deadline: string;
  priority: PriorityLevel;
  notes: string;
  purchased: boolean;
  createdAt: number;
  updatedAt: number;
}

export type BillStatus = 'pending' | 'paid' | 'overdue';

export interface Bill {
  id: string;
  billName: string;
  amount: number;
  dueDate: string;
  category: string;
  notes: string;
  status: BillStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SavingsGoal {
  id: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  deadline: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Settings {
  currency: Currency;
  theme: 'light' | 'dark' | 'system';
  largeExpenseThreshold: number;
  userName?: string;
}

export type TripStatus = 'planning' | 'saving_money' | 'budget_ready' | 'trip_completed' | 'cancelled';
export type TripPaymentStatus = 'not_started' | 'partially_funded' | 'fully_funded' | 'booked' | 'completed';

export interface TripContribution {
  id: string;
  amount: number;
  date: string;
  time: string;
  timestamp: number;
  notes?: string;
}

export interface TripExpenseBreakdown {
  travel: number;
  hotel: number;
  food: number;
  shopping: number;
  activities: number;
  emergency: number;
  misc: number;
}

export interface Trip {
  id: string;
  tripName: string;
  destination: string;
  estimatedBudget: number;
  targetTravelDate: string;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  status: TripStatus;
  paymentStatus: TripPaymentStatus;
  savedAmount: number;
  expenses: TripExpenseBreakdown;
  contributions: TripContribution[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  transactions: Transaction[];
  debts: Debt[];
  loans: Loan[];
  monthlyTargets: MonthlyTarget[];
  notifications: Notification[];
  settings: Settings;
  purchasePlanner: PurchasePlannerItem[];
  priorityPurchases: PriorityPurchaseItem[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  trips: Trip[];
  financialNotes: FinancialNote[];
  quoteOfTheDay: QuoteState | null;
  shownQuoteIndexes: number[];
  notifiedIds: string[];
}

export interface FinancialNote {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  pinned: boolean;
  status: 'active' | 'archived';
  date: string;
  reminderDate?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Quote {
  quote: string;
  author?: string;
}

export interface QuoteState {
  quote: string;
  author: string;
  date: string;
}


