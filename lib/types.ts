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
  localDataImported: boolean;
  fetchUserData: () => Promise<void>;
  clearUserData: () => void;
  migrateLocalStorageToCloud: () => Promise<boolean>;
  skipLocalStorageMigration: () => Promise<boolean>;

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  // Loan actions
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;

  // Monthly target actions
  setMonthlyTarget: (target: Omit<MonthlyTarget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMonthlyTarget: (id: string, updates: Partial<MonthlyTarget>) => Promise<void>;
  deleteMonthlyTarget: (id: string) => Promise<void>;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Settings actions
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;

  // Purchase Planner actions
  addPurchasePlannerItem: (item: Omit<PurchasePlannerItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePurchasePlannerItem: (id: string, updates: Partial<PurchasePlannerItem>) => Promise<void>;
  deletePurchasePlannerItem: (id: string) => Promise<void>;

  // Priority Purchases actions
  addPriorityPurchase: (item: Omit<PriorityPurchaseItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePriorityPurchase: (id: string, updates: Partial<PriorityPurchaseItem>) => Promise<void>;
  deletePriorityPurchase: (id: string) => Promise<void>;

  // Bills & Payments actions
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;

  // Savings Goals actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'remainingAmount'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavingsToGoal: (id: string, amount: number) => Promise<void>;

  // Trip Planner actions
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'savedAmount' | 'contributions'>) => Promise<void>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addTripContribution: (tripId: string, contribution: Omit<TripContribution, 'id' | 'date' | 'time' | 'timestamp'>) => Promise<void>;
  deleteTripContribution: (tripId: string, contributionId: string) => Promise<void>;

  // Financial Notes actions
  addFinancialNote: (note: Omit<FinancialNote, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'pinned'>) => Promise<void>;
  updateFinancialNote: (id: string, updates: Partial<FinancialNote>) => Promise<void>;
  deleteFinancialNote: (id: string) => Promise<void>;
  pinFinancialNote: (id: string) => Promise<void>;
  archiveFinancialNote: (id: string) => Promise<void>;

  // Local notifications tracker
  addNotifiedId: (id: string) => Promise<void>;

  // Quote actions
  setQuoteOfTheDay: (quote: QuoteState) => void;
  resetQuoteIndexPool: () => void;
  pickDailyQuote: () => { quote: string; author: string };

  // Data actions
  clearAllData: () => boolean;
  exportData: () => string;
  importData: (data: string) => boolean;
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


