'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInCalendarDays } from 'date-fns';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Target,
  Receipt,
  BarChart3,
  Settings,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  CalendarDays,
  PiggyBank,
  Clock,
  ChevronDown,
  Plane,
  FileText,
} from 'lucide-react';
import { FloatingActionButton } from './floating-action-button';
import { MigrationModal } from './migration-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore, getCurrentMonth } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FinancialNote } from '@/lib/types';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/debts', label: 'Debts', icon: CreditCard },
  { href: '/loans', label: 'Loans', icon: Banknote },
  { href: '/purchase-planner', label: 'Purchase Planner', icon: ShoppingBag },
  { href: '/priority-purchases', label: 'Priority Purchases', icon: AlertTriangle },
  { href: '/bills', label: 'Bills & Payments', icon: CalendarDays },
  { href: '/savings', label: 'Savings Goals', icon: PiggyBank },
  { href: '/trip-planner', label: 'Trip Planner', icon: Plane },
  { href: '/financial-notes', label: 'Financial Notes', icon: FileText },
  { href: '/timeline', label: 'Payments Timeline', icon: Clock },
  { href: '/goals', label: 'Monthly Goals', icon: Target },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = useAppStore((state) => state.notifications);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const addNotification = useAppStore((state) => state.addNotification);
  const purchasePlanner = useAppStore((state) => state.purchasePlanner) || [];
  const priorityPurchases = useAppStore((state) => state.priorityPurchases) || [];
  const bills = useAppStore((state) => state.bills) || [];
  const savingsGoals = useAppStore((state) => state.savingsGoals) || [];
  const trips = useAppStore((state) => state.trips) || [];
  const monthlyTargets = useAppStore((state) => state.monthlyTargets) || [];
  const transactions = useAppStore((state) => state.transactions) || [];
  const financialNotes = useAppStore((state) => state.financialNotes) || [];
  const notifiedIds = useAppStore((state) => state.notifiedIds) || [];
  const addNotifiedId = useAppStore((state) => state.addNotifiedId);

  const triggerNativeNotification = (title: string, message: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Upcoming Bills (due in next 3 days, and not already notified)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    bills.forEach((bill) => {
      if (bill.status !== 'paid' && bill.dueDate) {
        const dueDate = new Date(bill.dueDate);
        if (dueDate <= threeDaysFromNow) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === bill.id && n.type === 'bill_due'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'bill_due',
              title: 'Upcoming Bill Reminder',
              message: `Your bill "${bill.billName}" of ₹${bill.amount.toLocaleString()} is due on ${bill.dueDate}.`,
              read: false,
              relatedId: bill.id,
            });
          }
          const notificationId = bill.id + '_bill_due';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Upcoming Bill Reminder 🗓️', `Your bill "${bill.billName}" (₹${bill.amount.toLocaleString()}) is due on ${bill.dueDate}.`);
            addNotifiedId(notificationId);
          }
        }
      }
    });

    // 2. Check Upcoming Purchase planner dates (due in next 5 days)
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);

    purchasePlanner.forEach((item) => {
      if (item.status !== 'purchased' && item.targetDate) {
        const targetDate = new Date(item.targetDate);
        if (targetDate <= fiveDaysFromNow) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === item.id && n.type === 'purchase_due'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'purchase_due',
              title: 'Planned Purchase Target Date',
              message: `Target date for "${item.itemName}" (₹${item.estimatedCost.toLocaleString()}) is approaching on ${item.targetDate}.`,
              read: false,
              relatedId: item.id,
            });
          }
          const notificationId = item.id + '_purchase_due';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Planned Purchase Due 🛒', `Target date for "${item.itemName}" (₹${item.estimatedCost.toLocaleString()}) is approaching on ${item.targetDate}.`);
            addNotifiedId(notificationId);
          }
        }
      }
    });

    // 3. Check Priority Purchases (deadline in next 2 days)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);

    priorityPurchases.forEach((item) => {
      if (!item.purchased && item.deadline) {
        const deadline = new Date(item.deadline);
        if (deadline <= twoDaysFromNow) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === item.id && n.type === 'priority_purchase_due'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'priority_purchase_due',
              title: 'Immediate Priority Purchase Deadline',
              message: `Deadline for priority purchase "${item.itemName}" (₹${item.estimatedCost.toLocaleString()}) is ${item.deadline}.`,
              read: false,
              relatedId: item.id,
            });
          }
          const notificationId = item.id + '_priority_purchase_due';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Immediate Purchase Deadline ⚠️', `Deadline for priority purchase "${item.itemName}" (₹${item.estimatedCost.toLocaleString()}) is ${item.deadline}.`);
            addNotifiedId(notificationId);
          }
        }
      }
    });

    // 4. Check Savings Goal Deadlines (deadline in next 5 days)
    savingsGoals.forEach((goal) => {
      if (goal.remainingAmount > 0 && goal.deadline) {
        const deadline = new Date(goal.deadline);
        if (deadline <= fiveDaysFromNow) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === goal.id && n.type === 'savings_goal_deadline'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'savings_goal_deadline',
              title: 'Savings Goal Deadline Approaching',
              message: `Deadline for your savings goal "${goal.goalName}" is approaching on ${goal.deadline}. Still need ₹${goal.remainingAmount.toLocaleString()}!`,
              read: false,
              relatedId: goal.id,
            });
          }
          const notificationId = goal.id + '_savings_goal_deadline';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Savings Goal Deadline 💰', `Deadline for savings goal "${goal.goalName}" is approaching on ${goal.deadline}. Still need ₹${goal.remainingAmount.toLocaleString()}!`);
            addNotifiedId(notificationId);
          }
        }
      }
    });

    // 5. Check Monthly Goals Completion
    const currentMonth = getCurrentMonth();
    const currentTarget = monthlyTargets.find((t) => t.month === currentMonth);
    if (currentTarget) {
      // Income Goal
      const currentMonthIncome = transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);

      if (currentMonthIncome >= currentTarget.targetAmount) {
        const alreadyNotified = notifications.some(
          (n) => n.relatedId === currentTarget.id + '_income' && n.type === 'monthly_goal_achieved'
        );
        if (!alreadyNotified) {
          addNotification({
            type: 'monthly_goal_achieved',
            title: 'Monthly Income Target Achieved! 🎉',
            message: `Congratulations! You have hit your monthly income target of ₹${currentTarget.targetAmount.toLocaleString()} this month.`,
            read: false,
            relatedId: currentTarget.id + '_income',
          });
        }
        const notificationId = currentTarget.id + '_monthly_income';
        if (!notifiedIds.includes(notificationId)) {
          triggerNativeNotification('Monthly Income Target Achieved! 🎉', `Congratulations! You hit your monthly income target of ₹${currentTarget.targetAmount.toLocaleString()} this month.`);
          addNotifiedId(notificationId);
        }
      }

      // Savings Goal
      if (currentTarget.savingsTargetAmount && currentTarget.savingsTargetAmount > 0) {
        const currentMonthExpense = transactions
          .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + t.amount, 0);
        const netSavings = Math.max(0, currentMonthIncome - currentMonthExpense);

        if (netSavings >= currentTarget.savingsTargetAmount) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === currentTarget.id + '_savings' && n.type === 'monthly_goal_achieved'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'monthly_goal_achieved',
              title: 'Monthly Savings Target Achieved! 💰',
              message: `Awesome job! You have hit your monthly savings target of ₹${currentTarget.savingsTargetAmount.toLocaleString()} this month.`,
              read: false,
              relatedId: currentTarget.id + '_savings',
            });
          }
          const notificationId = currentTarget.id + '_monthly_savings';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Monthly Savings Target Achieved! 💰', `Awesome job! You hit your monthly savings target of ₹${currentTarget.savingsTargetAmount.toLocaleString()} this month.`);
            addNotifiedId(notificationId);
          }
        }
      }
    }

    // 6. Check Trips (travel date, funding status)
    trips.forEach((trip) => {
      if (trip.status !== 'trip_completed' && trip.status !== 'cancelled' && trip.targetTravelDate) {
        const travelDate = new Date(trip.targetTravelDate);
        const daysDiff = differenceInCalendarDays(travelDate, today);

        // a. Trip date is approaching (travel date is in next 7 days)
        if (daysDiff >= 0 && daysDiff <= 7) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === trip.id + '_approaching' && n.type === 'trip_date_approaching'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'trip_date_approaching',
              title: `Trip Approaching: ${trip.tripName} ✈️`,
              message: `Your trip to ${trip.destination} is in ${daysDiff} days (${trip.targetTravelDate}). Pack your bags!`,
              read: false,
              relatedId: trip.id + '_approaching',
            });
          }
          const notificationId = trip.id + '_trip_date_approaching';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Trip Approaching! ✈️', `Your trip to ${trip.destination} is in ${daysDiff} days (${trip.targetTravelDate}). Pack your bags!`);
            addNotifiedId(notificationId);
          }
        }

        // b. Trip target date is near (travel date is in next 5 days)
        if (daysDiff >= 0 && daysDiff <= 5) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === trip.id + '_target_near' && n.type === 'trip_target_near'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'trip_target_near',
              title: `Target Date Near: ${trip.tripName} 🗓️`,
              message: `Your planned travel date for ${trip.tripName} is very close: ${trip.targetTravelDate}.`,
              read: false,
              relatedId: trip.id + '_target_near',
            });
          }
          const notificationId = trip.id + '_trip_target_near';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Target Date Near: ' + trip.tripName + ' 🗓️', `Your planned travel date for ${trip.tripName} is very close: ${trip.targetTravelDate}.`);
            addNotifiedId(notificationId);
          }
        }

        // c. Trip is underfunded (travel date is in next 3 days and savedAmount < estimatedBudget)
        if (daysDiff >= 0 && daysDiff <= 3 && trip.savedAmount < trip.estimatedBudget) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === trip.id + '_underfunded' && n.type === 'trip_underfunded'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'trip_underfunded',
              title: `Trip Underfunded Alert: ${trip.tripName} ⚠️`,
              message: `Your trip to ${trip.destination} is in ${daysDiff} days but only ${Math.round((trip.savedAmount / trip.estimatedBudget) * 100)}% funded. You still need ₹${(trip.estimatedBudget - trip.savedAmount).toLocaleString()}.`,
              read: false,
              relatedId: trip.id + '_underfunded',
            });
          }
          const notificationId = trip.id + '_trip_underfunded';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification('Trip Underfunded Alert ⚠️', `Your trip to ${trip.destination} is in ${daysDiff} days but only ${Math.round((trip.savedAmount / trip.estimatedBudget) * 100)}% funded.`);
            addNotifiedId(notificationId);
          }
        }
      }
    });

    // 7. Check Financial Notes Reminders
    financialNotes.forEach((note) => {
      if (note.status !== 'archived' && note.reminderDate) {
        const reminderDate = new Date(note.reminderDate);
        const daysDiff = differenceInCalendarDays(reminderDate, today);
        if (daysDiff >= 0 && daysDiff <= 1) {
          const alreadyNotified = notifications.some(
            (n) => n.relatedId === note.id && n.type === 'financial_note_reminder'
          );
          if (!alreadyNotified) {
            addNotification({
              type: 'financial_note_reminder',
              title: `Note Reminder: ${note.title} 📌`,
              message: note.description,
              read: false,
              relatedId: note.id,
            });
          }
          const notificationId = note.id + '_note_reminder';
          if (!notifiedIds.includes(notificationId)) {
            triggerNativeNotification(`Note Reminder: ${note.title} 📌`, note.description);
            addNotifiedId(notificationId);
          }
        }
      }
    });
  }, [bills, purchasePlanner, priorityPurchases, savingsGoals, trips, monthlyTargets, transactions, notifications, addNotification, financialNotes, notifiedIds, addNotifiedId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0]; mobile?: boolean }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => mobile && setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
          mobile ? 'text-base' : 'text-sm',
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block">PocketPilot</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {navItems.slice(0, 5).map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4">
                  <Input
                    placeholder="Search transactions, debts, loans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <SearchResults query={searchQuery} onClose={() => setSearchOpen(false)} />
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markNotificationRead(notification.id)}
                        className={cn(
                          'p-4 border-b cursor-pointer hover:bg-muted transition-colors',
                          !notification.read && 'bg-muted/50'
                        )}
                      >
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* More Nav (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 cursor-pointer">
                    <span>More</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
                  {navItems.slice(5).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 w-full cursor-pointer px-2 py-1.5 text-sm rounded-sm transition-colors",
                            isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="flex items-center justify-between mb-6">
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Wallet className="h-6 w-6 text-primary" />
                    <span>PocketPilot</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <NavLink key={item.href} item={item} mobile />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <FloatingActionButton />
      <MigrationModal />
    </div>
  );
}

