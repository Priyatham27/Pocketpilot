'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Transaction,
  Debt,
  Loan,
  MonthlyTarget,
  Notification,
  Settings,
  Currency
} from './types';

interface AppState {
  transactions: Transaction[];
  debts: Debt[];
  loans: Loan[];
  monthlyTargets: MonthlyTarget[];
  notifications: Notification[];
  settings: Settings;

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
      },

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
            },
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

  return {
    totalIncome,
    totalExpenses,
    currentBalance,
    outstandingDebts,
    outstandingLoans,
    currentMonthTarget,
    currentMonthIncome,
    upcomingPayments,
    safeToSpend,
    monthlyTargetProgress,
    currency: settings.currency,
  };
};

// Helper functions
export { getCurrentTime, getCurrentDate, getCurrentMonth };
