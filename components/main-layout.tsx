'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
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
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/debts', label: 'Debts', icon: CreditCard },
  { href: '/loans', label: 'Loans', icon: Banknote },
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
              {navItems.slice(5).map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
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
    </div>
  );
}

function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const transactions = useAppStore((state) => state.transactions);
  const debts = useAppStore((state) => state.debts);
  const loans = useAppStore((state) => state.loans);

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

  const hasResults = matchedTransactions.length || matchedDebts.length || matchedLoans.length;

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
        <div>
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
    </div>
  );
}
