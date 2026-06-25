'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Target, Trophy, TrendingUp, Calendar, Check, Plus, History, PiggyBank, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentMonth, useSelectors } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

export default function GoalsPage() {
  const monthlyTargets = useAppStore((state) => state.monthlyTargets);
  const setMonthlyTarget = useAppStore((state) => state.setMonthlyTarget);
  const transactions = useAppStore((state) => state.transactions);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetAmount, setTargetAmount] = useState(0);
  const [savingsTarget, setSavingsTarget] = useState(0);
  const [spendingLimit, setSpendingLimit] = useState(0);

  const currentMonth = getCurrentMonth();
  const currentMonthTarget = monthlyTargets.find((t) => t.month === currentMonth);
  const {
    currentMonthIncome,
    currentMonthExpense,
    currentMonthSavings,
    monthlyTargetProgress,
    currentMonthSavingsTarget,
    currentMonthSpendingLimit,
    monthlyTargetSavingsProgress,
    monthlyTargetSpendingProgress,
  } = useSelectors();

  // Calculate income for each month
  const getMonthIncome = (month: string) => {
    return transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(month))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSetTarget = () => {
    if (targetAmount > 0 || savingsTarget > 0 || spendingLimit > 0) {
      setMonthlyTarget({
        month: currentMonth,
        targetAmount: targetAmount || 0,
        currentEarned: 0,
        savingsTargetAmount: savingsTarget || 0,
        spendingLimitAmount: spendingLimit || 0,
      });
      setDialogOpen(false);
      setTargetAmount(0);
      setSavingsTarget(0);
      setSpendingLimit(0);
    }
  };

  const openDialog = () => {
    setTargetAmount(currentMonthTarget?.targetAmount || 0);
    setSavingsTarget(currentMonthTarget?.savingsTargetAmount || 0);
    setSpendingLimit(currentMonthTarget?.spendingLimitAmount || 0);
    setDialogOpen(true);
  };

  const isGoalAchieved = currentMonthTarget && currentMonthIncome >= currentMonthTarget.targetAmount;

  // Get months for history (last 6 months)
  const getMonthLabel = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return format(date, 'MMMM yyyy');
  };

  const pastTargets = monthlyTargets
    .filter((t) => t.month !== currentMonth)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-teal-500" />
              Monthly Goals
            </h1>
            <p className="text-muted-foreground mt-1">Set and track your monthly income targets</p>
          </div>
          <Button onClick={openDialog} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            {currentMonthTarget ? 'Update Goal' : 'Set Goal'}
          </Button>
        </div>

        {/* Current Month Goal */}
        <Card className="card-gradient-target border-0 shadow-sm mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{getMonthLabel(currentMonth)}</p>
                </div>

                {currentMonthTarget ? (
                  <div className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Income Goal */}
                      <div className="bg-white/40 dark:bg-gray-800/40 p-5 rounded-xl border border-muted/20 relative overflow-hidden flex flex-col justify-between">
                        {currentMonthIncome >= currentMonthTarget.targetAmount && (
                          <div className="absolute top-0 right-0 p-1.5 bg-green-500 text-white rounded-bl-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <Trophy className="h-3 w-3" />
                            Hit!
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <h3 className="font-semibold text-sm">Monthly Income Target</h3>
                          </div>
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground">Current Progress</p>
                            <p className="text-2xl font-bold">{formatCurrency(currentMonthIncome)}</p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{monthlyTargetProgress.toFixed(0)}% Complete</span>
                              <span>Target: {formatCurrency(currentMonthTarget.targetAmount)}</span>
                            </div>
                            <Progress value={monthlyTargetProgress} className="h-2" />
                            <p className="text-xxs text-muted-foreground text-right mt-1">
                              Remaining: {formatCurrency(Math.max(0, currentMonthTarget.targetAmount - currentMonthIncome))}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Savings Goal */}
                      <div className="bg-white/40 dark:bg-gray-800/40 p-5 rounded-xl border border-muted/20 relative overflow-hidden flex flex-col justify-between">
                        {currentMonthSavingsTarget > 0 && currentMonthSavings >= currentMonthSavingsTarget && (
                          <div className="absolute top-0 right-0 p-1.5 bg-emerald-500 text-white rounded-bl-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <Trophy className="h-3 w-3" />
                            Hit!
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <PiggyBank className="h-5 w-5 text-emerald-500" />
                            <h3 className="font-semibold text-sm">Monthly Savings Target</h3>
                          </div>
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground">Current Savings</p>
                            <p className="text-2xl font-bold">{formatCurrency(currentMonthSavings)}</p>
                          </div>
                          {currentMonthSavingsTarget > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{monthlyTargetSavingsProgress.toFixed(0)}% Complete</span>
                                <span>Target: {formatCurrency(currentMonthSavingsTarget)}</span>
                              </div>
                              <Progress value={monthlyTargetSavingsProgress} className="h-2 bg-emerald-100 dark:bg-emerald-950/20 animate-pulse" />
                              <p className="text-xxs text-muted-foreground text-right mt-1">
                                Remaining: {formatCurrency(Math.max(0, currentMonthSavingsTarget - currentMonthSavings))}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No target set. Click &quot;Update Goal&quot; to add.</p>
                          )}
                        </div>
                      </div>

                      {/* Spending Limit Goal */}
                      <div className="bg-white/40 dark:bg-gray-800/40 p-5 rounded-xl border border-muted/20 relative overflow-hidden flex flex-col justify-between">
                        {currentMonthSpendingLimit > 0 && currentMonthExpense <= currentMonthSpendingLimit && (
                          <div className="absolute top-0 right-0 p-1.5 bg-blue-500 text-white rounded-bl-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <Check className="h-3 w-3" />
                            Safe!
                          </div>
                        )}
                        {currentMonthSpendingLimit > 0 && currentMonthExpense > currentMonthSpendingLimit && (
                          <div className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-bl-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <AlertTriangle className="h-3 w-3" />
                            Over!
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                            <h3 className="font-semibold text-sm">Monthly Spending Limit</h3>
                          </div>
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground">Current Spending</p>
                            <p className="text-2xl font-bold">{formatCurrency(currentMonthExpense)}</p>
                          </div>
                          {currentMonthSpendingLimit > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{monthlyTargetSpendingProgress.toFixed(0)}% Used</span>
                                <span>Limit: {formatCurrency(currentMonthSpendingLimit)}</span>
                              </div>
                              <Progress 
                                value={monthlyTargetSpendingProgress} 
                                className={cn(
                                  "h-2",
                                  currentMonthExpense > currentMonthSpendingLimit ? "bg-red-100 dark:bg-red-950/20" : "bg-blue-100 dark:bg-blue-950/20"
                                )} 
                              />
                              <p className="text-xxs text-muted-foreground text-right mt-1">
                                {currentMonthExpense > currentMonthSpendingLimit 
                                  ? `Over Limit by: ${formatCurrency(currentMonthExpense - currentMonthSpendingLimit)}`
                                  : `Remaining Budget: ${formatCurrency(currentMonthSpendingLimit - currentMonthExpense)}`
                                }
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No limit set. Click &quot;Update Goal&quot; to add.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 w-full">
                    <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                    <p className="text-xl text-muted-foreground mb-4">No goals set for this month</p>
                    <Button onClick={openDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Monthly Goals
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
        </Card>

        {/* Quick Stats */}
        {currentMonthTarget && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month&apos;s Income</p>
                    <p className="text-xl font-bold">{formatCurrency(currentMonthIncome)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(Math.max(0, currentMonthTarget.targetAmount - currentMonthIncome))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-teal-100 dark:bg-teal-900/30">
                    <Check className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(currentMonthIncome / Math.max(1, new Date().getDate()))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Past Goals */}
        {pastTargets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              Goal History
            </h2>
            <div className="space-y-3">
              {pastTargets.map((target) => {
                const monthIncome = getMonthIncome(target.month);
                const progress = (monthIncome / target.targetAmount) * 100;
                const achieved = monthIncome >= target.targetAmount;

                return (
                  <Card key={target.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{getMonthLabel(target.month)}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {formatCurrency(target.targetAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={cn(
                              'font-bold',
                              achieved ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                            )}>
                              {formatCurrency(monthIncome)}
                            </p>
                            <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% complete</p>
                          </div>
                          {achieved && (
                            <Trophy className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Set Goal Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Monthly Goals</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Income Target Amount (₹)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="e.g. 50000"
                  value={targetAmount || ''}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="savingsTarget">Savings Target Amount (₹)</Label>
                <Input
                  id="savingsTarget"
                  type="number"
                  placeholder="e.g. 15000"
                  value={savingsTarget || ''}
                  onChange={(e) => setSavingsTarget(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spendingLimit">Spending Limit (₹)</Label>
                <Input
                  id="spendingLimit"
                  type="number"
                  placeholder="e.g. 20000"
                  value={spendingLimit || ''}
                  onChange={(e) => setSpendingLimit(parseFloat(e.target.value) || 0)}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Goals for {getMonthLabel(currentMonth)}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetTarget} disabled={targetAmount <= 0 && savingsTarget <= 0 && spendingLimit <= 0}>
                Set Goals
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