function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const transactions = useAppStore((state) => state.transactions);
  const debts = useAppStore((state) => state.debts);
  const loans = useAppStore((state) => state.loans);
  const purchasePlanner = useAppStore((state) => state.purchasePlanner) || [];
  const priorityPurchases = useAppStore((state) => state.priorityPurchases) || [];
  const bills = useAppStore((state) => state.bills) || [];
  const savingsGoals = useAppStore((state) => state.savingsGoals) || [];
  const trips = useAppStore((state) => state.trips) || [];
  const financialNotes = useAppStore((state) => state.financialNotes) || [];

  if (!query.trim()) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Start typing to search...
      </div>
    );
  }

  const lowerQuery = query.toLowerCase();

  const matchedTransactions = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.amount.toString().includes(lowerQuery)
  );

  const matchedDebts = debts.filter(
    (d) =>
      d.personName.toLowerCase().includes(lowerQuery) ||
      d.reason.toLowerCase().includes(lowerQuery)
  );

  const matchedLoans = loans.filter(
    (l) =>
      l.name.toLowerCase().includes(lowerQuery) ||
      l.lender.toLowerCase().includes(lowerQuery)
  );

  const matchedPurchases = purchasePlanner.filter(
    (p) =>
      p.itemName.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery) ||
      p.notes.toLowerCase().includes(lowerQuery)
  );

  const matchedPriorityPurchases = priorityPurchases.filter(
    (p) =>
      p.itemName.toLowerCase().includes(lowerQuery) ||
      p.notes.toLowerCase().includes(lowerQuery)
  );

  const matchedBills = bills.filter(
    (b) =>
      b.billName.toLowerCase().includes(lowerQuery) ||
      b.category.toLowerCase().includes(lowerQuery) ||
      b.notes.toLowerCase().includes(lowerQuery)
  );

  const matchedSavingsGoals = savingsGoals.filter(
    (s) =>
      s.goalName.toLowerCase().includes(lowerQuery) ||
      s.notes.toLowerCase().includes(lowerQuery)
  );

  const matchedTrips = trips.filter(
    (t) =>
      t.tripName.toLowerCase().includes(lowerQuery) ||
      t.destination.toLowerCase().includes(lowerQuery) ||
      t.notes.toLowerCase().includes(lowerQuery)
  );

  const matchedNotes = financialNotes.filter(
    (n: FinancialNote) =>
      n.title.toLowerCase().includes(lowerQuery) ||
      n.description.toLowerCase().includes(lowerQuery) ||
      n.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
  );

  const hasResults =
    matchedTransactions.length ||
    matchedDebts.length ||
    matchedLoans.length ||
    matchedPurchases.length ||
    matchedPriorityPurchases.length ||
    matchedBills.length ||
    matchedSavingsGoals.length ||
    matchedTrips.length ||
    matchedNotes.length;

  if (!hasResults) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No results found
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {matchedTransactions.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Transactions
          </div>
          {matchedTransactions.slice(0, 5).map((t) => (
            <Link
              key={t.id}
              href="/transactions"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{t.description || t.category}</div>
                <div className="text-xs text-muted-foreground">{t.date}</div>
              </div>
              <div className={cn(
                'font-medium',
                t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedDebts.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Debts
          </div>
          {matchedDebts.slice(0, 3).map((d) => (
            <Link
              key={d.id}
              href="/debts"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{d.personName}</div>
                <div className="text-xs text-muted-foreground">{d.reason}</div>
              </div>
              <div className="font-medium text-orange-600 dark:text-orange-400">
                ₹{d.remainingAmount.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedLoans.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Loans
          </div>
          {matchedLoans.slice(0, 3).map((l) => (
            <Link
              key={l.id}
              href="/loans"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{l.name}</div>
                <div className="text-xs text-muted-foreground">{l.lender}</div>
              </div>
              <div className="font-medium text-blue-600 dark:text-blue-400">
                ₹{l.remainingAmount.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedPurchases.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Planned Purchases
          </div>
          {matchedPurchases.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href="/purchase-planner"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{p.itemName}</div>
                <div className="text-xs text-muted-foreground">{p.status} • {p.priority}</div>
              </div>
              <div className="font-medium text-teal-600 dark:text-teal-400">
                ₹{p.estimatedCost.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedPriorityPurchases.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Priority Purchases
          </div>
          {matchedPriorityPurchases.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href="/priority-purchases"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{p.itemName}</div>
                <div className="text-xs text-muted-foreground">Due: {p.deadline}</div>
              </div>
              <div className="font-medium text-destructive">
                ₹{p.estimatedCost.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedBills.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Bills & Payments
          </div>
          {matchedBills.slice(0, 3).map((b) => (
            <Link
              key={b.id}
              href="/bills"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{b.billName}</div>
                <div className="text-xs text-muted-foreground">Due: {b.dueDate} • {b.status}</div>
              </div>
              <div className="font-medium text-indigo-600 dark:text-indigo-400">
                ₹{b.amount.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedSavingsGoals.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Savings Goals
          </div>
          {matchedSavingsGoals.slice(0, 3).map((s) => (
            <Link
              key={s.id}
              href="/savings"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{s.goalName}</div>
                <div className="text-xs text-muted-foreground">Saved: ₹{s.savedAmount.toLocaleString()} / ₹{s.targetAmount.toLocaleString()}</div>
              </div>
              <div className="font-medium text-emerald-600 dark:text-emerald-400">
                ₹{s.remainingAmount.toLocaleString()} left
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedTrips.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Trips
          </div>
          {matchedTrips.slice(0, 3).map((t) => (
            <Link
              key={t.id}
              href="/trip-planner"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{t.tripName} ({t.destination})</div>
                <div className="text-xs text-muted-foreground">Saved: ₹{t.savedAmount.toLocaleString()} / ₹{t.estimatedBudget.toLocaleString()}</div>
              </div>
              <div className="font-medium text-emerald-600 dark:text-emerald-400">
                ₹{(t.estimatedBudget - t.savedAmount).toLocaleString()} left
              </div>
            </Link>
          ))}
        </div>
      )}
      {matchedNotes.length > 0 && (
        <div>
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Financial Notes
          </div>
          {matchedNotes.slice(0, 3).map((n) => (
            <Link
              key={n.id}
              href="/financial-notes"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer"
            >
              <div>
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{n.description}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {n.pinned ? '📌 Pinned' : 'Note'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
