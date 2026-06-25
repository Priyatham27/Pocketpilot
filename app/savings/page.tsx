'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Plus, PiggyBank, Edit2, Trash2, Check, Calendar, HelpCircle, DollarSign, Trophy, Sparkles, PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentDate, useSelectors } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const schema = z.object({
  goalName: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().min(0.01, 'Target amount must be greater than 0'),
  savedAmount: z.number().min(0, 'Saved amount must be at least 0'),
  deadline: z.string(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SavingsGoalsPage() {
  const savingsGoals = useAppStore((state) => state.savingsGoals) || [];
  const addSavingsGoal = useAppStore((state) => state.addSavingsGoal);
  const updateSavingsGoal = useAppStore((state) => state.updateSavingsGoal);
  const deleteSavingsGoal = useAppStore((state) => state.deleteSavingsGoal);
  const addSavingsToGoal = useAppStore((state) => state.addSavingsToGoal);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addSavingsDialogOpen, setAddSavingsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingsAmount, setSavingsAmount] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      goalName: '',
      targetAmount: 0,
      savedAmount: 0,
      deadline: getCurrentDate(),
      notes: '',
    },
  });

  const { currency } = useSelectors();

  // Computations
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const activeCount = savingsGoals.filter((g) => g.savedAmount < g.targetAmount).length;
  const completedCount = savingsGoals.filter((g) => g.savedAmount >= g.targetAmount).length;

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updateSavingsGoal(selectedId, {
        goalName: data.goalName,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount,
        deadline: data.deadline,
        notes: data.notes || '',
      });
    } else {
      addSavingsGoal({
        goalName: data.goalName,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount,
        deadline: data.deadline,
        notes: data.notes || '',
      });
    }
    closeDialog();
  };

  const openEditDialog = (goal: typeof savingsGoals[0]) => {
    setSelectedId(goal.id);
    setValue('goalName', goal.goalName);
    setValue('targetAmount', goal.targetAmount);
    setValue('savedAmount', goal.savedAmount);
    setValue('deadline', goal.deadline);
    setValue('notes', goal.notes);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      goalName: '',
      targetAmount: 0,
      savedAmount: 0,
      deadline: getCurrentDate(),
      notes: '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedId(null);
    reset();
  };

  const confirmDelete = () => {
    if (selectedId) {
      deleteSavingsGoal(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const handleAddSavingsSubmit = () => {
    if (selectedId && savingsAmount > 0) {
      addSavingsToGoal(selectedId, savingsAmount);
      setAddSavingsDialogOpen(false);
      setSavingsAmount(0);
      setSelectedId(null);
    }
  };

  // Helper to calculate estimated completion date
  const getEstimatedCompletion = (goal: typeof savingsGoals[0]) => {
    if (goal.savedAmount >= goal.targetAmount) return 'Achieved!';
    
    const remaining = goal.targetAmount - goal.savedAmount;
    const today = new Date();
    const deadlineDate = new Date(goal.deadline);
    const monthsRemaining = (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsRemaining <= 0) return 'Deadline passed';

    const requiredContribution = remaining / Math.max(1, Math.ceil(monthsRemaining));
    return `Need ${formatCurrency(requiredContribution, currency)}/month`;
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <PiggyBank className="h-8 w-8 text-emerald-500" />
              Savings Goals
            </h1>
            <p className="text-muted-foreground mt-1">Set targets and allocate funds for your big plans</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Savings Goal
          </Button>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="card-gradient-target border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
                  <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalSaved, currency)}
                  </p>
                </div>
                <PiggyBank className="h-12 w-12 text-emerald-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-balance border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Targets</p>
                  <p className="text-3xl font-bold mt-1">{activeCount}</p>
                </div>
                <Trophy className="h-12 w-12 text-yellow-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-loan border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Goals Completed</p>
                  <p className="text-3xl font-bold mt-1">{completedCount}</p>
                </div>
                <Sparkles className="h-12 w-12 text-purple-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        {savingsGoals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50 text-emerald-500" />
              <p className="text-lg font-medium">No savings goals yet.</p>
              <p className="text-sm mt-1">Start saving for a laptop, a vacation, or an emergency fund.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {savingsGoals.map((goal) => {
              const progressPercentage = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
              const isAchieved = goal.savedAmount >= goal.targetAmount;

              return (
                <motion.div key={goal.id} variants={itemVariants}>
                  <Card className="relative overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col justify-between">
                    <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                      {isAchieved && (
                        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                          <div className="bg-yellow-500 text-white font-bold text-xxs uppercase tracking-wider text-center rotate-45 py-1 absolute top-4 -right-6 w-32 shadow-sm flex items-center justify-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Done!
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'p-3 rounded-full',
                            isAchieved ? 'bg-yellow-100 dark:bg-yellow-950/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                          )}>
                            {isAchieved ? (
                              <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400 animate-bounce" />
                            ) : (
                              <PiggyBank className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{goal.goalName}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Est. Timeline: {getEstimatedCompletion(goal)}</p>
                            {goal.notes && <p className="text-sm text-muted-foreground mt-2 italic">&quot;{goal.notes}&quot;</p>}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-5 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {progressPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={progressPercentage}
                            className={cn(
                              'h-3.5',
                              isAchieved && 'bg-yellow-100 dark:bg-yellow-950/20'
                            )}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Saved: {formatCurrency(goal.savedAmount, currency)}</span>
                            <span>Target: {formatCurrency(goal.targetAmount, currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t mt-auto">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
                        </div>

                        <div className="flex gap-2">
                          {!isAchieved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedId(goal.id);
                                setSavingsAmount(0);
                                setAddSavingsDialogOpen(true);
                              }}
                              className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add Savings
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(goal)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedId(goal.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Dialog Form */}
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedId ? 'Edit Savings Goal' : 'Create Savings Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  placeholder="e.g. Dream Vacation, New Laptop"
                  {...register('goalName')}
                  className={cn(errors.goalName && 'border-destructive')}
                />
                {errors.goalName && (
                  <p className="text-sm text-destructive">{errors.goalName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('targetAmount', { valueAsNumber: true })}
                    className={cn(errors.targetAmount && 'border-destructive')}
                  />
                  {errors.targetAmount && (
                    <p className="text-sm text-destructive">{errors.targetAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="savedAmount">Initial Saved Amount (₹)</Label>
                  <Input
                    id="savedAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('savedAmount', { valueAsNumber: true })}
                    className={cn(errors.savedAmount && 'border-destructive')}
                  />
                  {errors.savedAmount && (
                    <p className="text-sm text-destructive">{errors.savedAmount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline Target</Label>
                <Input
                  id="deadline"
                  type="date"
                  {...register('deadline')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Specific details about what you are saving for..."
                  {...register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? 'Update' : 'Create'} Goal
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Savings Dialog */}
        <Dialog open={addSavingsDialogOpen} onOpenChange={setAddSavingsDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Add Savings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="savingsAmount">Amount to Add (₹)</Label>
                <Input
                  id="savingsAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={savingsAmount || ''}
                  onChange={(e) => setSavingsAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddSavingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSavingsSubmit} disabled={savingsAmount <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this savings goal? This action cannot be undone.</p>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
