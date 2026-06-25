'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInCalendarDays, isAfter } from 'date-fns';
import { Clock, Calendar, AlertTriangle, CreditCard, Banknote, Receipt, DollarSign, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentDate, useSelectors } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TimelineItem {
  id: string;
  type: 'bill' | 'debt' | 'loan' | 'priority_purchase';
  title: string;
  amount: number;
  date: string;
  status: string;
  notes?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function TimelinePage() {
  const bills = useAppStore((state) => state.bills) || [];
  const debts = useAppStore((state) => state.debts) || [];
  const loans = useAppStore((state) => state.loans) || [];
  const priorityPurchases = useAppStore((state) => state.priorityPurchases) || [];

  const { currency } = useSelectors();

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1. Add unpaid/pending bills
    bills
      .filter((b) => b.status !== 'paid' && b.dueDate)
      .forEach((b) => {
        items.push({
          id: b.id,
          type: 'bill',
          title: b.billName,
          amount: b.amount,
          date: b.dueDate,
          status: b.status,
          notes: b.notes,
        });
      });

    // 2. Add unpaid debts
    debts
      .filter((d) => d.status !== 'paid' && d.dueDate)
      .forEach((d) => {
        items.push({
          id: d.id,
          type: 'debt',
          title: `Owed to: ${d.personName}`,
          amount: d.remainingAmount,
          date: d.dueDate,
          status: d.status,
          notes: d.reason,
        });
      });

    // 3. Add completed loans
    loans
      .filter((l) => l.status !== 'completed' && l.dueDate)
      .forEach((l) => {
        items.push({
          id: l.id,
          type: 'loan',
          title: `Loan: ${l.name}`,
          amount: l.remainingAmount,
          date: l.dueDate,
          status: l.status,
          notes: `Lender: ${l.lender}`,
        });
      });

    // 4. Add unpaid priority purchases
    priorityPurchases
      .filter((p) => !p.purchased && p.deadline)
      .forEach((p) => {
        items.push({
          id: p.id,
          type: 'priority_purchase',
          title: p.itemName,
          amount: p.estimatedCost,
          date: p.deadline,
          status: p.priority + ' priority',
          notes: p.notes,
        });
      });

    // Sort by nearest due date
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [bills, debts, loans, priorityPurchases]);

  const getRelativeDaysText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    const diff = differenceInCalendarDays(dueDate, today);

    if (diff < 0) {
      return { text: `${Math.abs(diff)} days overdue`, color: 'text-red-500 font-bold dark:text-red-400' };
    }
    if (diff === 0) {
      return { text: 'Due Today', color: 'text-orange-500 font-bold dark:text-orange-400 animate-pulse' };
    }
    if (diff === 1) {
      return { text: 'Due Tomorrow', color: 'text-amber-500 font-medium dark:text-amber-400' };
    }
    return { text: `In ${diff} days`, color: 'text-muted-foreground' };
  };

  const getTypeIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'bill':
        return <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case 'debt':
        return <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case 'loan':
        return <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'priority_purchase':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getTypeColorClass = (type: TimelineItem['type']) => {
    switch (type) {
      case 'bill':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400';
      case 'debt':
        return 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400';
      case 'loan':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400';
      case 'priority_purchase':
        return 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400';
    }
  };

  const getPageLink = (type: TimelineItem['type']) => {
    switch (type) {
      case 'bill':
        return '/bills';
      case 'debt':
        return '/debts';
      case 'loan':
        return '/loans';
      case 'priority_purchase':
        return '/priority-purchases';
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Payments Timeline
          </h1>
          <p className="text-muted-foreground mt-1">Chronological view of all upcoming bills, loan terms, debts, and priority purchases</p>
        </div>

        {/* Timeline body */}
        {timelineItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
              <p className="text-lg font-medium">No upcoming payments.</p>
              <p className="text-sm mt-1">Excellent! You are all caught up on your expenses and priorities.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative border-l border-muted ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-4">
            <AnimatePresence>
              {timelineItems.map((item, index) => {
                const relativeInfo = getRelativeDaysText(item.date);
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative"
                  >
                    {/* Node Dot */}
                    <span className={cn(
                      'absolute -left-[43px] md:-left-[51px] rounded-full p-2 border-4 border-background flex items-center justify-center shadow-sm z-10',
                      getTypeColorClass(item.type)
                    )}>
                      {getTypeIcon(item.type)}
                    </span>

                    {/* Content Card */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                              <Badge className={cn('capitalize border', getTypeColorClass(item.type))}>
                                {item.type.replace('_', ' ')}
                              </Badge>
                              {item.status && (
                                <Badge variant="outline" className="text-xxs uppercase tracking-wider text-muted-foreground">
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            {item.notes && <p className="text-sm text-muted-foreground mt-1 italic">&quot;{item.notes}&quot;</p>}
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(item.date), 'MMM d, yyyy')}
                              </span>
                              <span className={cn('text-xs', relativeInfo.color)}>
                                {relativeInfo.text}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-center">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Due Amount</p>
                              <p className="text-2xl font-bold">{formatCurrency(item.amount, currency)}</p>
                            </div>
                            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
                              <Link href={getPageLink(item.type)}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
