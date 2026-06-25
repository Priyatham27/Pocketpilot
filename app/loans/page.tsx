'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Banknote, Edit2, Trash2, Check, Building, Calendar, Percent } from 'lucide-react';
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
import { LoanStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const loanStatuses: LoanStatus[] = ['pending', 'partially_paid', 'completed'];

const schema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  lender: z.string().min(1, 'Lender is required'),
  originalAmount: z.number().min(0.01, 'Amount must be greater than 0'),
  remainingAmount: z.number().min(0, 'Remaining amount must be at least 0'),
  interest: z.number().optional(),
  dueDate: z.string(),
  status: z.enum(loanStatuses as [string, ...string[]]),
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

export default function LoansPage() {
  const loans = useAppStore((state) => state.loans);
  const addLoan = useAppStore((state) => state.addLoan);
  const updateLoan = useAppStore((state) => state.updateLoan);
  const deleteLoan = useAppStore((state) => state.deleteLoan);

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
      name: '',
      lender: '',
      originalAmount: 0,
      remainingAmount: 0,
      interest: 0,
      dueDate: getCurrentDate(),
      status: 'pending',
      notes: '',
    },
  });

  const totalOutstanding = loans
    .filter((l) => l.status !== 'completed')
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const totalLoans = loans.reduce((sum, l) => sum + l.originalAmount, 0);

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updateLoan(selectedId, {
        name: data.name,
        lender: data.lender,
        originalAmount: data.originalAmount,
        remainingAmount: data.remainingAmount,
        interest: data.interest,
        dueDate: data.dueDate,
        status: data.status as LoanStatus,
        notes: data.notes || '',
      });
    } else {
      addLoan({
        name: data.name,
        lender: data.lender,
        originalAmount: data.originalAmount,
        remainingAmount: data.originalAmount,
        interest: data.interest,
        dueDate: data.dueDate,
        status: 'pending',
        notes: data.notes || '',
      });
    }
    closeDialog();
  };

  const openEditDialog = (loan: typeof loans[0]) => {
    setSelectedId(loan.id);
    setValue('name', loan.name);
    setValue('lender', loan.lender);
    setValue('originalAmount', loan.originalAmount);
    setValue('remainingAmount', loan.remainingAmount);
    setValue('interest', loan.interest || 0);
    setValue('dueDate', loan.dueDate);
    setValue('status', loan.status);
    setValue('notes', loan.notes);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      name: '',
      lender: '',
      originalAmount: 0,
      remainingAmount: 0,
      interest: 0,
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
      deleteLoan(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const markAsCompleted = (id: string) => {
    updateLoan(id, { status: 'completed', remainingAmount: 0 });
  };

  const markPayment = (id: string, amount: number) => {
    const loan = loans.find((l) => l.id === id);
    if (loan) {
      const newRemaining = Math.max(0, loan.remainingAmount - amount);
      const newStatus = newRemaining === 0 ? 'completed' : 'partially_paid';
      updateLoan(id, { remainingAmount: newRemaining, status: newStatus as LoanStatus });
    }
  };

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Banknote className="h-8 w-8 text-purple-500" />
              Loans
            </h1>
            <p className="text-muted-foreground mt-1">Loans you have taken</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0" variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Loan
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="card-gradient-loan border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding Loans</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalOutstanding)}</p>
                </div>
                <Banknote className="h-12 w-12 text-purple-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Loans Recorded</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalLoans)}</p>
                </div>
                <Building className="h-12 w-12 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loans List */}
        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No loans recorded</p>
              <p className="text-sm mt-1">Click &quot;Add Loan&quot; to track loans you have taken</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {loans.map((loan) => (
              <motion.div key={loan.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <Banknote className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{loan.name}</h3>
                            <Badge className={getStatusColor(loan.status)}>
                              {loan.status === 'completed' ? 'completed' : loan.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            From: {loan.lender}
                          </p>

                          {loan.status !== 'completed' && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Paid</span>
                                <span>
                                  {formatCurrency(loan.originalAmount - loan.remainingAmount)} / {formatCurrency(loan.originalAmount)}
                                </span>
                              </div>
                              <Progress
                                value={((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100}
                                className="h-2"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {loan.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(loan.dueDate), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                            {loan.interest !== undefined && loan.interest > 0 && (
                              <div className="flex items-center gap-1">
                                <Percent className="h-4 w-4" />
                                <span>{loan.interest}% interest</span>
                              </div>
                            )}
                          </div>
                          {loan.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">&quot;{loan.notes}&quot;</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold">
                          {loan.status === 'completed' ? (
                            <span className="text-green-600 dark:text-green-400">Completed</span>
                          ) : (
                            formatCurrency(loan.remainingAmount)
                          )}
                        </p>
                        <div className="flex gap-2">
                          {loan.status !== 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const amount = prompt('Enter payment amount:');
                                  if (amount && !isNaN(parseFloat(amount))) {
                                    markPayment(loan.id, parseFloat(amount));
                                  }
                                }}
                              >
                                Record Payment
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => markAsCompleted(loan.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(loan)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedId(loan.id);
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
              <DialogTitle>{selectedId ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Loan Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Home Loan, Car Loan"
                  {...register('name')}
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lender">Lender</Label>
                <Input
                  id="lender"
                  placeholder="Bank or person name"
                  {...register('lender')}
                  className={cn(errors.lender && 'border-destructive')}
                />
                {errors.lender && (
                  <p className="text-sm text-destructive">{errors.lender.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">Original Amount (₹)</Label>
                  <Input
                    id="originalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('originalAmount', { valueAsNumber: true })}
                    className={cn(errors.originalAmount && 'border-destructive')}
                  />
                  {errors.originalAmount && (
                    <p className="text-sm text-destructive">{errors.originalAmount.message}</p>
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
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Interest Rate (%) (optional)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register('interest', { valueAsNumber: true })}
                />
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
                    onValueChange={(value) => setValue('status', value as LoanStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loanStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'completed' ? 'Completed' : status.replace('_', ' ')}
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
                  {selectedId ? 'Update' : 'Add'} Loan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this loan? This action cannot be undone.</p>
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
