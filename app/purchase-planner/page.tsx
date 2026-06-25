'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Plus, ShoppingBag, Edit2, Trash2, Check, Calendar, Sparkles, DollarSign, ListTodo, AlertTriangle } from 'lucide-react';
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
import { PurchasePriority, PurchaseStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const purchasePriorities: PurchasePriority[] = ['low', 'medium', 'high'];
const purchaseStatuses: PurchaseStatus[] = ['planned', 'saving', 'ready_to_buy', 'purchased'];

const schema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  estimatedCost: z.number().min(0, 'Estimated cost must be at least 0'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(purchasePriorities as [string, ...string[]]),
  targetDate: z.string(),
  notes: z.string().optional(),
  status: z.enum(purchaseStatuses as [string, ...string[]]),
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

export default function PurchasePlannerPage() {
  const purchasePlanner = useAppStore((state) => state.purchasePlanner) || [];
  const addPurchasePlannerItem = useAppStore((state) => state.addPurchasePlannerItem);
  const updatePurchasePlannerItem = useAppStore((state) => state.updatePurchasePlannerItem);
  const deletePurchasePlannerItem = useAppStore((state) => state.deletePurchasePlannerItem);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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
      itemName: '',
      estimatedCost: 0,
      category: 'General',
      priority: 'medium',
      targetDate: getCurrentDate(),
      notes: '',
      status: 'planned',
    },
  });

  const { currency } = useSelectors();

  // Summary Metrics
  const activePlannerItems = purchasePlanner.filter((p) => p.status !== 'purchased');
  const totalPlannedItemsCount = activePlannerItems.length;
  const totalPlannedCost = activePlannerItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const highPriorityCount = activePlannerItems.filter((item) => item.priority === 'high').length;

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updatePurchasePlannerItem(selectedId, {
        itemName: data.itemName,
        estimatedCost: data.estimatedCost,
        category: data.category,
        priority: data.priority as PurchasePriority,
        targetDate: data.targetDate,
        notes: data.notes || '',
        status: data.status as PurchaseStatus,
      });
    } else {
      addPurchasePlannerItem({
        itemName: data.itemName,
        estimatedCost: data.estimatedCost,
        category: data.category,
        priority: data.priority as PurchasePriority,
        targetDate: data.targetDate,
        notes: data.notes || '',
        status: data.status as PurchaseStatus,
      });
    }
    closeDialog();
  };

  const openEditDialog = (item: typeof purchasePlanner[0]) => {
    setSelectedId(item.id);
    setValue('itemName', item.itemName);
    setValue('estimatedCost', item.estimatedCost);
    setValue('category', item.category);
    setValue('priority', item.priority);
    setValue('targetDate', item.targetDate);
    setValue('status', item.status);
    setValue('notes', item.notes);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      itemName: '',
      estimatedCost: 0,
      category: 'General',
      priority: 'medium',
      targetDate: getCurrentDate(),
      status: 'planned',
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
      deletePurchasePlannerItem(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const handleMarkPurchased = (id: string) => {
    updatePurchasePlannerItem(id, { status: 'purchased' });
  };

  const getPriorityColor = (priority: PurchasePriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getStatusColor = (status: PurchaseStatus) => {
    switch (status) {
      case 'purchased':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'ready_to_buy':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'saving':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Filter Items
  const filteredItems = purchasePlanner.filter((item) => {
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-teal-500" />
              Purchase Planner
            </h1>
            <p className="text-muted-foreground mt-1">Plan and save for future purchases</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Plan Purchase
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="card-gradient-target border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Planned Purchases</p>
                  <p className="text-3xl font-bold mt-1">{totalPlannedItemsCount}</p>
                </div>
                <ListTodo className="h-12 w-12 text-teal-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-balance border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Estimated Cost</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalPlannedCost, currency)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-blue-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-debt border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority Purchases</p>
                  <p className="text-3xl font-bold mt-1">{highPriorityCount}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-muted/30 p-4 rounded-xl">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="statusFilter" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {purchaseStatuses.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st.replace('_', ' ').charAt(0).toUpperCase() + st.replace('_', ' ').slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="priorityFilter" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {purchasePriorities.map((pr) => (
                    <SelectItem key={pr} value={pr}>
                      {pr.charAt(0).toUpperCase() + pr.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* List View */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No planned purchases.</p>
              <p className="text-sm mt-1">Set targets and stay on budget by adding items you want to buy.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow relative overflow-hidden h-full flex flex-col justify-between">
                  <CardContent className="p-5 md:p-6 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900/30">
                        <ShoppingBag className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-lg truncate">{item.itemName}</h3>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Category: {item.category}</p>
                        {item.notes && <p className="text-sm text-muted-foreground mt-2 italic">&quot;{item.notes}&quot;</p>}
                        
                        {item.targetDate && (
                          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Target Buy: {format(new Date(item.targetDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t mt-auto">
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(item.estimatedCost, currency)}</p>
                      </div>

                      <div className="flex gap-2">
                        {item.status !== 'purchased' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleMarkPurchased(item.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Purchased
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedId(item.id);
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
            ))}
          </motion.div>
        )}

        {/* Dialog Form */}
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedId ? 'Edit Planned Purchase' : 'Plan Future Purchase'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="e.g. Mechanical Keyboard"
                  {...register('itemName')}
                  className={cn(errors.itemName && 'border-destructive')}
                />
                {errors.itemName && (
                  <p className="text-sm text-destructive">{errors.itemName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('estimatedCost', { valueAsNumber: true })}
                    className={cn(errors.estimatedCost && 'border-destructive')}
                  />
                  {errors.estimatedCost && (
                    <p className="text-sm text-destructive">{errors.estimatedCost.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g. Electronics, Home"
                    {...register('category')}
                    className={cn(errors.category && 'border-destructive')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(value) => setValue('priority', value as PurchasePriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {purchasePriorities.map((pr) => (
                        <SelectItem key={pr} value={pr}>
                          {pr.charAt(0).toUpperCase() + pr.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as PurchaseStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseStatuses.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st.replace('_', ' ').charAt(0).toUpperCase() + st.replace('_', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Purchase Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  {...register('targetDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Links, research details, alternatives..."
                  {...register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? 'Update' : 'Plan'} Purchase
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Planned Purchase</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this planned purchase? This action cannot be undone.</p>
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
