'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Plus, AlertTriangle, Edit2, Trash2, Check, Calendar, HelpCircle, DollarSign, Clock } from 'lucide-react';
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
import { PriorityLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

const priorityLevels: PriorityLevel[] = ['low', 'medium', 'high'];

const schema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  estimatedCost: z.number().min(0, 'Estimated cost must be at least 0'),
  deadline: z.string(),
  priority: z.enum(priorityLevels as [string, ...string[]]),
  notes: z.string().optional(),
  purchased: z.boolean(),
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

export default function PriorityPurchasesPage() {
  const priorityPurchases = useAppStore((state) => state.priorityPurchases) || [];
  const addPriorityPurchase = useAppStore((state) => state.addPriorityPurchase);
  const updatePriorityPurchase = useAppStore((state) => state.updatePriorityPurchase);
  const deletePriorityPurchase = useAppStore((state) => state.deletePriorityPurchase);

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
      itemName: '',
      estimatedCost: 0,
      deadline: getCurrentDate(),
      priority: 'high',
      notes: '',
      purchased: false,
    },
  });

  const { currency } = useSelectors();

  // Computations
  const pendingPurchases = priorityPurchases.filter((p) => !p.purchased);
  const pendingCount = pendingPurchases.length;
  const totalImmediateCost = pendingPurchases.reduce((sum, item) => sum + item.estimatedCost, 0);

  const onSubmit = (data: FormData) => {
    if (selectedId) {
      updatePriorityPurchase(selectedId, {
        itemName: data.itemName,
        estimatedCost: data.estimatedCost,
        deadline: data.deadline,
        priority: data.priority as PriorityLevel,
        notes: data.notes || '',
        purchased: data.purchased,
      });
    } else {
      addPriorityPurchase({
        itemName: data.itemName,
        estimatedCost: data.estimatedCost,
        deadline: data.deadline,
        priority: data.priority as PriorityLevel,
        notes: data.notes || '',
        purchased: false,
      });
    }
    closeDialog();
  };

  const openEditDialog = (item: typeof priorityPurchases[0]) => {
    setSelectedId(item.id);
    setValue('itemName', item.itemName);
    setValue('estimatedCost', item.estimatedCost);
    setValue('deadline', item.deadline);
    setValue('priority', item.priority);
    setValue('purchased', item.purchased);
    setValue('notes', item.notes);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      itemName: '',
      estimatedCost: 0,
      deadline: getCurrentDate(),
      priority: 'high',
      purchased: false,
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
      deletePriorityPurchase(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const handleMarkPurchased = (id: string) => {
    updatePriorityPurchase(id, { purchased: true });
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  // Filter list
  const filteredItems = priorityPurchases.filter((item) => {
    if (filterType === 'pending') return !item.purchased;
    if (filterType === 'purchased') return item.purchased;
    return true;
  });

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="text-destructive h-8 w-8" />
              Priority Purchases
            </h1>
            <p className="text-muted-foreground mt-1">Critical, immediate purchases needing attention</p>
          </div>
          <Button onClick={openAddDialog} variant="destructive" className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Immediate Item
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="card-gradient-debt border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Priority Purchases</p>
                  <p className="text-3xl font-bold mt-1 text-destructive">{pendingCount}</p>
                </div>
                <Clock className="h-12 w-12 text-destructive/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient-expense border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Immediate Cost Required</p>
                  <p className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">
                    {formatCurrency(totalImmediateCost, currency)}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-red-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6 bg-muted/30 p-2 rounded-lg">
          <div className="flex gap-2">
            {[
              { id: 'pending', label: 'Pending' },
              { id: 'purchased', label: 'Purchased' },
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

        {/* Item List */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50 text-orange-500" />
              <p className="text-lg font-medium">No priority purchases.</p>
              <p className="text-sm mt-1">Add items that you need to buy immediately to stay organized.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <Card className={cn(
                  'hover:shadow-md transition-shadow border-l-4',
                  !item.purchased && item.priority === 'high' ? 'border-l-red-500' : 'border-l-primary'
                )}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-3 rounded-full',
                          item.purchased ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        )}>
                          {item.purchased ? (
                            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-lg">{item.itemName}</h3>
                            <Badge className={cn('border', getPriorityColor(item.priority))}>
                              {item.priority}
                            </Badge>
                            {item.purchased && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Purchased
                              </Badge>
                            )}
                          </div>
                          {item.notes && <p className="text-sm text-muted-foreground mt-1 italic">&quot;{item.notes}&quot;</p>}

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {item.deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Deadline: {format(new Date(item.deadline), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(item.estimatedCost, currency)}
                        </p>

                        <div className="flex gap-2">
                          {!item.purchased && (
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
              <DialogTitle>{selectedId ? 'Edit Priority Purchase' : 'Add Urgent Purchase'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="e.g. Inhaler, Bike Break Pads"
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(value) => setValue('priority', value as PriorityLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((pr) => (
                        <SelectItem key={pr} value={pr}>
                          {pr.charAt(0).toUpperCase() + pr.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  {...register('deadline')}
                />
              </div>

              {selectedId && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    id="purchased"
                    type="checkbox"
                    checked={watch('purchased')}
                    onChange={(e) => setValue('purchased', e.target.checked)}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                  <Label htmlFor="purchased" className="cursor-pointer">Mark as Purchased</Label>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Details of urgency..."
                  {...register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" variant={watch('priority') === 'high' ? 'destructive' : 'default'}>
                  {selectedId ? 'Update' : 'Add'} Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Priority Purchase</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Are you sure you want to delete this urgent purchase? This action cannot be undone.</p>
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
