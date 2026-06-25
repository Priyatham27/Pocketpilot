'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  Target,
  Shield,
  Calendar,
  Plus,
  ArrowRight,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  PiggyBank,
  Clock,
  Trophy,
  Plane,
  User,
  FileText,
  Lightbulb,
  CheckCircle2,
  Pin,
  Utensils,
  Car,
  Sparkles,
  Laptop,
  Building,
  Tv,
  HeartPulse,
  GraduationCap,
  Gift
} from 'lucide-react';
import { CircularProgress } from '@/components/circular-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, useSelectors, getCurrentMonth } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Transaction, SavingsGoal, Trip, FinancialNote } from '@/lib/types';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function DashboardPage() {
  const transactions = useAppStore((state) => state.transactions);
  const debts = useAppStore((state) => state.debts);
  const loans = useAppStore((state) => state.loans);
  const monthlyTargets = useAppStore((state) => state.monthlyTargets);
  const settings = useAppStore((state) => state.settings);
  const financialNotes = useAppStore((state) => state.financialNotes) || [];
  const pickDailyQuote = useAppStore((state) => state.pickDailyQuote);
  const quoteState = useAppStore((state) => state.quoteOfTheDay);
  const savingsGoals = useAppStore((state) => state.savingsGoals) || [];
  const trips = useAppStore((state) => state.trips) || [];

  React.useEffect(() => {
    pickDailyQuote();
  }, [pickDailyQuote]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning ☀️";
    if (hour >= 12 && hour < 17) return "Good Afternoon 🌤️";
    if (hour >= 17 && hour < 22) return "Good Evening 🌙";
    return "Good Night 🌌";
  };

  const getCategoryIcon = (category: string, type: string) => {
    const c = category.toLowerCase();
    if (type === 'income') {
      switch (c) {
        case 'salary': return Banknote;
        case 'freelance': return Laptop;
        case 'business': return Building;
        case 'investment': return TrendingUp;
        default: return Wallet;
      }
    }
    switch (c) {
      case 'food':
      case 'groceries':
        return Utensils;
      case 'transport':
      case 'travel':
        return Car;
      case 'shopping':
        return ShoppingBag;
      case 'entertainment':
      case 'subscriptions':
        return Tv;
      case 'bills':
        return Receipt;
      case 'health':
        return HeartPulse;
      case 'education':
        return GraduationCap;
      case 'gifts':
        return Gift;
      default:
        return Wallet;
    }
  };

  const {
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
  } = useSelectors();

  const currentMonth = getCurrentMonth();
  const recentTransactions = transactions.slice(0, 5);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayTransactions = useMemo(() => transactions.filter((t: Transaction) => t.date === todayStr), [transactions, todayStr]);
  const todayIncome = useMemo(() => todayTransactions.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0), [todayTransactions]);
  const todayExpense = useMemo(() => todayTransactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0), [todayTransactions]);
  const todayNet = todayIncome - todayExpense;
  const todayCount = todayTransactions.length;

  const financialInsights = useMemo(() => {
    const insights: string[] = [];

    // 1. Monthly income goal completion
    if (currentMonthTarget) {
      const pct = (currentMonthIncome / currentMonthTarget.targetAmount) * 100;
      if (pct >= 100) {
        insights.push("Goal achieved! Your monthly income goal is 100% complete. 🎉");
      } else if (pct >= 50) {
        insights.push(`Your monthly income goal is ${pct.toFixed(0)}% complete. Keep going! 🚀`);
      }
    }

    // 2. Spending limit check
    if (currentMonthSpendingLimit > 0) {
      const pct = (currentMonthExpense / currentMonthSpendingLimit) * 100;
      if (pct >= 100) {
        insights.push("Caution: You have exceeded your monthly spending limit! ⚠️");
      } else if (pct >= 85) {
        insights.push("Warning: You have used over 85% of your monthly spending limit. 🛑");
      } else {
        insights.push(`On track: You have used ${pct.toFixed(0)}% of your monthly spending limit. 👍`);
      }
    }

    // 3. Savings goals check
    const activeSavingsGoals = savingsGoals.filter((s: SavingsGoal) => s.remainingAmount > 0);
    if (activeSavingsGoals.length > 0) {
      const mostFunded = [...activeSavingsGoals].sort((a: SavingsGoal, b: SavingsGoal) => (b.savedAmount / b.targetAmount) - (a.savedAmount / a.targetAmount))[0];
      const pct = (mostFunded.savedAmount / mostFunded.targetAmount) * 100;
      if (pct > 0) {
        insights.push(`Your savings goal "${mostFunded.goalName}" is ${pct.toFixed(0)}% funded. 💰`);
      }
    }

    // 4. Trip Planner check
    const activeTrips = trips.filter((t: Trip) => t.status !== 'trip_completed' && t.status !== 'cancelled');
    if (activeTrips.length > 0) {
      const closestTrip = [...activeTrips].sort((a: Trip, b: Trip) => new Date(a.targetTravelDate).getTime() - new Date(b.targetTravelDate).getTime())[0];
      const pct = closestTrip.estimatedBudget > 0 ? (closestTrip.savedAmount / closestTrip.estimatedBudget) * 100 : 0;
      insights.push(`Your upcoming trip to ${closestTrip.destination} is ${pct.toFixed(0)}% funded. ✈️`);
    }

    // 5. Bills status
    if (upcomingBillsCount === 0) {
      insights.push("Awesome: No bills due in the upcoming week! 🏖️");
    } else {
      insights.push(`Reminder: You have ${upcomingBillsCount} unpaid bills due soon. 🗓️`);
    }

    return insights.slice(0, 4);
  }, [currentMonthTarget, currentMonthIncome, currentMonthSpendingLimit, currentMonthExpense, savingsGoals, trips, upcomingBillsCount]);

  const activeNotes = useMemo(() => financialNotes.filter((n: FinancialNote) => n.status === 'active'), [financialNotes]);
  const pinnedNotes = useMemo(() => activeNotes.filter((n: FinancialNote) => n.pinned), [activeNotes]);
  const reminderNotes = useMemo(() => activeNotes.filter((n: FinancialNote) => {
    if (!n.reminderDate) return false;
    const reminderTime = new Date(n.reminderDate).getTime();
    const todayTime = new Date().setHours(0, 0, 0, 0);
    return reminderTime >= todayTime;
  }), [activeNotes]);

  const upcomingDebts = debts
    .filter((d) => d.status !== 'paid' && d.dueDate)
    .filter((d) => {
      const dueDate = parseISO(d.dueDate);
      const now = new Date();
      return isAfter(dueDate, now) && isAfter(addDays(now, 7), dueDate);
    })
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  const upcomingLoans = loans
    .filter((l) => l.status !== 'completed' && l.dueDate)
    .filter((l) => {
      const dueDate = parseISO(l.dueDate);
      const now = new Date();
      return isAfter(dueDate, now) && isAfter(addDays(now, 7), dueDate);
    })
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span>{getGreeting()},</span>
              <span className="text-primary">{settings.userName || 'Priyatham'}</span>
              <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Here&apos;s today&apos;s financial snapshot • {format(new Date(), 'eeee, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/transactions">
                <Receipt className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/income">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            {
              title: 'Current Balance',
              value: formatCurrency(currentBalance),
              icon: Wallet,
              gradient: 'card-gradient-balance',
              description: 'Income - Expenses',
              className: 'col-span-1 sm:col-span-2 lg:col-span-2',
            },
            {
              title: 'Total Income',
              value: formatCurrency(totalIncome),
              icon: TrendingUp,
              gradient: 'card-gradient-income',
              description: 'All time earnings',
              className: 'col-span-1',
            },
            {
              title: 'Total Expenses',
              value: formatCurrency(totalExpenses),
              icon: TrendingDown,
              gradient: 'card-gradient-expense',
              description: 'All time spending',
              className: 'col-span-1',
            },
            {
              title: 'Safe to Spend',
              value: formatCurrency(safeToSpend),
              icon: Shield,
              gradient: 'card-gradient-target',
              description: 'Balance - Upcoming',
              className: 'col-span-1',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={card.className}
            >
              <Card className={`${card.gradient} border-0 shadow-sm hover:shadow-md transition-shadow h-full`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </div>
                    <card.icon className="h-8 w-8 text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quote & Snapshot Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily Inspiration */}
          <div className="lg:col-span-2">
            {quoteState ? (
              <Card className="h-full border border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 relative overflow-hidden backdrop-blur-xs flex flex-col justify-between p-6">
                <div className="absolute right-4 top-4 text-primary/10">
                  <Sparkles className="h-16 w-16" />
                </div>
                <div className="space-y-2">
                  <span className="text-xxs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-spin-slow" />
                    Daily Inspiration
                  </span>
                  <p className="text-base font-semibold leading-relaxed italic text-foreground/90">&ldquo;{quoteState.quote}&rdquo;</p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">— {quoteState.author || 'Unknown'}</p>
              </Card>
            ) : (
              <Card className="h-full p-6 flex items-center justify-center text-muted-foreground text-xs italic">
                Resolving your daily motivational quote...
              </Card>
            )}
          </div>

          {/* Today's Snapshot */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xxs font-bold uppercase tracking-wider text-muted-foreground">Today&apos;s Snapshot</span>
              <h3 className="text-lg font-bold mt-1 mb-4 flex items-center gap-1">
                <Clock className="h-4.5 w-4.5 text-primary" />
                Activity Today
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Income Today</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">+{formatCurrency(todayIncome)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Expenses Today</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">-{formatCurrency(todayExpense)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Net Balance</p>
                  <p className={cn("text-sm font-bold", todayNet >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                    {todayNet >= 0 ? '+' : ''}{formatCurrency(todayNet)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Transactions</p>
                  <p className="text-sm font-bold">{todayCount} logged</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Financial Insights */}
        {financialInsights.length > 0 && (
          <Card className="mb-8 border border-muted-foreground/10 bg-muted/10">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Smart Financial Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
                {financialInsights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex gap-2 p-3 bg-background rounded-lg border shadow-xs items-start">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-foreground/90 leading-tight">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debts, Loans, and Target Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="card-gradient-debt border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Outstanding Debts</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(outstandingDebts)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-orange-500/60" />
                </div>
                {outstandingDebts > 0 ? (
                  <Link href="/debts" className="text-sm text-primary hover:underline flex items-center">
                    View debts <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">No outstanding debts</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            custom={5}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="card-gradient-loan border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Outstanding Loans</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(outstandingLoans)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-purple-500/60" />
                </div>
                {outstandingLoans > 0 ? (
                  <Link href="/loans" className="text-sm text-primary hover:underline flex items-center">
                    View loans <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">No outstanding loans</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            custom={6}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-1"
          >
            <Card className="card-gradient-target border-0 shadow-sm h-full flex flex-col justify-between">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Monthly Goals</p>
                    <p className="text-xl font-bold mt-1">
                      {currentMonthTarget ? 'Active Targets' : 'No Goals Set'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-teal-500/60" />
                </div>

                {currentMonthTarget ? (
                  <div className="flex flex-wrap justify-around gap-4 pt-1">
                    {/* Income Goal */}
                    <div className="flex flex-col items-center gap-2">
                      <CircularProgress 
                        value={monthlyTargetProgress} 
                        size={60} 
                        strokeWidth={5} 
                        gradientStart="#10b981" 
                        gradientEnd="#059669" 
                        label="Income"
                      />
                      <div className="text-center text-[10px] text-muted-foreground">
                        <p className="font-semibold text-foreground/90">{formatCurrency(currentMonthIncome)}</p>
                        <p>of {formatCurrency(currentMonthTarget.targetAmount)}</p>
                      </div>
                    </div>

                    {/* Savings Goal */}
                    {currentMonthSavingsTarget > 0 && (
                      <div className="flex flex-col items-center gap-2">
                        <CircularProgress 
                          value={monthlyTargetSavingsProgress} 
                          size={60} 
                          strokeWidth={5} 
                          gradientStart="#22c55e" 
                          gradientEnd="#16a34a" 
                          label="Savings"
                        />
                        <div className="text-center text-[10px] text-muted-foreground">
                          <p className="font-semibold text-foreground/90">{formatCurrency(currentMonthSavings)}</p>
                          <p>of {formatCurrency(currentMonthSavingsTarget)}</p>
                        </div>
                      </div>
                    )}

                    {/* Spending Limit */}
                    {currentMonthSpendingLimit > 0 && (
                      <div className="flex flex-col items-center gap-2">
                        <CircularProgress 
                          value={monthlyTargetSpendingProgress} 
                          size={60} 
                          strokeWidth={5} 
                          gradientStart={currentMonthExpense > currentMonthSpendingLimit ? "#ef4444" : "#3b82f6"} 
                          gradientEnd={currentMonthExpense > currentMonthSpendingLimit ? "#dc2626" : "#2563eb"} 
                          label="Limit"
                        />
                        <div className="text-center text-[10px] text-muted-foreground">
                          <p className="font-semibold text-foreground/90">{formatCurrency(currentMonthExpense)}</p>
                          <p>of {formatCurrency(currentMonthSpendingLimit)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/goals" className="text-sm text-primary hover:underline flex items-center">
                    Set monthly targets <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Module Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Purchase Planner Card */}
          <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[145px] gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Planner</p>
                  <ShoppingBag className="h-5 w-5 text-teal-500/60" />
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgress 
                    value={totalPlannedPurchasesCount > 0 ? ((totalPlannedPurchasesCount - highPriorityPurchasesCount) / totalPlannedPurchasesCount) * 100 : 0} 
                    size={48} 
                    strokeWidth={4.5} 
                    gradientStart="#14b8a6" 
                    gradientEnd="#0d9488"
                    showValue={true}
                    valueClass="text-[10px] font-bold"
                  />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-bold text-foreground">{totalPlannedPurchasesCount} Planned</p>
                    <p className="text-[10px]">High: {highPriorityPurchasesCount} items</p>
                  </div>
                </div>
                <Link href="/purchase-planner" className="text-xs text-primary hover:underline flex items-center mt-1">
                  Go to Planner <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Priority Purchases Card */}
          <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[145px] gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority Purchases</p>
                  <AlertTriangle className="h-5 w-5 text-destructive/60" />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{pendingPriorityPurchasesCount} Urgent</p>
                  <p className="text-[10px] text-muted-foreground">Needed: {formatCurrency(totalImmediateCostRequired)}</p>
                </div>
                <Link href="/priority-purchases" className="text-xs text-primary hover:underline flex items-center mt-1">
                  View Urgent Items <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Bills Card */}
          <motion.div custom={9} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[145px] gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Bills</p>
                  <Receipt className="h-5 w-5 text-indigo-500/60" />
                </div>
                <div>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{upcomingBillsCount} Unpaid</p>
                  <p className="text-[10px] text-muted-foreground">Total Due: {formatCurrency(totalBillsDueAmount)}</p>
                </div>
                <Link href="/bills" className="text-xs text-primary hover:underline flex items-center mt-1">
                  Manage Bills <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Savings Goals Card */}
          <motion.div custom={10} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[145px] gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Savings Goals</p>
                  <PiggyBank className="h-5 w-5 text-emerald-500/60" />
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgress 
                    value={savingsGoalsProgress} 
                    size={48} 
                    strokeWidth={4.5} 
                    gradientStart="#10b981" 
                    gradientEnd="#059669"
                    showValue={true}
                    valueClass="text-[10px] font-bold"
                  />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-bold text-foreground">{savingsGoalsProgress.toFixed(0)}% Saved</p>
                    <p className="text-[10px]">Total: {formatCurrency(totalSavedAmount)}</p>
                  </div>
                </div>
                <Link href="/savings" className="text-xs text-primary hover:underline flex items-center mt-1">
                  Track Savings <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trip Planner Card */}
          <motion.div custom={11} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[145px] gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Planner</p>
                  <Plane className="h-5 w-5 text-indigo-500/60" />
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgress 
                    value={totalBudgetRequired > 0 ? (totalMoneyReserved / totalBudgetRequired) * 100 : 0} 
                    size={48} 
                    strokeWidth={4.5} 
                    gradientStart="#6366f1" 
                    gradientEnd="#4f46e5"
                    showValue={true}
                    valueClass="text-[10px] font-bold"
                  />
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="font-bold text-foreground">
                      {totalBudgetRequired > 0 ? ((totalMoneyReserved / totalBudgetRequired) * 100).toFixed(0) : 0}% Funded
                    </p>
                    <p className="text-[10px]">Saved: {formatCurrency(totalMoneyReserved)}</p>
                  </div>
                </div>
                <Link href="/trip-planner" className="text-xs text-primary hover:underline flex items-center mt-1">
                  Go to Trip Planner <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-muted/20 p-4 rounded-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/income">
                <Plus className="h-4 w-4 mr-2 text-green-500" />
                Add Income
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/expenses">
                <Plus className="h-4 w-4 mr-2 text-red-500" />
                Add Expense
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/debts">
                <Plus className="h-4 w-4 mr-2 text-orange-500" />
                Add Debt
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/loans">
                <Plus className="h-4 w-4 mr-2 text-purple-500" />
                Add Loan
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/goals">
                <Target className="h-4 w-4 mr-2 text-teal-500" />
                Update Goals
              </Link>
            </Button>
            {/* New Quick Actions */}
            <Button asChild variant="outline" size="sm">
              <Link href="/purchase-planner">
                <ShoppingBag className="h-4 w-4 mr-2 text-teal-600" />
                Purchase Planner
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/priority-purchases">
                <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                Priority Purchase
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/bills">
                <Receipt className="h-4 w-4 mr-2 text-indigo-500" />
                Add Bill
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/savings">
                <PiggyBank className="h-4 w-4 mr-2 text-emerald-500" />
                Savings Goal
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/timeline">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                View Timeline
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/trip-planner?action=new">
                <Plane className="h-4 w-4 mr-2 text-indigo-500" />
                Plan a Trip
              </Link>
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/transactions">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href="/income">Add your first transaction</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((t) => {
                    const Icon = getCategoryIcon(t.category, t.type);
                    return (
                      <motion.div
                        key={t.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/40 hover:shadow-xs transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2.5 rounded-full shrink-0",
                            t.type === 'income' 
                              ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          )}>
                            <Icon className="h-5 w-5 animate-pulse-slow" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{t.description || t.category}</p>
                              <Badge className={cn(
                                "text-[9px] px-1.5 py-0 scale-95 font-bold uppercase tracking-wider",
                                t.type === 'income' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}>
                                {t.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xxs text-muted-foreground mt-0.5">
                              <span>{format(parseISO(t.date), 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span>{t.time || '00:00'}</span>
                              <span>•</span>
                              <span className="capitalize font-semibold">{t.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-sm",
                            t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          )}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                          <span className="text-[9px] text-muted-foreground capitalize">success</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Payments & Notes */}
          <div className="space-y-6">
            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDebts.length === 0 && upcomingLoans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming payments this week</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDebts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="font-medium text-sm">{d.personName}</p>
                            <p className="text-xs text-muted-foreground">Debt - Due {format(parseISO(d.dueDate), 'MMM d')}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(d.remainingAmount)}
                        </p>
                      </div>
                    ))}
                    {upcomingLoans.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20"
                      >
                        <div className="flex items-center gap-3">
                          <Banknote className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="font-medium text-sm">{l.name}</p>
                            <p className="text-xs text-muted-foreground">Loan - Due {format(parseISO(l.dueDate), 'MMM d')}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-purple-600 dark:text-purple-400">
                          {formatCurrency(l.remainingAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Notes & Reminders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Notes & Reminders
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/financial-notes">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pinnedNotes.length === 0 && reminderNotes.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs italic">
                    No pinned notes or upcoming reminders.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pinned notes */}
                    {pinnedNotes.map((n: FinancialNote) => (
                      <div key={n.id} className="p-3 rounded-lg border bg-amber-50/20 dark:bg-amber-950/10 flex items-start justify-between gap-4 text-xs relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        <div>
                          <p className="font-bold flex items-center gap-1">
                            <Pin className="h-3 w-3 text-amber-500" fill="currentColor" />
                            {n.title}
                          </p>
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.description}</p>
                        </div>
                      </div>
                    ))}

                    {/* Reminder notes */}
                    {reminderNotes.filter((n: FinancialNote) => !n.pinned).slice(0, 3).map((n: FinancialNote) => (
                      <div key={n.id} className="p-3 rounded-lg border bg-indigo-50/20 dark:bg-indigo-950/10 flex items-start justify-between gap-4 text-xs relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                        <div>
                          <p className="font-bold flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-indigo-500" />
                            {n.title}
                          </p>
                          <p className="text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{n.description}</p>
                          {n.reminderDate && <p className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Due: {n.reminderDate}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
