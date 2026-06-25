'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Receipt,
  ShoppingBag,
  Plane,
  PiggyBank,
  Target,
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collapse on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    {
      href: '/income',
      label: 'Add Income',
      icon: TrendingUp,
      color: 'bg-green-500 hover:bg-green-600 text-white',
    },
    {
      href: '/expenses',
      label: 'Add Expense',
      icon: TrendingDown,
      color: 'bg-red-500 hover:bg-red-600 text-white',
    },
    {
      href: '/debts?action=new',
      label: 'Add Debt',
      icon: CreditCard,
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    {
      href: '/loans?action=new',
      label: 'Add Loan',
      icon: Banknote,
      color: 'bg-purple-500 hover:bg-purple-600 text-white',
    },
    {
      href: '/bills?action=new',
      label: 'Add Bill',
      icon: Receipt,
      color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    },
    {
      href: '/purchase-planner?action=new',
      label: 'Add Purchase',
      icon: ShoppingBag,
      color: 'bg-teal-500 hover:bg-teal-600 text-white',
    },
    {
      href: '/trip-planner?action=new',
      label: 'Plan Trip',
      icon: Plane,
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    {
      href: '/savings?action=new',
      label: 'Savings Goal',
      icon: PiggyBank,
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    {
      href: '/goals?action=new',
      label: 'Monthly Goal',
      icon: Target,
      color: 'bg-pink-500 hover:bg-pink-600 text-white',
    },
    {
      href: '/financial-notes?action=new',
      label: 'Financial Note',
      icon: FileText,
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
  ];

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Action dial */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-col items-end gap-2 mb-2 max-h-[70vh] overflow-y-auto pr-2 pb-2 scrollbar-none"
          >
            {actions.map((act, index) => (
              <motion.div
                key={act.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center gap-2 group"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-card border px-2 py-0.5 rounded text-xs font-semibold shadow-sm text-foreground">
                  {act.label}
                </span>
                <Link
                  href={act.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95',
                    act.color
                  )}
                >
                  <act.icon className="h-5 w-5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 hover:scale-105 active:scale-95 z-50',
          isOpen
            ? 'bg-destructive rotate-90 hover:bg-destructive/90'
            : 'bg-primary hover:bg-primary/95 hover:shadow-primary/20'
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
