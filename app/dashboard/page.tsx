'use client';

import React from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, useSelectors, getCurrentMonth } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO, isAfter, addDays } from 'date-fns';

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

  const {
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
  } = useSelectors();

  const currentMonth = getCurrentMonth();
  const recentTransactions = transactions.slice(0, 5);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your financial overview</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Current Balance',
              value: formatCurrency(currentBalance),
              icon: Wallet,
              gradient: 'card-gradient-balance',
              description: 'Income - Expenses',
            },
            {
              title: 'Total Income',
              value: formatCurrency(totalIncome),
              icon: TrendingUp,
              gradient: 'card-gradient-income',
              description: 'All time earnings',
            },
            {
              title: 'Total Expenses',
              value: formatCurrency(totalExpenses),
              icon: TrendingDown,
              gradient: 'card-gradient-expense',
              description: 'All time spending',
            },
            {
              title: 'Safe to Spend',
              value: formatCurrency(safeToSpend),
              icon: Shield,
              gradient: 'card-gradient-target',
              description: 'Balance - Upcoming',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className={`${card.gradient} border-0 shadow-sm hover:shadow-md transition-shadow`}>
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
          >
            <Card className="card-gradient-target border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Target</p>
                    <p className="text-2xl font-bold mt-1">
                      {currentMonthTarget ? formatCurrency(currentMonthIncome) : 'Not Set'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-teal-500/60" />
                </div>
                {currentMonthTarget ? (
                  <div className="space-y-2">
                    <Progress value={monthlyTargetProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{monthlyTargetProgress.toFixed(1)}%</span>
                      <span>Target: {formatCurrency(currentMonthTarget.targetAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <Link href="/goals" className="text-sm text-primary hover:underline flex items-center">
                    Set target <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/income">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/expenses">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/debts">
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/loans">
                <Plus className="h-4 w-4 mr-2" />
                Add Loan
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/goals">
                <Target className="h-4 w-4 mr-2" />
                Update Goal
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
                  {recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          t.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {t.type === 'income' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description || t.category}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(t.date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        t.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>
      </div>
    </MainLayout>
  );
}
