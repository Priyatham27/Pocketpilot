'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, PieChart, LineChart, Wallet } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart as ReLineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, useSelectors } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { ExpenseCategory, IncomeCategory } from '@/lib/types';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1'
];

const expenseCategoryIcons: Record<string, string> = {
  food: 'Food',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  bills: 'Bills',
  health: 'Health',
  education: 'Education',
  travel: 'Travel',
  groceries: 'Groceries',
  subscriptions: 'Subscriptions',
  investment: 'Investment',
  gifts: 'Gifts',
  other: 'Other',
};

export default function AnalyticsPage() {
  const transactions = useAppStore((state) => state.transactions);
  const debts = useAppStore((state) => state.debts);
  const loans = useAppStore((state) => state.loans);

  const { totalIncome, totalExpenses, currentBalance, outstandingDebts, outstandingLoans } = useSelectors();

  // Income vs Expense by month (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM');

      const income = transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: monthLabel,
        income,
        expense,
        savings: income - expense,
      });
    }
    return months;
  }, [transactions]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: expenseCategoryIcons[name] || name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Income by category
  const incomeByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Daily spending this month
  const dailySpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const amount = transactions
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(day, 'd'),
        amount,
      };
    });
  }, [transactions]);

  // Savings trend
  const savingsTrend = useMemo(() => {
    return monthlyData.map((m) => ({
      month: m.month,
      savings: m.savings,
    }));
  }, [monthlyData]);

  // Summary stats
  const avgMonthlyIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / 6;
  const avgMonthlyExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0) / 6;
  const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Debt Progress
  const debtProgress = useMemo(() => {
    const totalDebtAmount = debts.reduce((sum, d) => sum + d.amount, 0);
    const paidDebt = totalDebtAmount - outstandingDebts;
    return [
      { name: 'Paid', value: paidDebt },
      { name: 'Remaining', value: outstandingDebts },
    ].filter(d => d.value > 0);
  }, [debts, outstandingDebts]);

  // Loan Progress
  const loanProgress = useMemo(() => {
    const totalLoanAmount = loans.reduce((sum, l) => sum + l.originalAmount, 0);
    const paidLoan = totalLoanAmount - outstandingLoans;
    return [
      { name: 'Paid', value: paidLoan },
      { name: 'Remaining', value: outstandingLoans },
    ].filter(d => d.value > 0);
  }, [loans, outstandingLoans]);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Visual insights into your finances</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
              </div>
              <p className="text-xl font-bold mt-2">{formatCurrency(avgMonthlyIncome)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <p className="text-sm text-muted-foreground">Avg Monthly Expense</p>
              </div>
              <p className="text-xl font-bold mt-2">{formatCurrency(avgMonthlyExpense)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">Avg Monthly Savings</p>
              </div>
              <p className="text-xl font-bold mt-2">{formatCurrency(Math.max(0, avgMonthlySavings))}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-teal-500" />
                <p className="text-sm text-muted-foreground">Savings Rate</p>
              </div>
              <p className="text-xl font-bold mt-2">{savingsRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expense Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Income vs Expenses (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      fill="#10b98133"
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      fill="#ef444433"
                      name="Expense"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No expenses recorded
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Income Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCategory.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No income recorded
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {incomeByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Spending This Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Spending This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Savings Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Savings Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={savingsTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Debt Progress */}
          {debts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Debt Payment Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={debtProgress}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">Outstanding: {formatCurrency(outstandingDebts)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Progress */}
          {loans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Payment Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={loanProgress}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">Outstanding: {formatCurrency(outstandingLoans)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
