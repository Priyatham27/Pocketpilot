'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, TrendingDown, Edit2, Trash2, Search, Filter, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentTime, getCurrentDate } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { ExpenseCategory, PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';

const expenseCategories: ExpenseCategory[] = [
  'food',
  'transport',
  'shopping',
  'entertainment',
  'bills',
  'health',
  'education',
  'travel',
  'groceries',
  'subscriptions',
  'investment',
  'gifts',
  'other',
];

const paymentMethods: PaymentMethod[] = [
  'cash',
  'card',
  'upi',
  'bank_transfer',
  'other',
];

const schema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  category: z.enum(expenseCategories as [string, ...string[]]),
  description: z.string().optional(),
  paymentMethod: z.enum(paymentMethods as [string, ...string[]]),
  date: z.string(),
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

const categoryIcons: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  bills: '💡',
  health: '🏥',
  education: '📚',
  travel: '✈️',
  groceries: '🛒',
  subscriptions: '📺',
  investment: '📈',
  gifts: '🎁',
  other: '📦',
};

export default function ExpensesPage() {
  const transactions = useAppStore((state) => state.transactions);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const updateTransaction = useAppStore((state) => state.updateTransaction);
  const deleteTransaction = useAppStore((state) => state.deleteTransaction);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
      amount: 0,
      category: 'other',
      description: '',
      paymentMethod: 'cash',
      date: getCurrentDate(),
    },
  });

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = expenseTransactions.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Group by category for summary
  const categoryTotals = expenseCategories.reduce((acc, cat) => {
    acc[cat] = expenseTransactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updateTransaction(selectedId, {
        amount: data.amount,
        category: data.category as ExpenseCategory,
        description: data.description || '',
        paymentMethod: data.paymentMethod as PaymentMethod,
        date: data.date,
      });
    } else {
      addTransaction({
        type: 'expense',
        amount: data.amount,
        category: data.category as ExpenseCategory,
        description: data.description || '',
        paymentMethod: data.paymentMethod as PaymentMethod,
        date: data.date,
        time: getCurrentTime(),
        timestamp: Date.now(),
      });
    }
    closeDialog();
  };

  const openEditDialog = (transaction: typeof transactions[0]) => {
    setSelectedId(transaction.id);
    setValue('amount', transaction.amount);
    setValue('category', transaction.category);
    setValue('description', transaction.description || '');
    setValue('paymentMethod', transaction.paymentMethod || 'cash');
    setValue('date', transaction.date);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      amount: 0,
      category: 'other',
      description: '',
      paymentMethod: 'cash',
      date: getCurrentDate(),
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
      deleteTransaction(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-red-500" />
              Expenses
            </h1>
            <p className="text-muted-foreground mt-1">Track your spending</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0" variant="destructive">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="card-gradient-expense border-0 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-500/40" />
            </div>
          </CardContent>
        </Card>

        {/* Category Summary */}
        {expenseTransactions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {expenseCategories
                .filter((cat) => categoryTotals[cat] > 0)
                .sort((a, b) => categoryTotals[b] - categoryTotals[a])
                .map((cat) => (
                  <Card key={cat} className="p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">{categoryIcons[cat]}</div>
                      <p className="text-xs text-muted-foreground capitalize">{cat}</p>
                      <p className="font-semibold mt-1">{formatCurrency(categoryTotals[cat])}</p>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No expenses recorded yet</p>
              <p className="text-sm mt-1">Click "Add Expense" to record your first expense</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredTransactions.map((transaction) => (
              <motion.div key={transaction.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                          <span className="text-xl">{categoryIcons[transaction.category] || '📦'}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{transaction.description || transaction.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {transaction.paymentMethod}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(transaction.date), 'MMM d, yyyy')} at {transaction.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          -{formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(transaction)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedId(transaction.id);
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
              <DialogTitle>{selectedId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value as ExpenseCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={watch('paymentMethod')}
                  onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="What did you spend on?"
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  className={cn(errors.date && 'border-destructive')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  {selectedId ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
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
