'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, CreditCard, Edit2, Trash2, Check, User, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentDate } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { DebtStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const debtStatuses: DebtStatus[] = ['pending', 'partially_paid', 'paid'];

const schema = z.object({
  personName: z.string().min(1, 'Person name is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  remainingAmount: z.number().min(0, 'Remaining amount must be at least 0'),
  reason: z.string().min(1, 'Reason is required'),
  dueDate: z.string(),
  status: z.enum(debtStatuses as [string, ...string[]]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DebtsPage() {
  const debts = useAppStore((state) => state.debts);
  const addDebt = useAppStore((state) => state.addDebt);
  const updateDebt = useAppStore((state) => state.updateDebt);
  const deleteDebt = useAppStore((state) => state.deleteDebt);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      personName: '',
      amount: 0,
      remainingAmount: 0,
      reason: '',
      dueDate: getCurrentDate(),
      status: 'pending',
      notes: '',
    },
  });

  const totalOutstanding = debts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalDebts = debts.reduce((sum, d) => sum + d.amount, 0);

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updateDebt(selectedId, {
        personName: data.personName,
        amount: data.amount,
        remainingAmount: data.remainingAmount,
        reason: data.reason,
        dueDate: data.dueDate,
        status: data.status as DebtStatus,
        notes: data.notes || '',
      });
    } else {
      addDebt({
        personName: data.personName,
        amount: data.amount,
        remainingAmount: data.amount,
        reason: data.reason,
        dueDate: data.dueDate,
        status: 'pending',
        notes: data.notes || '',
      });
    }
    closeDialog();
  };

  const openEditDialog = (debt: typeof debts[0]) => {
    setSelectedId(debt.id);
    setValue('personName', debt.personName);
    setValue('amount', debt.amount);
    setValue('remainingAmount', debt.remainingAmount);
    setValue('reason', debt.reason);
    setValue('dueDate', debt.dueDate);
    setValue('status', debt.status);
    setValue('notes', debt.notes);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      personName: '',
      amount: 0,
      remainingAmount: 0,
      reason: '',
      dueDate: getCurrentDate(),
      status: 'pending',
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
      deleteDebt(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const markAsPaid = (id: string) => {
    updateDebt(id, { status: 'paid', remainingAmount: 0 });
  };

  const markPartialPayment = (id: string, amount: number) => {
    const debt = debts.find((d) => d.id === id);
    if (debt) {
      const newRemaining = Math.max(0, debt.remainingAmount - amount);
      const newStatus = newRemaining === 0 ? 'paid' : 'partially_paid';
      updateDebt(id, { remainingAmount: newRemaining, status: newStatus as DebtStatus });
    }
  };

  const getStatusColor = (status: DebtStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-orange-500" />
              Debts
            </h1>
            <p className="text-muted-foreground mt-1">Money you owe to others</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0" variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="card-gradient-debt border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding Debts</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalOutstanding)}</p>
                </div>
                <CreditCard className="h-12 w-12 text-orange-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Debts Recorded</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalDebts)}</p>
                </div>
                <User className="h-12 w-12 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debts List */}
        {debts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No debts recorded</p>
              <p className="text-sm mt-1">Click &quot;Add Debt&quot; to track money you owe</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {debts.map((debt) => (
              <motion.div key={debt.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{debt.personName}</h3>
                            <Badge className={getStatusColor(debt.status)}>
                              {debt.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{debt.reason}</p>
 
                          {debt.status !== 'paid' && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Paid</span>
                                <span>{formatCurrency(debt.amount - debt.remainingAmount)} / {formatCurrency(debt.amount)}</span>
                              </div>
                              <Progress
                                value={((debt.amount - debt.remainingAmount) / debt.amount) * 100}
                                className="h-2"
                              />
                            </div>
                          )}
 
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {debt.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(debt.dueDate), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                            {debt.notes && (
                              <p className="text-xs italic">&quot;{debt.notes}&quot;</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold">
                          {debt.status === 'paid' ? (
                            <span className="text-green-600 dark:text-green-400">Paid</span>
                          ) : (
                            formatCurrency(debt.remainingAmount)
                          )}
                        </p>
                        <div className="flex gap-2">
                          {debt.status !== 'paid' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const amount = prompt('Enter payment amount:');
                                  if (amount && !isNaN(parseFloat(amount))) {
                                    markPartialPayment(debt.id, parseFloat(amount));
                                  }
                                }}
                              >
                                Record Payment
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => markAsPaid(debt.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(debt)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedId(debt.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedId ? 'Edit Debt' : 'Add Debt'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personName">Person Name</Label>
                <Input
                  id="personName"
                  placeholder="Who do you owe?"
                  {...register('personName')}
                  className={cn(errors.personName && 'border-destructive')}
                />
                {errors.personName && (
                  <p className="text-sm text-destructive">{errors.personName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={cn(errors.amount && 'border-destructive')}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                </div>

                {selectedId && (
                  <div className="space-y-2">
                    <Label htmlFor="remainingAmount">Remaining (₹)</Label>
                    <Input
                      id="remainingAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('remainingAmount', { valueAsNumber: true })}
                      className={cn(errors.remainingAmount && 'border-destructive')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="What is this debt for?"
                  {...register('reason')}
                  className={cn(errors.reason && 'border-destructive')}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                />
              </div>

              {selectedId && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as DebtStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {debtStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  {...register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? 'Update' : 'Add'} Debt
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Debt</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this debt? This action cannot be undone.</p>
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
