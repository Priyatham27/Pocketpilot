'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quotes } from './quotes';
import { supabase, mapToSnake, mapToCamel } from './supabase';
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
  QuoteState,
  AppState
} from './types';

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
      localDataImported: false,

      // Sync & Initialization from Supabase
      fetchUserData: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user;
          if (!user) return;

          // Fetch user profile / settings
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // Fetch all modules in parallel
          const [
            { data: txs },
            { data: dbts },
            { data: lns },
            { data: blls },
            { data: pp },
            { data: prioP },
            { data: savG },
            { data: mthG },
            { data: trps },
            { data: notes },
            { data: notifs }
          ] = await Promise.all([
            supabase.from('transactions').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
            supabase.from('debts').select('*').eq('user_id', user.id),
            supabase.from('loans').select('*').eq('user_id', user.id),
            supabase.from('bills').select('*').eq('user_id', user.id),
            supabase.from('purchase_planner').select('*').eq('user_id', user.id),
            supabase.from('priority_purchases').select('*').eq('user_id', user.id),
            supabase.from('savings_goals').select('*').eq('user_id', user.id),
            supabase.from('monthly_goals').select('*').eq('user_id', user.id),
            supabase.from('trip_planner').select('*').eq('user_id', user.id),
            supabase.from('financial_notes').select('*').eq('user_id', user.id),
            supabase.from('notifications').select('*').eq('user_id', user.id)
          ]);

          set({
            transactions: mapToCamel(txs || []),
            debts: mapToCamel(dbts || []),
            loans: mapToCamel(lns || []),
            bills: mapToCamel(blls || []),
            purchasePlanner: mapToCamel(pp || []),
            priorityPurchases: mapToCamel(prioP || []),
            savingsGoals: mapToCamel(savG || []),
            monthlyTargets: mapToCamel(mthG || []),
            trips: mapToCamel(trps || []),
            financialNotes: mapToCamel(notes || []),
            notifications: mapToCamel(notifs || []),
            shownQuoteIndexes: profile?.shown_quote_indexes || [],
            notifiedIds: profile?.notified_ids || [],
            localDataImported: profile?.local_data_imported || false,
            settings: {
              currency: profile?.currency || 'INR',
              theme: profile?.theme || 'system',
              largeExpenseThreshold: Number(profile?.large_expense_threshold) || 10000,
              userName: profile?.display_name || user.email?.split('@')[0] || 'Priyatham',
            }
          });
        } catch (err) {
          console.error('Error fetching user data from Supabase:', err);
        }
      },

      clearUserData: () => {
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
          localDataImported: false,
        });
      },

      migrateLocalStorageToCloud: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user;
          if (!user) return false;

          const rawData = localStorage.getItem('pocketpilot-storage');
          if (!rawData) return false;

          const parsed = JSON.parse(rawData);
          const stateData = parsed.state || {};

          const mapWithUserId = (list: any[]) =>
            (list || []).map((item) => mapToSnake({ ...item, userId: user.id }));

          const promises = [];

          if (stateData.transactions?.length) {
            promises.push(supabase.from('transactions').insert(mapWithUserId(stateData.transactions)));
          }
          if (stateData.debts?.length) {
            promises.push(supabase.from('debts').insert(mapWithUserId(stateData.debts)));
          }
          if (stateData.loans?.length) {
            promises.push(supabase.from('loans').insert(mapWithUserId(stateData.loans)));
          }
          if (stateData.bills?.length) {
            promises.push(supabase.from('bills').insert(mapWithUserId(stateData.bills)));
          }
          if (stateData.purchasePlanner?.length) {
            promises.push(supabase.from('purchase_planner').insert(mapWithUserId(stateData.purchasePlanner)));
          }
          if (stateData.priorityPurchases?.length) {
            promises.push(supabase.from('priority_purchases').insert(mapWithUserId(stateData.priorityPurchases)));
          }
          if (stateData.savingsGoals?.length) {
            promises.push(supabase.from('savings_goals').insert(mapWithUserId(stateData.savingsGoals)));
          }
          if (stateData.monthlyTargets?.length) {
            promises.push(supabase.from('monthly_goals').insert(mapWithUserId(stateData.monthlyTargets)));
          }
          if (stateData.trips?.length) {
            promises.push(supabase.from('trip_planner').insert(mapWithUserId(stateData.trips)));
          }
          if (stateData.financialNotes?.length) {
            promises.push(supabase.from('financial_notes').insert(mapWithUserId(stateData.financialNotes)));
          }
          if (stateData.notifications?.length) {
            promises.push(supabase.from('notifications').insert(mapWithUserId(stateData.notifications)));
          }

          await Promise.all(promises);

          // Update import flag
          await supabase
            .from('user_profiles')
            .update({ local_data_imported: true })
            .eq('id', user.id);

          set({ localDataImported: true });

          // Re-fetch all data to ensure local Zustand store matches cloud state
          await get().fetchUserData();
          return true;
        } catch (err) {
          console.error('Data migration error:', err);
          return false;
        }
      },

      skipLocalStorageMigration: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user;
          if (!user) return false;

          await supabase
            .from('user_profiles')
            .update({ local_data_imported: true })
            .eq('id', user.id);

          set({ localDataImported: true });
          return true;
        } catch (err) {
          console.error('Skip migration error:', err);
          return false;
        }
      },

      // Transaction actions
      addTransaction: async (transaction) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const dbRow = mapToSnake({ ...newTransaction, userId: user.id });
        await supabase.from('transactions').insert(dbRow);

        set((state) => {
          // Check for large expense notification
          if (transaction.type === 'expense' && transaction.amount >= state.settings.largeExpenseThreshold) {
            state.addNotification({
              type: 'large_expense',
              title: 'Large Expense Alert',
              message: `You recorded an expense of ₹${transaction.amount.toLocaleString()}`,
              read: false,
            });
          }
          return { transactions: [newTransaction, ...state.transactions] };
        });
      },

      updateTransaction: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase
          .from('transactions')
          .update(mapToSnake(updatedData))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }));
      },

      deleteTransaction: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      // Debt actions
      addDebt: async (debt) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newDebt: Debt = {
          ...debt,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('debts').insert(mapToSnake({ ...newDebt, userId: user.id }));

        set((state) => ({ debts: [newDebt, ...state.debts] }));
      },

      updateDebt: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase.from('debts').update(mapToSnake(updatedData)).eq('id', id).eq('user_id', user.id);

        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
          ),
        }));
      },

      deleteDebt: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        }));
      },

      // Loan actions
      addLoan: async (loan) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newLoan: Loan = {
          ...loan,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('loans').insert(mapToSnake({ ...newLoan, userId: user.id }));

        set((state) => ({ loans: [newLoan, ...state.loans] }));
      },

      updateLoan: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase.from('loans').update(mapToSnake(updatedData)).eq('id', id).eq('user_id', user.id);

        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
          ),
        }));
      },

      deleteLoan: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('loans').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          loans: state.loans.filter((l) => l.id !== id),
        }));
      },

      // Monthly target actions
      setMonthlyTarget: async (target) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const existingIndex = get().monthlyTargets.findIndex((t) => t.month === target.month);

        if (existingIndex >= 0) {
          const existing = get().monthlyTargets[existingIndex];
          const updatedTarget: MonthlyTarget = {
            ...existing,
            targetAmount: target.targetAmount,
            savingsTargetAmount:
              target.savingsTargetAmount !== undefined
                ? target.savingsTargetAmount
                : existing.savingsTargetAmount,
            spendingLimitAmount:
              target.spendingLimitAmount !== undefined
                ? target.spendingLimitAmount
                : existing.spendingLimitAmount,
            updatedAt: now,
          };

          await supabase
            .from('monthly_goals')
            .update(mapToSnake(updatedTarget))
            .eq('id', existing.id)
            .eq('user_id', user.id);

          set((state) => {
            const updated = [...state.monthlyTargets];
            updated[existingIndex] = updatedTarget;
            return { monthlyTargets: updated };
          });
        } else {
          const newTarget: MonthlyTarget = {
            ...target,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
          };

          await supabase.from('monthly_goals').insert(mapToSnake({ ...newTarget, user_id: user.id }));

          set((state) => ({ monthlyTargets: [newTarget, ...state.monthlyTargets] }));
        }
      },

      updateMonthlyTarget: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase
          .from('monthly_goals')
          .update(mapToSnake(updatedData))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          monthlyTargets: state.monthlyTargets.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }));
      },

      deleteMonthlyTarget: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('monthly_goals').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          monthlyTargets: state.monthlyTargets.filter((t) => t.id !== id),
        }));
      },

      // Notification actions
      addNotification: async (notification) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          createdAt: Date.now(),
        };

        await supabase.from('notifications').insert(mapToSnake({ ...newNotification, userId: user.id }));

        set((state) => ({ notifications: [newNotification, ...state.notifications] }));
      },

      markNotificationRead: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('notifications').delete().eq('user_id', user.id);

        set({ notifications: [] });
      },

      // Settings actions
      updateSettings: async (updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const dbUpdates: any = {};
          if (updates.currency) dbUpdates.currency = updates.currency;
          if (updates.theme) dbUpdates.theme = updates.theme;
          if (updates.largeExpenseThreshold !== undefined)
            dbUpdates.largeExpenseThreshold = updates.largeExpenseThreshold;
          if (updates.userName) dbUpdates.displayName = updates.userName;

          await supabase
            .from('user_profiles')
            .update(mapToSnake(dbUpdates))
            .eq('id', user.id);
        }

        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      setCurrency: async (currency) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          await supabase.from('user_profiles').update({ currency }).eq('id', user.id);
        }

        set((state) => ({
          settings: { ...state.settings, currency },
        }));
      },

      // Purchase Planner actions
      addPurchasePlannerItem: async (item) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newItem: PurchasePlannerItem = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('purchase_planner').insert(mapToSnake({ ...newItem, userId: user.id }));

        set((state) => ({ purchasePlanner: [newItem, ...state.purchasePlanner] }));
      },

      updatePurchasePlannerItem: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase
          .from('purchase_planner')
          .update(mapToSnake(updatedData))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          purchasePlanner: state.purchasePlanner.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
          ),
        }));
      },

      deletePurchasePlannerItem: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('purchase_planner').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          purchasePlanner: state.purchasePlanner.filter((item) => item.id !== id),
        }));
      },

      // Priority Purchases actions
      addPriorityPurchase: async (item) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newItem: PriorityPurchaseItem = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('priority_purchases').insert(mapToSnake({ ...newItem, userId: user.id }));

        set((state) => ({ priorityPurchases: [newItem, ...state.priorityPurchases] }));
      },

      updatePriorityPurchase: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase
          .from('priority_purchases')
          .update(mapToSnake(updatedData))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          priorityPurchases: state.priorityPurchases.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
          ),
        }));
      },

      deletePriorityPurchase: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('priority_purchases').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          priorityPurchases: state.priorityPurchases.filter((item) => item.id !== id),
        }));
      },

      // Bills & Payments actions
      addBill: async (bill) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newBill: Bill = {
          ...bill,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('bills').insert(mapToSnake({ ...newBill, userId: user.id }));

        set((state) => ({ bills: [newBill, ...state.bills] }));
      },

      updateBill: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase.from('bills').update(mapToSnake(updatedData)).eq('id', id).eq('user_id', user.id);

        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === id ? { ...bill, ...updates, updatedAt: Date.now() } : bill
          ),
        }));
      },

      deleteBill: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('bills').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          bills: state.bills.filter((bill) => bill.id !== id),
        }));
      },

      // Savings Goals actions
      addSavingsGoal: async (goal) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newGoal: SavingsGoal = {
          ...goal,
          id: generateId(),
          remainingAmount: Math.max(0, goal.targetAmount - goal.savedAmount),
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('savings_goals').insert(mapToSnake({ ...newGoal, userId: user.id }));

        set((state) => ({ savingsGoals: [newGoal, ...state.savingsGoals] }));
      },

      updateSavingsGoal: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        let merged: any = null;
        set((state) => {
          state.savingsGoals.forEach((goal) => {
            if (goal.id === id) {
              merged = { ...goal, ...updates, updatedAt: Date.now() };
              merged.remainingAmount = Math.max(0, merged.targetAmount - merged.savedAmount);
            }
          });
          return {};
        });

        if (!merged) return;

        await supabase
          .from('savings_goals')
          .update(mapToSnake(merged))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          savingsGoals: state.savingsGoals.map((goal) => (goal.id === id ? merged : goal)),
        }));
      },

      deleteSavingsGoal: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          savingsGoals: state.savingsGoals.filter((goal) => goal.id !== id),
        }));
      },

      addSavingsToGoal: async (id, amount) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        let updatedGoal: any = null;
        set((state) => {
          state.savingsGoals.forEach((goal) => {
            if (goal.id === id) {
              const savedAmount = goal.savedAmount + amount;
              const remainingAmount = Math.max(0, goal.targetAmount - savedAmount);
              updatedGoal = {
                ...goal,
                savedAmount,
                remainingAmount,
                updatedAt: Date.now(),
              };
            }
          });
          return {};
        });

        if (!updatedGoal) return;

        await supabase
          .from('savings_goals')
          .update(mapToSnake(updatedGoal))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          savingsGoals: state.savingsGoals.map((goal) => (goal.id === id ? updatedGoal : goal)),
        }));
      },

      // Trip Planner actions
      addTrip: async (trip) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newTrip: Trip = {
          ...trip,
          id: generateId(),
          savedAmount: 0,
          contributions: [],
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('trip_planner').insert(mapToSnake({ ...newTrip, userId: user.id }));

        set((state) => ({ trips: [newTrip, ...state.trips] }));
      },

      updateTrip: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        let merged: any = null;
        set((state) => {
          state.trips.forEach((t) => {
            if (t.id === id) {
              merged = { ...t, ...updates, updatedAt: Date.now() };
              if (updates.expenses) {
                const e = updates.expenses;
                merged.estimatedBudget =
                  e.travel + e.hotel + e.food + e.shopping + e.activities + e.emergency + e.misc;
              }
              if (merged.savedAmount >= merged.estimatedBudget) {
                merged.paymentStatus = 'fully_funded';
              } else if (merged.savedAmount > 0) {
                merged.paymentStatus = 'partially_funded';
              } else {
                merged.paymentStatus = 'not_started';
              }
            }
          });
          return {};
        });

        if (!merged) return;

        await supabase
          .from('trip_planner')
          .update(mapToSnake(merged))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          trips: state.trips.map((t) => (t.id === id ? merged : t)),
        }));
      },

      deleteTrip: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('trip_planner').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          trips: state.trips.filter((t) => t.id !== id),
        }));
      },

      addTripContribution: async (tripId, contribution) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

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

        const currentTrip = get().trips.find((t) => t.id === tripId);
        if (!currentTrip) return;

        const savedAmount = currentTrip.savedAmount + contribution.amount;
        const contributions = [newContribution, ...currentTrip.contributions];
        const paymentStatus: TripPaymentStatus =
          savedAmount >= currentTrip.estimatedBudget ? 'fully_funded' : 'partially_funded';

        const updatedFields = {
          savedAmount,
          contributions,
          paymentStatus,
          updatedAt: now,
        };

        await supabase
          .from('trip_planner')
          .update(mapToSnake(updatedFields))
          .eq('id', tripId)
          .eq('user_id', user.id);

        set((state) => {
          const updatedTrips = state.trips.map((t) => {
            if (t.id === tripId) {
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
                ...updatedFields,
              };
            }
            return t;
          });
          return { trips: updatedTrips };
        });
      },

      deleteTripContribution: async (tripId, contributionId) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        let updatedFields: any = null;
        set((state) => {
          state.trips.forEach((t) => {
            if (t.id === tripId) {
              const contributionToRemove = t.contributions.find((c) => c.id === contributionId);
              const subAmount = contributionToRemove ? contributionToRemove.amount : 0;
              const contributions = t.contributions.filter((c) => c.id !== contributionId);
              const savedAmount = Math.max(0, t.savedAmount - subAmount);
              const paymentStatus: TripPaymentStatus =
                savedAmount >= t.estimatedBudget
                  ? 'fully_funded'
                  : savedAmount > 0
                  ? 'partially_funded'
                  : 'not_started';

              updatedFields = {
                savedAmount,
                contributions,
                paymentStatus,
                updatedAt: Date.now(),
              };
            }
          });
          return {};
        });

        if (!updatedFields) return;

        await supabase
          .from('trip_planner')
          .update(mapToSnake(updatedFields))
          .eq('id', tripId)
          .eq('user_id', user.id);

        set((state) => ({
          trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...updatedFields } : t)),
        }));
      },

      // Financial Notes actions
      addFinancialNote: async (note) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const now = Date.now();
        const newNote: FinancialNote = {
          ...note,
          id: generateId(),
          status: 'active',
          pinned: false,
          createdAt: now,
          updatedAt: now,
        };

        await supabase.from('financial_notes').insert(mapToSnake({ ...newNote, userId: user.id }));

        set((state) => ({ financialNotes: [newNote, ...state.financialNotes] }));
      },

      updateFinancialNote: async (id, updates) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const updatedData = { ...updates, updatedAt: Date.now() };
        await supabase
          .from('financial_notes')
          .update(mapToSnake(updatedData))
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          financialNotes: state.financialNotes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
          ),
        }));
      },

      deleteFinancialNote: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        await supabase.from('financial_notes').delete().eq('id', id).eq('user_id', user.id);

        set((state) => ({
          financialNotes: state.financialNotes.filter((n) => n.id !== id),
        }));
      },

      pinFinancialNote: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        let updatedNote: any = null;
        set((state) => {
          state.financialNotes.forEach((n) => {
            if (n.id === id) {
              updatedNote = { ...n, pinned: !n.pinned, updatedAt: Date.now() };
            }
          });
          return {};
        });

        if (!updatedNote) return;

        await supabase
          .from('financial_notes')
          .update({ pinned: updatedNote.pinned, updated_at: updatedNote.updatedAt })
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          financialNotes: state.financialNotes.map((n) => (n.id === id ? updatedNote : n)),
        }));
      },

      archiveFinancialNote: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        let updatedNote: any = null;
        set((state) => {
          state.financialNotes.forEach((n) => {
            if (n.id === id) {
              updatedNote = {
                ...n,
                status: n.status === 'archived' ? 'active' : 'archived',
                updatedAt: Date.now(),
              };
            }
          });
          return {};
        });

        if (!updatedNote) return;

        await supabase
          .from('financial_notes')
          .update({ status: updatedNote.status, updated_at: updatedNote.updatedAt })
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          financialNotes: state.financialNotes.map((n) => (n.id === id ? updatedNote : n)),
        }));
      },

      // Local notifications tracker
      addNotifiedId: async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const currentNotifiedIds = get().notifiedIds;
        const updatedNotifiedIds = [...currentNotifiedIds, id];

        if (user) {
          await supabase
            .from('user_profiles')
            .update({ notified_ids: updatedNotifiedIds })
            .eq('id', user.id);
        }

        set({ notifiedIds: updatedNotifiedIds });
      },

      // Quote actions
      setQuoteOfTheDay: (quote) => set({ quoteOfTheDay: quote }),
      resetQuoteIndexPool: () => set({ shownQuoteIndexes: [] }),
      pickDailyQuote: () => {
        const state = get();
        const todayStr = new Date().toISOString().split('T')[0];

        if (state.quoteOfTheDay && state.quoteOfTheDay.date === todayStr) {
          return { quote: state.quoteOfTheDay.quote, author: state.quoteOfTheDay.author || 'Unknown' };
        }

        let availableIndexes = quotes.map((_, i) => i).filter((i) => !state.shownQuoteIndexes.includes(i));

        if (availableIndexes.length === 0) {
          availableIndexes = quotes.map((_, i) => i);
          set({ shownQuoteIndexes: [] });
        }

        const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
        const selectedQuote = quotes[randomIndex];

        const newState: QuoteState = {
          quote: selectedQuote.quote,
          author: selectedQuote.author || 'Unknown',
          date: todayStr,
        };

        const updatedShownQuoteIndexes = [...state.shownQuoteIndexes, randomIndex];

        // Background sync to Supabase user profile
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase
              .from('user_profiles')
              .update({ shown_quote_indexes: updatedShownQuoteIndexes })
              .eq('id', session.user.id);
          }
        });

        set((s) => ({
          quoteOfTheDay: newState,
          shownQuoteIndexes: updatedShownQuoteIndexes,
        }));

        return { quote: selectedQuote.quote, author: selectedQuote.author || 'Unknown' };
      },

      // Data actions
      clearAllData: () => {
        if (
          typeof window !== 'undefined' &&
          confirm('Are you sure you want to delete all data? This cannot be undone.')
        ) {
          // Clear Supabase database under this user
          supabase.auth.getSession().then(({ data: { session } }) => {
            const user = session?.user;
            if (user) {
              Promise.all([
                supabase.from('transactions').delete().eq('user_id', user.id),
                supabase.from('debts').delete().eq('user_id', user.id),
                supabase.from('loans').delete().eq('user_id', user.id),
                supabase.from('bills').delete().eq('user_id', user.id),
                supabase.from('purchase_planner').delete().eq('user_id', user.id),
                supabase.from('priority_purchases').delete().eq('user_id', user.id),
                supabase.from('savings_goals').delete().eq('user_id', user.id),
                supabase.from('monthly_goals').delete().eq('user_id', user.id),
                supabase.from('trip_planner').delete().eq('user_id', user.id),
                supabase.from('financial_notes').delete().eq('user_id', user.id),
                supabase.from('notifications').delete().eq('user_id', user.id),
                supabase
                  .from('user_profiles')
                  .update({ shown_quote_indexes: [], notified_ids: [] })
                  .eq('id', user.id),
              ]);
            }
          });

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
            const uploadImports = async () => {
              const { data: { session } } = await supabase.auth.getSession();
              const user = session?.user;
              if (!user) return;

              const mapWithUserId = (list: any[]) =>
                (list || []).map((item) => mapToSnake({ ...item, userId: user.id }));

              // Delete existing and insert imported
              await Promise.all([
                supabase.from('transactions').delete().eq('user_id', user.id),
                supabase.from('debts').delete().eq('user_id', user.id),
                supabase.from('loans').delete().eq('user_id', user.id),
                supabase.from('bills').delete().eq('user_id', user.id),
                supabase.from('purchase_planner').delete().eq('user_id', user.id),
                supabase.from('priority_purchases').delete().eq('user_id', user.id),
                supabase.from('savings_goals').delete().eq('user_id', user.id),
                supabase.from('monthly_goals').delete().eq('user_id', user.id),
                supabase.from('trip_planner').delete().eq('user_id', user.id),
                supabase.from('financial_notes').delete().eq('user_id', user.id),
                supabase.from('notifications').delete().eq('user_id', user.id),
              ]);

              const promises = [];
              if (parsed.transactions?.length)
                promises.push(supabase.from('transactions').insert(mapWithUserId(parsed.transactions)));
              if (parsed.debts?.length)
                promises.push(supabase.from('debts').insert(mapWithUserId(parsed.debts)));
              if (parsed.loans?.length)
                promises.push(supabase.from('loans').insert(mapWithUserId(parsed.loans)));
              if (parsed.bills?.length)
                promises.push(supabase.from('bills').insert(mapWithUserId(parsed.bills)));
              if (parsed.purchasePlanner?.length)
                promises.push(
                  supabase.from('purchase_planner').insert(mapWithUserId(parsed.purchasePlanner))
                );
              if (parsed.priorityPurchases?.length)
                promises.push(
                  supabase.from('priority_purchases').insert(mapWithUserId(parsed.priorityPurchases))
                );
              if (parsed.savingsGoals?.length)
                promises.push(
                  supabase.from('savings_goals').insert(mapWithUserId(parsed.savingsGoals))
                );
              if (parsed.monthlyTargets?.length)
                promises.push(supabase.from('monthly_goals').insert(mapWithUserId(parsed.monthlyTargets)));
              if (parsed.trips?.length)
                promises.push(supabase.from('trip_planner').insert(mapWithUserId(parsed.trips)));
              if (parsed.financialNotes?.length)
                promises.push(
                  supabase.from('financial_notes').insert(mapWithUserId(parsed.financialNotes))
                );
              if (parsed.notifications?.length)
                promises.push(supabase.from('notifications').insert(mapWithUserId(parsed.notifications)));

              await Promise.all(promises);
              await get().fetchUserData();
            };

            uploadImports();

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

  const upcomingPayments =
    debts.filter((d) => d.status !== 'paid' && d.remainingAmount > 0).reduce((sum, d) => sum + d.remainingAmount, 0) +
    loans.filter((l) => l.status !== 'completed' && l.remainingAmount > 0).reduce((sum, l) => sum + l.remainingAmount, 0);

  const safeToSpend = currentBalance - upcomingPayments;

  const monthlyTargetProgress = currentMonthTarget
    ? Math.min(100, (currentMonthIncome / currentMonthTarget.targetAmount) * 100)
    : 0;

  // 1. Purchase Planner Selectors
  const totalPlannedPurchasesCount = purchasePlanner.filter((p) => p.status !== 'purchased').length;
  const totalPlannedCost = purchasePlanner
    .filter((p) => p.status !== 'purchased')
    .reduce((sum, p) => sum + p.estimatedCost, 0);
  const highPriorityPurchasesCount = purchasePlanner.filter(
    (p) => p.status !== 'purchased' && p.priority === 'high'
  ).length;

  // 2. Priority Purchases Selectors
  const pendingPriorityPurchasesCount = priorityPurchases.filter((p) => !p.purchased).length;
  const totalImmediateCostRequired = priorityPurchases
    .filter((p) => !p.purchased)
    .reduce((sum, p) => sum + p.estimatedCost, 0);

  // 3. Bills Selectors
  const upcomingBillsCount = bills.filter((b) => b.status !== 'paid').length;
  const totalBillsDueAmount = bills.filter((b) => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0);

  // 4. Savings Goals Selectors
  const savingsGoalsCount = savingsGoals.length;
  const totalSavedAmount = savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const savingsGoalsProgress = totalSavingsTarget > 0 ? (totalSavedAmount / totalSavingsTarget) * 100 : 0;

  // 5. Monthly Goals Expansion Selectors
  const currentMonthSavingsTarget = currentMonthTarget?.savingsTargetAmount || 0;
  const currentMonthSpendingLimit = currentMonthTarget?.spendingLimitAmount || 0;

  const monthlyTargetSavingsProgress =
    currentMonthSavingsTarget > 0 ? Math.min(100, (currentMonthSavings / currentMonthSavingsTarget) * 100) : 0;

  const monthlyTargetSpendingProgress =
    currentMonthSpendingLimit > 0 ? Math.min(100, (currentMonthExpense / currentMonthSpendingLimit) * 100) : 0;

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
    (t) =>
      t.status !== 'trip_completed' &&
      t.status !== 'cancelled' &&
      (t.paymentStatus === 'fully_funded' || t.savedAmount >= t.estimatedBudget)
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
    totalPlannedTrips,
    totalBudgetRequired,
    totalMoneyReserved,
    upcomingTrips,
    tripsReadyToBook,
    currency: settings.currency,
  };
};

export { getCurrentMonth, getCurrentDate, getCurrentTime };
