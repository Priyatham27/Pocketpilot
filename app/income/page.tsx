'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, TrendingUp, Edit2, Trash2, Search, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { IncomeCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

const incomeCategories: IncomeCategory[] = [
  'salary',
  'freelance',
  'business',
  'investment',
  'gift',
  'refund',
  'bonus',
  'rental',
  'other',
];

const schema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  source: z.string().min(1, 'Source is required'),
  category: z.enum(incomeCategories as [string, ...string[]]),
  description: z.string().optional(),
  date: z.string(),
  recurring: z.boolean().optional(),
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

export default function IncomePage() {
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
      source: '',
      category: 'salary',
      description: '',
      date: getCurrentDate(),
      recurring: false,
    },
  });

  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = incomeTransactions.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updateTransaction(selectedId, {
        amount: data.amount,
        source: data.source,
        category: data.category as IncomeCategory,
        description: data.description || '',
        date: data.date,
        recurring: data.recurring,
      });
    } else {
      addTransaction({
        type: 'income',
        amount: data.amount,
        source: data.source,
        category: data.category as IncomeCategory,
        description: data.description || '',
        date: data.date,
        time: getCurrentTime(),
        timestamp: Date.now(),
        recurring: data.recurring,
      });
    }
    closeDialog();
  };

  const openEditDialog = (transaction: typeof transactions[0]) => {
    setSelectedId(transaction.id);
    setValue('amount', transaction.amount);
    setValue('source', transaction.source || '');
    setValue('category', transaction.category);
    setValue('description', transaction.description || '');
    setValue('date', transaction.date);
    setValue('recurring', transaction.recurring || false);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      amount: 0,
      source: '',
      category: 'salary',
      description: '',
      date: getCurrentDate(),
      recurring: false,
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
              <TrendingUp className="h-8 w-8 text-green-500" />
              Income
            </h1>
            <p className="text-muted-foreground mt-1">Track your earnings</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="card-gradient-income border-0 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500/40" />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search income..."
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
              {incomeCategories.map((cat) => (
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
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No income added yet</p>
              <p className="text-sm mt-1">Click &quot;Add Income&quot; to record your first entry</p>
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
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold">{transaction.description || transaction.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">{transaction.source}</p>
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category}
                            </Badge>
                            {transaction.recurring && (
                              <Badge variant="outline" className="text-xs">Recurring</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(transaction.date), 'MMM d, yyyy')} at {transaction.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          +{formatCurrency(transaction.amount)}
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
              <DialogTitle>{selectedId ? 'Edit Income' : 'Add Income'}</DialogTitle>
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
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="e.g., Company Name"
                  {...register('source')}
                  className={cn(errors.source && 'border-destructive')}
                />
                {errors.source && (
                  <p className="text-sm text-destructive">{errors.source.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value as IncomeCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Additional details..."
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  className="h-4 w-4"
                  {...register('recurring')}
                />
                <Label htmlFor="recurring">Recurring income</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? 'Update' : 'Add'} Income
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Income</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this income entry? This action cannot be undone.</p>
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
