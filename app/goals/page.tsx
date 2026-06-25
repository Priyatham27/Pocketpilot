'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Target, Trophy, TrendingUp, Calendar, Check, Plus, History } from 'lucide-react';
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

  const currentMonth = getCurrentMonth();
  const currentMonthTarget = monthlyTargets.find((t) => t.month === currentMonth);
  const { currentMonthIncome, monthlyTargetProgress } = useSelectors();

  // Calculate income for each month
  const getMonthIncome = (month: string) => {
    return transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(month))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSetTarget = () => {
    if (targetAmount > 0) {
      setMonthlyTarget({
        month: currentMonth,
        targetAmount,
        currentEarned: 0,
      });
      setDialogOpen(false);
      setTargetAmount(0);
    }
  };

  const openDialog = () => {
    setTargetAmount(currentMonthTarget?.targetAmount || 0);
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
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-3xl font-bold">{formatCurrency(currentMonthIncome)}</h2>
                      {isGoalAchieved && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        >
                          <Trophy className="h-4 w-4" />
                          <span className="text-sm font-medium">Achieved!</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{monthlyTargetProgress.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={monthlyTargetProgress}
                        className="h-3"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target: {formatCurrency(currentMonthTarget.targetAmount)}</span>
                        <span className="text-muted-foreground">
                          Remaining: {formatCurrency(Math.max(0, currentMonthTarget.targetAmount - currentMonthIncome))}
                        </span>
                      </div>
                    </div>

                    {isGoalAchieved && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-300">Goal Achieved!</p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Exceeded target by {formatCurrency(currentMonthIncome - currentMonthTarget.targetAmount)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                    <p className="text-xl text-muted-foreground mb-4">No goal set for this month</p>
                    <Button onClick={openDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Monthly Goal
                    </Button>
                  </div>
                )}
              </div>

              {currentMonthTarget && (
                <div className="flex flex-col items-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50">
                  <p className="text-sm text-muted-foreground mb-2">Target Amount</p>
                  <p className="text-4xl font-bold text-center">{formatCurrency(currentMonthTarget.targetAmount)}</p>
                </div>
              )}
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
                    <p className="text-sm text-muted-foreground">This Month's Income</p>
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
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set Monthly Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="Enter target amount"
                  value={targetAmount || ''}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Goal for {getMonthLabel(currentMonth)}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetTarget} disabled={targetAmount <= 0}>
                Set Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
