'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Plus, Receipt, Edit2, Trash2, Check, Calendar, DollarSign, Clock, CheckCircle, AlertOctagon } from 'lucide-react';
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
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentDate, useSelectors } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { BillStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const billStatuses: BillStatus[] = ['pending', 'paid', 'overdue'];

const schema = z.object({
  billName: z.string().min(1, 'Bill name is required'),
  amount: z.number().min(0, 'Amount must be at least 0'),
  dueDate: z.string(),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
  status: z.enum(billStatuses as [string, ...string[]]),
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

export default function BillsPage() {
  const bills = useAppStore((state) => state.bills) || [];
  const addBill = useAppStore((state) => state.addBill);
  const updateBill = useAppStore((state) => state.updateBill);
  const deleteBill = useAppStore((state) => state.deleteBill);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('pending');

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
      billName: '',
      amount: 0,
      dueDate: getCurrentDate(),
      category: 'Utilities',
      notes: '',
      status: 'pending',
    },
  });

  const { currency } = useSelectors();

  // Helper to sync overdue status
  const getSyncedBills = () => {
    const todayStr = getCurrentDate();
    return bills.map((bill) => {
      if (bill.status === 'pending' && bill.dueDate && bill.dueDate < todayStr) {
        return { ...bill, status: 'overdue' as BillStatus };
      }
      return bill;
    });
  };

  const syncedBills = getSyncedBills();

  // Computations
  const pendingBills = syncedBills.filter((b) => b.status !== 'paid');
  const upcomingBillsCount = pendingBills.length;
  const totalBillsDue = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const overdueCount = pendingBills.filter((b) => b.status === 'overdue').length;

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updateBill(selectedId, {
        billName: data.billName,
        amount: data.amount,
        dueDate: data.dueDate,
        category: data.category,
        notes: data.notes || '',
        status: data.status as BillStatus,
      });
    } else {
      addBill({
        billName: data.billName,
        amount: data.amount,
        dueDate: data.dueDate,
        category: data.category,
        notes: data.notes || '',
        status: data.status as BillStatus,
      });
    }
    closeDialog();
  };

  const openEditDialog = (bill: typeof bills[0]) => {
    setSelectedId(bill.id);
    setValue('billName', bill.billName);
    setValue('amount', bill.amount);
    setValue('dueDate', bill.dueDate);
    setValue('category', bill.category);
    setValue('status', bill.status);
    setValue('notes', bill.notes);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      billName: '',
      amount: 0,
      dueDate: getCurrentDate(),
      category: 'Utilities',
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
      deleteBill(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const handleMarkPaid = (id: string) => {
    updateBill(id, { status: 'paid' });
  };

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  // Filters
  const filteredBills = syncedBills.filter((bill) => {
    if (filterType === 'pending') return bill.status !== 'paid';
    if (filterType === 'paid') return bill.status === 'paid';
    if (filterType === 'overdue') return bill.status === 'overdue';
    return true;
  });

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-8 w-8 text-primary" />
              Bills & Payments
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage upcoming recurring invoices</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="card-gradient-target border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Bills</p>
                  <p className="text-3xl font-bold mt-1">{upcomingBillsCount}</p>
                </div>
                <Clock className="h-12 w-12 text-teal-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-balance border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bills Due</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalBillsDue, currency)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-blue-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-debt border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Bills</p>
                  <p className="text-3xl font-bold mt-1 text-destructive">{overdueCount}</p>
                </div>
                <AlertOctagon className="h-12 w-12 text-red-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-between items-center mb-6 bg-muted/30 p-2 rounded-lg">
          <div className="flex gap-2">
            {[
              { id: 'pending', label: 'Pending / Unpaid' },
              { id: 'paid', label: 'Paid' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'all', label: 'All' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={filterType === tab.id ? 'default' : 'ghost'}
                onClick={() => setFilterType(tab.id)}
                className="rounded-md"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Bills list */}
        {filteredBills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50 text-indigo-500" />
              <p className="text-lg font-medium">No bills added.</p>
              <p className="text-sm mt-1">Track monthly rent, electricity, subscriptions and more by adding bills.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredBills.map((bill) => (
              <motion.div key={bill.id} variants={itemVariants}>
                <Card className={cn(
                  'hover:shadow-md transition-shadow border-l-4',
                  bill.status === 'overdue' ? 'border-l-red-500' : bill.status === 'paid' ? 'border-l-green-500' : 'border-l-primary'
                )}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-3 rounded-full',
                          bill.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : bill.status === 'overdue'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        )}>
                          {bill.status === 'paid' ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : bill.status === 'overdue' ? (
                            <AlertOctagon className="h-6 w-6" />
                          ) : (
                            <Clock className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-lg">{bill.billName}</h3>
                            <Badge className={cn('border', getStatusColor(bill.status))}>
                              {bill.status}
                            </Badge>
                            <Badge variant="outline" className="text-muted-foreground text-xs">{bill.category}</Badge>
                          </div>
                          {bill.notes && <p className="text-sm text-muted-foreground mt-1 italic">&quot;{bill.notes}&quot;</p>}

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {bill.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Due date: {format(new Date(bill.dueDate), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(bill.amount, currency)}
                        </p>

                        <div className="flex gap-2">
                          {bill.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleMarkPaid(bill.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(bill)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedId(bill.id);
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

        {/* Dialog Form */}
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedId ? 'Edit Bill' : 'Track Upcoming Bill'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billName">Bill Name</Label>
                <Input
                  id="billName"
                  placeholder="e.g. Broadband Wifi, Monthly Rent"
                  {...register('billName')}
                  className={cn(errors.billName && 'border-destructive')}
                />
                {errors.billName && (
                  <p className="text-sm text-destructive">{errors.billName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Input
                    id="category"
                    placeholder="e.g. Utilities, Housing, Subscriptions"
                    {...register('category')}
                    className={cn(errors.category && 'border-destructive')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register('dueDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as BillStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {billStatuses.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st.replace('_', ' ').charAt(0).toUpperCase() + st.replace('_', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Payment links, subscriber IDs, accounts..."
                  {...register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? 'Update' : 'Add'} Bill
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this bill? This action cannot be undone.</p>
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
