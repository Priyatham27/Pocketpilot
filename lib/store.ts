'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quotes } from './quotes';
import {
  Transaction,
  Debt,
  Loan,
  MonthlyTarget,
  Notification,
  Settings,
  Currency,
  PurchasePlannerItem,
  PriorityPurchaseItem,
  Bill,
  SavingsGoal,
  Trip,
  TripContribution,
  TripExpenseBreakdown,
  TripPaymentStatus,
  FinancialNote,
  QuoteState
} from './types';

interface AppState {
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

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  // Loan actions
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;

  // Monthly target actions
  setMonthlyTarget: (target: Omit<MonthlyTarget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMonthlyTarget: (id: string, updates: Partial<MonthlyTarget>) => void;
  deleteMonthlyTarget: (id: string) => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Settings actions
  updateSettings: (updates: Partial<Settings>) => void;
  setCurrency: (currency: Currency) => void;

  // Purchase Planner actions
  addPurchasePlannerItem: (item: Omit<PurchasePlannerItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePurchasePlannerItem: (id: string, updates: Partial<PurchasePlannerItem>) => void;
  deletePurchasePlannerItem: (id: string) => void;

  // Priority Purchases actions
  addPriorityPurchase: (item: Omit<PriorityPurchaseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePriorityPurchase: (id: string, updates: Partial<PriorityPurchaseItem>) => void;
  deletePriorityPurchase: (id: string) => void;

  // Bills & Payments actions
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;

  // Savings Goals actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'remainingAmount'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addSavingsToGoal: (id: string, amount: number) => void;

  // Trip Planner actions
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'savedAmount' | 'contributions'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  addTripContribution: (tripId: string, contribution: Omit<TripContribution, 'id' | 'date' | 'time' | 'timestamp'>) => void;
  deleteTripContribution: (tripId: string, contributionId: string) => void;

  // Financial Notes actions
  addFinancialNote: (note: Omit<FinancialNote, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'pinned'>) => void;
  updateFinancialNote: (id: string, updates: Partial<FinancialNote>) => void;
  deleteFinancialNote: (id: string) => void;
  pinFinancialNote: (id: string) => void;
  archiveFinancialNote: (id: string) => void;

  // Local notifications tracker
  addNotifiedId: (id: string) => void;

  // Quote actions
  setQuoteOfTheDay: (quote: QuoteState) => void;
  resetQuoteIndexPool: () => void;
  pickDailyQuote: () => { quote: string; author: string };

  // Data actions
  clearAllData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
};

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      transactions: [],
      debts: [],
      loans: [],
      monthlyTargets: [],
      notifications: [],
      settings: {
        currency: 'INR',
        theme: 'system',
        largeExpenseThreshold: 10000,
        userName: 'Priyatham',
      },
      purchasePlanner: [],
      priorityPurchases: [],
      bills: [],
      savingsGoals: [],
      trips: [],
      financialNotes: [],
      quoteOfTheDay: null,
      shownQuoteIndexes: [],
      notifiedIds: [],

      // Transaction actions
      addTransaction: (transaction) => set((state) => {
        const now = Date.now();
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        // Check for large expense
        if (transaction.type === 'expense' && transaction.amount >= state.settings.largeExpenseThreshold) {
          state.addNotification({
            type: 'large_expense',
            title: 'Large Expense Alert',
            message: `You recorded an expense of ₹${transaction.amount.toLocaleString()}`,
            read: false,
          });
        }

        return { transactions: [newTransaction, ...state.transactions] };
      }),

      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
        ),
      })),

      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),

      // Debt actions
      addDebt: (debt) => set((state) => {
        const now = Date.now();
        const newDebt: Debt = {
          ...debt,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        return { debts: [newDebt, ...state.debts] };
      }),

      updateDebt: (id, updates) => set((state) => ({
        debts: state.debts.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
        ),
      })),

      deleteDebt: (id) => set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
      })),

      // Loan actions
      addLoan: (loan) => set((state) => {
        const now = Date.now();
        const newLoan: Loan = {
          ...loan,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        return { loans: [newLoan, ...state.loans] };
      }),

      updateLoan: (id, updates) => set((state) => ({
        loans: state.loans.map((l) =>
          l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
        ),
      })),

      deleteLoan: (id) => set((state) => ({
        loans: state.loans.filter((l) => l.id !== id),
      })),

      // Monthly target actions
      setMonthlyTarget: (target) => set((state) => {
        const now = Date.now();
        const existingIndex = state.monthlyTargets.findIndex(t => t.month === target.month);

        if (existingIndex >= 0) {
          const updated = [...state.monthlyTargets];
          updated[existingIndex] = {
            ...updated[existingIndex],
            targetAmount: target.targetAmount,
            savingsTargetAmount: target.savingsTargetAmount !== undefined ? target.savingsTargetAmount : updated[existingIndex].savingsTargetAmount,
            spendingLimitAmount: target.spendingLimitAmount !== undefined ? target.spendingLimitAmount : updated[existingIndex].spendingLimitAmount,
            updatedAt: now,
          };
          return { monthlyTargets: updated };
        }

        const newTarget: MonthlyTarget = {
          ...target,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        return { monthlyTargets: [newTarget, ...state.monthlyTargets] };
      }),

      updateMonthlyTarget: (id, updates) => set((state) => ({
        monthlyTargets: state.monthlyTargets.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
        ),
      })),

      deleteMonthlyTarget: (id) => set((state) => ({
        monthlyTargets: state.monthlyTargets.filter((t) => t.id !== id),
      })),

      // Notification actions
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          createdAt: Date.now(),
        };
        return { notifications: [newNotification, ...state.notifications] };
      }),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

      clearNotifications: () => set({ notifications: [] }),

      // Settings actions
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      setCurrency: (currency) => set((state) => ({
        settings: { ...state.settings, currency },
      })),

      // Purchase Planner actions
      addPurchasePlannerItem: (item) => set((state) => {
        const now = Date.now();
        const newItem: PurchasePlannerItem = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        return { purchasePlanner: [newItem, ...state.purchasePlanner] };
      }),

      updatePurchasePlannerItem: (id, updates) => set((state) => ({
        purchasePlanner: state.purchasePlanner.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
        ),
      })),

      deletePurchasePlannerItem: (id) => set((state) => ({
        purchasePlanner: state.purchasePlanner.filter((item) => item.id !== id),
      })),

      // Priority Purchases actions
      addPriorityPurchase: (item) => set((state) => {
        const now = Date.now();
        const newItem: PriorityPurchaseItem = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        return { priorityPurchases: [newItem, ...state.priorityPurchases] };
      }),

      updatePriorityPurchase: (id, updates) => set((state) => ({
        priorityPurchases: state.priorityPurchases.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
        ),
      })),

      deletePriorityPurchase: (id) => set((state) => ({
        priorityPurchases: state.priorityPurchases.filter((item) => item.id !== id),
      })),

      // Bills & Payments actions
      addBill: (bill) => set((state) => {
        const now = Date.now();
        const newBill: Bill = {
          ...bill,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        return { bills: [newBill, ...state.bills] };
      }),

      updateBill: (id, updates) => set((state) => ({
        bills: state.bills.map((bill) =>
          bill.id === id ? { ...bill, ...updates, updatedAt: Date.now() } : bill
        ),
      })),

      deleteBill: (id) => set((state) => ({
        bills: state.bills.filter((bill) => bill.id !== id),
      })),

      // Savings Goals actions
      addSavingsGoal: (goal) => set((state) => {
        const now = Date.now();
        const newGoal: SavingsGoal = {
          ...goal,
          id: generateId(),
          remainingAmount: Math.max(0, goal.targetAmount - goal.savedAmount),
          createdAt: now,
          updatedAt: now,
        };
        return { savingsGoals: [newGoal, ...state.savingsGoals] };
      }),

      updateSavingsGoal: (id, updates) => set((state) => ({
        savingsGoals: state.savingsGoals.map((goal) => {
          if (goal.id === id) {
            const merged = { ...goal, ...updates, updatedAt: Date.now() };
            merged.remainingAmount = Math.max(0, merged.targetAmount - merged.savedAmount);
            return merged;
          }
          return goal;
        }),
      })),

      deleteSavingsGoal: (id) => set((state) => ({
        savingsGoals: state.savingsGoals.filter((goal) => goal.id !== id),
      })),

      addSavingsToGoal: (id, amount) => set((state) => ({
        savingsGoals: state.savingsGoals.map((goal) => {
          if (goal.id === id) {
            const savedAmount = goal.savedAmount + amount;
            const remainingAmount = Math.max(0, goal.targetAmount - savedAmount);
            return {
              ...goal,
              savedAmount,
              remainingAmount,
              updatedAt: Date.now(),
            };
          }
          return goal;
        }),
      })),

      // Trip Planner actions
      addTrip: (trip) => set((state) => {
        const now = Date.now();
        const newTrip: Trip = {
          ...trip,
          id: generateId(),
          savedAmount: 0,
          contributions: [],
          createdAt: now,
          updatedAt: now,
        };
        return { trips: [newTrip, ...state.trips] };
      }),

      updateTrip: (id, updates) => set((state) => ({
        trips: state.trips.map((t) => {
          if (t.id === id) {
            const merged = { ...t, ...updates, updatedAt: Date.now() };
            if (updates.expenses) {
              const e = updates.expenses;
              merged.estimatedBudget = e.travel + e.hotel + e.food + e.shopping + e.activities + e.emergency + e.misc;
            }
            if (merged.savedAmount >= merged.estimatedBudget) {
              merged.paymentStatus = 'fully_funded';
            } else if (merged.savedAmount > 0) {
              merged.paymentStatus = 'partially_funded';
            } else {
              merged.paymentStatus = 'not_started';
            }
            return merged;
          }
          return t;
        }),
      })),

      deleteTrip: (id) => set((state) => ({
        trips: state.trips.filter((t) => t.id !== id),
      })),

      addTripContribution: (tripId, contribution) => set((state) => {
        const now = Date.now();
        const time = getCurrentTime();
        const date = getCurrentDate();
        const newContribution: TripContribution = {
          ...contribution,
          id: generateId(),
          date,
          time,
          timestamp: now,
        };

        const updatedTrips = state.trips.map((t) => {
          if (t.id === tripId) {
            const savedAmount = t.savedAmount + contribution.amount;
            const contributions = [newContribution, ...t.contributions];
            const paymentStatus: TripPaymentStatus = savedAmount >= t.estimatedBudget ? 'fully_funded' : 'partially_funded';

            if (savedAmount >= t.estimatedBudget && t.savedAmount < t.estimatedBudget) {
              state.addNotification({
                type: 'trip_budget_funded',
                title: 'Trip Fully Funded! 🎉',
                message: `Congratulations! Your budget for "${t.tripName}" (₹${t.estimatedBudget.toLocaleString()}) is fully funded.`,
                read: false,
                relatedId: t.id,
              });
            }

            return {
              ...t,
              savedAmount,
              contributions,
              paymentStatus,
              updatedAt: now,
            };
          }
          return t;
        });

        return { trips: updatedTrips };
      }),

      deleteTripContribution: (tripId, contributionId) => set((state) => {
        const updatedTrips = state.trips.map((t) => {
          if (t.id === tripId) {
            const contributionToRemove = t.contributions.find((c) => c.id === contributionId);
            const subAmount = contributionToRemove ? contributionToRemove.amount : 0;
            const contributions = t.contributions.filter((c) => c.id !== contributionId);
            const savedAmount = Math.max(0, t.savedAmount - subAmount);
            const paymentStatus: TripPaymentStatus = savedAmount >= t.estimatedBudget 
              ? 'fully_funded' 
              : savedAmount > 0 
              ? 'partially_funded' 
              : 'not_started';

            return {
              ...t,
              savedAmount,
              contributions,
              paymentStatus,
              updatedAt: Date.now(),
            };
          }
          return t;
        });

        return { trips: updatedTrips };
      }),

      // Financial Notes actions
      addFinancialNote: (note) => set((state) => {
        const now = Date.now();
        const newNote: FinancialNote = {
          ...note,
          id: generateId(),
          status: 'active',
          pinned: false,
          createdAt: now,
          updatedAt: now,
        };
        return { financialNotes: [newNote, ...state.financialNotes] };
      }),

      updateFinancialNote: (id, updates) => set((state) => ({
        financialNotes: state.financialNotes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        ),
      })),

      deleteFinancialNote: (id) => set((state) => ({
        financialNotes: state.financialNotes.filter((n) => n.id !== id),
      })),

      pinFinancialNote: (id) => set((state) => ({
        financialNotes: state.financialNotes.map((n) =>
          n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
        ),
      })),

      archiveFinancialNote: (id) => set((state) => ({
        financialNotes: state.financialNotes.map((n) =>
          n.id === id ? { ...n, status: n.status === 'archived' ? 'active' : 'archived', updatedAt: Date.now() } : n
        ),
      })),

      // Local notifications tracker
      addNotifiedId: (id) => set((state) => ({
        notifiedIds: [...state.notifiedIds, id],
      })),

      // Quote actions
      setQuoteOfTheDay: (quote) => set({ quoteOfTheDay: quote }),
      resetQuoteIndexPool: () => set({ shownQuoteIndexes: [] }),
      pickDailyQuote: () => {
        const state = get();
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (state.quoteOfTheDay && state.quoteOfTheDay.date === todayStr) {
          return { quote: state.quoteOfTheDay.quote, author: state.quoteOfTheDay.author || 'Unknown' };
        }

        let availableIndexes = quotes.map((_, i) => i).filter(i => !state.shownQuoteIndexes.includes(i));
        
        if (availableIndexes.length === 0) {
          availableIndexes = quotes.map((_, i) => i);
          // Set indexes directly to allow immediate selection
          set({ shownQuoteIndexes: [] });
        }

        const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
        const selectedQuote = quotes[randomIndex];
        
        const newState: QuoteState = {
          quote: selectedQuote.quote,
          author: selectedQuote.author || 'Unknown',
          date: todayStr
        };

        set((s) => ({
          quoteOfTheDay: newState,
          shownQuoteIndexes: [...s.shownQuoteIndexes, randomIndex]
        }));

        return { quote: selectedQuote.quote, author: selectedQuote.author || 'Unknown' };
      },

      // Data actions
      clearAllData: () => {
        if (typeof window !== 'undefined' && confirm('Are you sure you want to delete all data? This cannot be undone.')) {
          set({
            transactions: [],
            debts: [],
            loans: [],
            monthlyTargets: [],
            notifications: [],
            settings: {
              currency: 'INR',
              theme: 'system',
              largeExpenseThreshold: 10000,
              userName: 'Priyatham',
            },
            purchasePlanner: [],
            priorityPurchases: [],
            bills: [],
            savingsGoals: [],
            trips: [],
            financialNotes: [],
            quoteOfTheDay: null,
            shownQuoteIndexes: [],
            notifiedIds: [],
          });
          return true;
        }
        return false;
      },

      exportData: () => {
        const state = get();
        const data = {
          transactions: state.transactions,
          debts: state.debts,
          loans: state.loans,
          monthlyTargets: state.monthlyTargets,
          settings: state.settings,
          purchasePlanner: state.purchasePlanner,
          priorityPurchases: state.priorityPurchases,
          bills: state.bills,
          savingsGoals: state.savingsGoals,
          trips: state.trips,
          financialNotes: state.financialNotes,
          quoteOfTheDay: state.quoteOfTheDay,
          shownQuoteIndexes: state.shownQuoteIndexes,
          notifiedIds: state.notifiedIds,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.transactions && parsed.debts && parsed.loans && parsed.monthlyTargets) {
            set({
              transactions: parsed.transactions,
              debts: parsed.debts,
              loans: parsed.loans,
              monthlyTargets: parsed.monthlyTargets,
              settings: parsed.settings || get().settings,
              purchasePlanner: parsed.purchasePlanner || [],
              priorityPurchases: parsed.priorityPurchases || [],
              bills: parsed.bills || [],
              savingsGoals: parsed.savingsGoals || [],
              trips: parsed.trips || [],
              financialNotes: parsed.financialNotes || [],
              quoteOfTheDay: parsed.quoteOfTheDay || null,
              shownQuoteIndexes: parsed.shownQuoteIndexes || [],
              notifiedIds: parsed.notifiedIds || [],
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'pocketpilot-storage',
    }
  )
);

// Computed values / Selectors
export const useSelectors = () => {
  const transactions = useAppStore((state) => state.transactions);
  const debts = useAppStore((state) => state.debts);
  const loans = useAppStore((state) => state.loans);
  const monthlyTargets = useAppStore((state) => state.monthlyTargets);
  const settings = useAppStore((state) => state.settings);
  const purchasePlanner = useAppStore((state) => state.purchasePlanner) || [];
  const priorityPurchases = useAppStore((state) => state.priorityPurchases) || [];
  const bills = useAppStore((state) => state.bills) || [];
  const savingsGoals = useAppStore((state) => state.savingsGoals) || [];
  const trips = useAppStore((state) => state.trips) || [];

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  const outstandingDebts = debts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const outstandingLoans = loans
    .filter((l) => l.status !== 'completed')
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const currentMonth = getCurrentMonth();
  const currentMonthTarget = monthlyTargets.find((t) => t.month === currentMonth);

  const currentMonthIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpense = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthSavings = Math.max(0, currentMonthIncome - currentMonthExpense);

  const upcomingPayments = debts
    .filter((d) => d.status !== 'paid' && d.remainingAmount > 0)
    .reduce((sum, d) => sum + d.remainingAmount, 0) +
    loans
    .filter((l) => l.status !== 'completed' && l.remainingAmount > 0)
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const safeToSpend = currentBalance - upcomingPayments;

  const monthlyTargetProgress = currentMonthTarget
    ? Math.min(100, (currentMonthIncome / currentMonthTarget.targetAmount) * 100)
    : 0;

  // New Selector Computations
  // 1. Purchase Planner
  const totalPlannedPurchasesCount = purchasePlanner.filter((p) => p.status !== 'purchased').length;
  const totalPlannedCost = purchasePlanner
    .filter((p) => p.status !== 'purchased')
    .reduce((sum, p) => sum + p.estimatedCost, 0);
  const highPriorityPurchasesCount = purchasePlanner
    .filter((p) => p.status !== 'purchased' && p.priority === 'high').length;

  // 2. Priority Purchases
  const pendingPriorityPurchasesCount = priorityPurchases.filter((p) => !p.purchased).length;
  const totalImmediateCostRequired = priorityPurchases
    .filter((p) => !p.purchased)
    .reduce((sum, p) => sum + p.estimatedCost, 0);

  // 3. Bills
  const upcomingBillsCount = bills.filter((b) => b.status !== 'paid').length;
  const totalBillsDueAmount = bills
    .filter((b) => b.status !== 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  // 4. Savings Goals
  const savingsGoalsCount = savingsGoals.length;
  const totalSavedAmount = savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const savingsGoalsProgress = totalSavingsTarget > 0 ? (totalSavedAmount / totalSavingsTarget) * 100 : 0;

  // 5. Monthly Goals Expansion
  const currentMonthSavingsTarget = currentMonthTarget?.savingsTargetAmount || 0;
  const currentMonthSpendingLimit = currentMonthTarget?.spendingLimitAmount || 0;

  const monthlyTargetSavingsProgress = currentMonthSavingsTarget > 0
    ? Math.min(100, (currentMonthSavings / currentMonthSavingsTarget) * 100)
    : 0;

  const monthlyTargetSpendingProgress = currentMonthSpendingLimit > 0
    ? Math.min(100, (currentMonthExpense / currentMonthSpendingLimit) * 100)
    : 0;

  // 6. Trip Planner Selectors
  const totalPlannedTrips = trips.filter((t) => t.status !== 'trip_completed' && t.status !== 'cancelled').length;
  const totalBudgetRequired = trips
    .filter((t) => t.status !== 'trip_completed' && t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.estimatedBudget, 0);
  const totalMoneyReserved = trips
    .filter((t) => t.status !== 'trip_completed' && t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.savedAmount, 0);
  const upcomingTrips = trips
    .filter((t) => t.status !== 'trip_completed' && t.status !== 'cancelled')
    .sort((a, b) => a.targetTravelDate.localeCompare(b.targetTravelDate));
  const tripsReadyToBook = trips.filter(
    (t) => (t.status !== 'trip_completed' && t.status !== 'cancelled') && (t.paymentStatus === 'fully_funded' || t.savedAmount >= t.estimatedBudget)
  ).length;

  return {
    totalIncome,
    totalExpenses,
    currentBalance,
    outstandingDebts,
    outstandingLoans,
    currentMonthTarget,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthSavings,
    upcomingPayments,
    safeToSpend,
    monthlyTargetProgress,
    currency: settings.currency,
    // Expanded Selectors
    totalPlannedPurchasesCount,
    totalPlannedCost,
    highPriorityPurchasesCount,
    pendingPriorityPurchasesCount,
    totalImmediateCostRequired,
    upcomingBillsCount,
    totalBillsDueAmount,
    savingsGoalsCount,
    totalSavedAmount,
    totalSavingsTarget,
    savingsGoalsProgress,
    currentMonthSavingsTarget,
    currentMonthSpendingLimit,
    monthlyTargetSavingsProgress,
    monthlyTargetSpendingProgress,
    // Trips Selectors
    totalPlannedTrips,
    totalBudgetRequired,
    totalMoneyReserved,
    upcomingTrips,
    tripsReadyToBook,
  };
};

// Helper functions
export { getCurrentTime, getCurrentDate, getCurrentMonth };
