'use client';

import React, { useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Settings, Sun, Moon, Monitor, Download, Upload, Trash2, Database, Palette, User } from 'lucide-react';
import { getCurrentDate } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/main-layout';
import { useAppStore } from '@/lib/store';
import { currencyNames } from '@/lib/currency';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const exportData = useAppStore((state) => state.exportData);
  const importData = useAppStore((state) => state.importData);
  const clearAllData = useAppStore((state) => state.clearAllData);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedModules, setSelectedModules] = useState<string[]>([
    'income', 'expenses', 'debts', 'loans', 'bills', 'purchase-planner',
    'priority-purchases', 'trip-planner', 'savings-goals', 'monthly-goals', 'financial-notes'
  ]);

  const modules = [
    { id: 'income', label: 'Income Data' },
    { id: 'expenses', label: 'Expense Data' },
    { id: 'debts', label: 'Outstanding Debts' },
    { id: 'loans', label: 'Loans Ledger' },
    { id: 'bills', label: 'Upcoming Bills' },
    { id: 'purchase-planner', label: 'Purchase Planner' },
    { id: 'priority-purchases', label: 'Priority Purchases' },
    { id: 'trip-planner', label: 'Trip Planner' },
    { id: 'savings-goals', label: 'Savings Goals' },
    { id: 'monthly-goals', label: 'Monthly Targets' },
    { id: 'financial-notes', label: 'Financial Notes' },
  ];

  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVExport = () => {
    try {
      const state = useAppStore.getState();
      const currency = state.settings.currency;

      const convertToCSV = (headers: string[], rows: any[][]) => {
        const headerLine = headers.join(',');
        const rowLines = rows.map(r => r.map(val => {
          const stringVal = val === null || val === undefined ? '' : String(val);
          return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(','));
        return [headerLine, ...rowLines].join('\n');
      };

      if (selectedModules.includes('income')) {
        const incomeRows = state.transactions
          .filter((t) => t.type === 'income')
          .map((t) => [t.date, t.category, t.description, t.amount, t.paymentMethod || '']);
        const csv = convertToCSV(['Date', 'Category', 'Description', `Amount (${currency})`, 'Payment Method'], incomeRows);
        downloadCSV(`pocketpilot-income-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('expenses')) {
        const expenseRows = state.transactions
          .filter((t) => t.type === 'expense')
          .map((t) => [t.date, t.category, t.description, t.amount, t.paymentMethod || '']);
        const csv = convertToCSV(['Date', 'Category', 'Description', `Amount (${currency})`, 'Payment Method'], expenseRows);
        downloadCSV(`pocketpilot-expenses-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('debts')) {
        const debtRows = state.debts.map((d) => [d.personName, d.amount, d.remainingAmount, d.reason, d.dueDate, d.status, d.notes]);
        const csv = convertToCSV(['Person Name', 'Original Amount', 'Remaining Amount', 'Reason', 'Due Date', 'Status', 'Notes'], debtRows);
        downloadCSV(`pocketpilot-debts-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('loans')) {
        const loanRows = state.loans.map((l) => [l.name, l.lender, l.originalAmount, l.remainingAmount, l.interest || 0, l.dueDate, l.status, l.notes]);
        const csv = convertToCSV(['Loan Name', 'Lender', 'Original Amount', 'Remaining Amount', 'Interest Rate', 'Due Date', 'Status', 'Notes'], loanRows);
        downloadCSV(`pocketpilot-loans-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('bills')) {
        const billRows = state.bills.map((b) => [b.billName, b.amount, b.dueDate, b.category, b.status, b.notes]);
        const csv = convertToCSV(['Bill Name', 'Amount', 'Due Date', 'Category', 'Status', 'Notes'], billRows);
        downloadCSV(`pocketpilot-bills-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('purchase-planner')) {
        const purchaseRows = state.purchasePlanner.map((p) => [p.itemName, p.estimatedCost, p.category, p.priority, p.targetDate, p.status, p.notes]);
        const csv = convertToCSV(['Item Name', 'Estimated Cost', 'Category', 'Priority', 'Target Date', 'Status', 'Notes'], purchaseRows);
        downloadCSV(`pocketpilot-purchase-planner-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('priority-purchases')) {
        const priorityRows = state.priorityPurchases.map((p) => [p.itemName, p.estimatedCost, p.deadline, p.priority, p.notes, p.purchased ? 'yes' : 'no']);
        const csv = convertToCSV(['Item Name', 'Estimated Cost', 'Deadline', 'Priority', 'Notes', 'Purchased'], priorityRows);
        downloadCSV(`pocketpilot-priority-purchases-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('trip-planner')) {
        const tripRows = state.trips.map((t) => [t.tripName, t.destination, t.estimatedBudget, t.savedAmount, t.targetTravelDate, t.priority, t.status, t.paymentStatus, t.notes]);
        const csv = convertToCSV(['Trip Name', 'Destination', 'Estimated Budget', 'Saved Amount', 'Target Travel Date', 'Priority', 'Status', 'Payment Status', 'Notes'], tripRows);
        downloadCSV(`pocketpilot-trip-planner-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('savings-goals')) {
        const savingsRows = state.savingsGoals.map((s) => [s.goalName, s.targetAmount, s.savedAmount, s.remainingAmount, s.deadline, s.notes]);
        const csv = convertToCSV(['Goal Name', 'Target Amount', 'Saved Amount', 'Remaining Amount', 'Deadline', 'Notes'], savingsRows);
        downloadCSV(`pocketpilot-savings-goals-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('monthly-goals')) {
        const goalRows = state.monthlyTargets.map((g) => [g.month, g.targetAmount, g.currentEarned, g.savingsTargetAmount || 0, g.spendingLimitAmount || 0]);
        const csv = convertToCSV(['Month', 'Income Target', 'Current Earned', 'Savings Target', 'Spending Limit'], goalRows);
        downloadCSV(`pocketpilot-monthly-goals-${getCurrentDate()}.csv`, csv);
      }
      if (selectedModules.includes('financial-notes')) {
        const noteRows = state.financialNotes.map((n) => [n.title, n.description, n.priority, n.date, n.reminderDate || '', n.tags.join(';'), n.status, n.pinned ? 'yes' : 'no']);
        const csv = convertToCSV(['Title', 'Description', 'Priority', 'Date Created', 'Reminder Date', 'Tags', 'Status', 'Pinned'], noteRows);
        downloadCSV(`pocketpilot-financial-notes-${getCurrentDate()}.csv`, csv);
      }
      toast.success('CSV sheets exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleExcelExport = async () => {
    const toastId = toast.loading('Preparing Excel document...');
    try {
      const XLSX = await import('xlsx');
      const state = useAppStore.getState();
      const wb = XLSX.utils.book_new();

      const addSheet = (sheetName: string, data: any[]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      if (selectedModules.includes('income')) {
        const incomeRows = state.transactions
          .filter((t) => t.type === 'income')
          .map((t) => ({
            Date: t.date,
            Category: t.category,
            Description: t.description,
            Amount: t.amount,
            PaymentMethod: t.paymentMethod || '',
          }));
        addSheet('Income', incomeRows);
      }
      if (selectedModules.includes('expenses')) {
        const expenseRows = state.transactions
          .filter((t) => t.type === 'expense')
          .map((t) => ({
            Date: t.date,
            Category: t.category,
            Description: t.description,
            Amount: t.amount,
            PaymentMethod: t.paymentMethod || '',
          }));
        addSheet('Expenses', expenseRows);
      }
      if (selectedModules.includes('debts')) {
        const debtRows = state.debts.map((d) => ({
          Person: d.personName,
          Amount: d.amount,
          Remaining: d.remainingAmount,
          Reason: d.reason,
          DueDate: d.dueDate,
          Status: d.status,
          Notes: d.notes,
        }));
        addSheet('Debts', debtRows);
      }
      if (selectedModules.includes('loans')) {
        const loanRows = state.loans.map((l) => ({
          Name: l.name,
          Lender: l.lender,
          Amount: l.originalAmount,
          Remaining: l.remainingAmount,
          Interest: l.interest || 0,
          DueDate: l.dueDate,
          Status: l.status,
          Notes: l.notes,
        }));
        addSheet('Loans', loanRows);
      }
      if (selectedModules.includes('bills')) {
        const billRows = state.bills.map((b) => ({
          BillName: b.billName,
          Amount: b.amount,
          DueDate: b.dueDate,
          Category: b.category,
          Status: b.status,
          Notes: b.notes,
        }));
        addSheet('Bills', billRows);
      }
      if (selectedModules.includes('purchase-planner')) {
        const purchaseRows = state.purchasePlanner.map((p) => ({
          ItemName: p.itemName,
          Cost: p.estimatedCost,
          Category: p.category,
          Priority: p.priority,
          TargetDate: p.targetDate,
          Status: p.status,
          Notes: p.notes,
        }));
        addSheet('Purchase Planner', purchaseRows);
      }
      if (selectedModules.includes('priority-purchases')) {
        const priorityRows = state.priorityPurchases.map((p) => ({
          ItemName: p.itemName,
          Cost: p.estimatedCost,
          Deadline: p.deadline,
          Priority: p.priority,
          Notes: p.notes,
          Purchased: p.purchased ? 'Yes' : 'No',
        }));
        addSheet('Priority Purchases', priorityRows);
      }
      if (selectedModules.includes('trip-planner')) {
        const tripRows = state.trips.map((t) => ({
          TripName: t.tripName,
          Destination: t.destination,
          Budget: t.estimatedBudget,
          Saved: t.savedAmount,
          TravelDate: t.targetTravelDate,
          Priority: t.priority,
          Status: t.status,
          PaymentStatus: t.paymentStatus,
          Notes: t.notes,
        }));
        addSheet('Trips', tripRows);
      }
      if (selectedModules.includes('savings-goals')) {
        const savingsRows = state.savingsGoals.map((s) => ({
          GoalName: s.goalName,
          Target: s.targetAmount,
          Saved: s.savedAmount,
          Remaining: s.remainingAmount,
          Deadline: s.deadline,
          Notes: s.notes,
        }));
        addSheet('Savings Goals', savingsRows);
      }
      if (selectedModules.includes('monthly-goals')) {
        const goalRows = state.monthlyTargets.map((g) => ({
          Month: g.month,
          IncomeTarget: g.targetAmount,
          Earned: g.currentEarned,
          SavingsTarget: g.savingsTargetAmount || 0,
          SpendingLimit: g.spendingLimitAmount || 0,
        }));
        addSheet('Monthly Goals', goalRows);
      }
      if (selectedModules.includes('financial-notes')) {
        const noteRows = state.financialNotes.map((n) => ({
          Title: n.title,
          Description: n.description,
          Priority: n.priority,
          DateCreated: n.date,
          ReminderDate: n.reminderDate || '',
          Tags: n.tags.join(', '),
          Status: n.status,
          Pinned: n.pinned ? 'Yes' : 'No',
        }));
        addSheet('Financial Notes', noteRows);
      }

      XLSX.writeFile(wb, `pocketpilot-financial-report-${getCurrentDate()}.xlsx`);
      toast.success('Excel workbook exported successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate Excel file', { id: toastId });
    }
  };

  const handlePDFExport = async () => {
    const toastId = toast.loading('Generating PDF report...');
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const state = useAppStore.getState();
      const currency = state.settings.currency;

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('PocketPilot Financial Report', 14, 25);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);
      doc.text(`Owner profile: ${state.settings.userName || 'Priyatham'}`, 14, 39);
      doc.text(`Default currency: ${currency}`, 14, 45);

      doc.setDrawColor(220);
      doc.line(14, 50, 196, 50);

      let yPos = 60;

      const addTable = (title: string, headers: string[], rows: any[][]) => {
        if (rows.length === 0) return;

        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(13);
        doc.setTextColor(50);
        doc.text(title, 14, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [headers],
          body: rows,
          theme: 'striped',
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229] },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => {
            yPos = (data as any).cursor.y + 15;
          },
        });
      };

      if (selectedModules.includes('income')) {
        const incomeRows = state.transactions
          .filter((t) => t.type === 'income')
          .map((t) => [t.date, t.category, t.description, `₹${t.amount.toLocaleString()}`]);
        addTable('Income Transactions', ['Date', 'Category', 'Description', 'Amount'], incomeRows);
      }
      if (selectedModules.includes('expenses')) {
        const expenseRows = state.transactions
          .filter((t) => t.type === 'expense')
          .map((t) => [t.date, t.category, t.description, `₹${t.amount.toLocaleString()}`]);
        addTable('Expense Transactions', ['Date', 'Category', 'Description', 'Amount'], expenseRows);
      }
      if (selectedModules.includes('debts')) {
        const debtRows = state.debts.map((d) => [d.personName, `₹${d.amount.toLocaleString()}`, `₹${d.remainingAmount.toLocaleString()}`, d.dueDate, d.status]);
        addTable('Outstanding Debts List', ['Person', 'Original Amount', 'Remaining', 'Due Date', 'Status'], debtRows);
      }
      if (selectedModules.includes('loans')) {
        const loanRows = state.loans.map((l) => [l.name, l.lender, `₹${l.originalAmount.toLocaleString()}`, `₹${l.remainingAmount.toLocaleString()}`, `${l.interest || 0}%`, l.status]);
        addTable('Loans Ledger', ['Loan Name', 'Lender', 'Original', 'Remaining', 'Interest', 'Status'], loanRows);
      }
      if (selectedModules.includes('bills')) {
        const billRows = state.bills.map((b) => [b.billName, `₹${b.amount.toLocaleString()}`, b.dueDate, b.category, b.status]);
        addTable('Bills Summary', ['Bill Name', 'Amount', 'Due Date', 'Category', 'Status'], billRows);
      }
      if (selectedModules.includes('purchase-planner')) {
        const purchaseRows = state.purchasePlanner.map((p) => [p.itemName, `₹${p.estimatedCost.toLocaleString()}`, p.category, p.priority, p.targetDate, p.status]);
        addTable('Planned Purchases', ['Item Name', 'Estimated Cost', 'Category', 'Priority', 'Target Date', 'Status'], purchaseRows);
      }
      if (selectedModules.includes('priority-purchases')) {
        const priorityRows = state.priorityPurchases.map((p) => [p.itemName, `₹${p.estimatedCost.toLocaleString()}`, p.deadline, p.priority, p.purchased ? 'Yes' : 'No']);
        addTable('Priority Purchases', ['Item Name', 'Cost', 'Deadline', 'Priority', 'Purchased'], priorityRows);
      }
      if (selectedModules.includes('trip-planner')) {
        const tripRows = state.trips.map((t) => [t.tripName, t.destination, `₹${t.estimatedBudget.toLocaleString()}`, `₹${t.savedAmount.toLocaleString()}`, t.targetTravelDate, t.status]);
        addTable('Trip Budgets Planner', ['Trip Name', 'Destination', 'Budget', 'Saved Amount', 'Travel Date', 'Status'], tripRows);
      }
      if (selectedModules.includes('savings-goals')) {
        const savingsRows = state.savingsGoals.map((s) => [s.goalName, `₹${s.targetAmount.toLocaleString()}`, `₹${s.savedAmount.toLocaleString()}`, `₹${s.remainingAmount.toLocaleString()}`, s.deadline]);
        addTable('Savings Goals Targets', ['Goal Name', 'Target Amount', 'Saved', 'Remaining', 'Deadline'], savingsRows);
      }
      if (selectedModules.includes('monthly-goals')) {
        const goalRows = state.monthlyTargets.map((g) => [g.month, `₹${g.targetAmount.toLocaleString()}`, `₹${g.currentEarned.toLocaleString()}`, `₹${(g.savingsTargetAmount || 0).toLocaleString()}`, `₹${(g.spendingLimitAmount || 0).toLocaleString()}`]);
        addTable('Monthly Goals History', ['Month', 'Income Target', 'Current Earned', 'Savings Target', 'Spending Limit'], goalRows);
      }
      if (selectedModules.includes('financial-notes')) {
        const noteRows = state.financialNotes.map((n) => [n.title, n.priority, n.date, n.reminderDate || 'None', n.status, n.pinned ? 'Yes' : 'No']);
        addTable('Financial Notes & Reminders', ['Title', 'Priority', 'Date Logged', 'Reminder Date', 'Status', 'Pinned'], noteRows);
      }

      doc.save(`pocketpilot-financial-report-${getCurrentDate()}.pdf`);
      toast.success('PDF report exported successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF report', { id: toastId });
    }
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocketpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const success = importData(data);
          if (success) {
            toast.success('Data imported successfully');
          } else {
            toast.error('Invalid backup file');
          }
        } catch (error) {
          toast.error('Failed to import data');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    clearAllData();
    toast.success('All data cleared');
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure your preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Customize your personal profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Display Name</Label>
                <Input
                  id="userName"
                  placeholder="e.g. Priyatham"
                  value={settings.userName || ''}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex-1"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
              <CardDescription>Set your preferred currency</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.currency}
                onValueChange={(value) => updateSettings({ currency: value as any })}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ INR - Indian Rupee</SelectItem>
                  <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                  <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Notifications Threshold */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure alert thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Large Expense Warning Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you record an expense above this amount
                </p>
                <Select
                  value={settings.largeExpenseThreshold.toString()}
                  onValueChange={(value) => updateSettings({ largeExpenseThreshold: parseInt(value) })}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">₹1,000</SelectItem>
                    <SelectItem value="5000">₹5,000</SelectItem>
                    <SelectItem value="10000">₹10,000</SelectItem>
                    <SelectItem value="25000">₹25,000</SelectItem>
                    <SelectItem value="50000">₹50,000</SelectItem>
                    <SelectItem value="100000">₹1,00,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>System Push Notifications</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enable browser local notifications for upcoming payments, bills, notes, and milestones.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        toast.success('System notifications enabled successfully!');
                      } else {
                        toast.error('Notification permission was denied.');
                      }
                    } else {
                      toast.error('Browser does not support notifications.');
                    }
                  }}
                >
                  Enable Push Notifications 🔔
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export, import, or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download all your financial data as a JSON file
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Backup
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Import Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Restore your data from a backup file
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Backup
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-destructive">Danger Zone</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your transactions, debts, loans, and monthly targets.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Export Center */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Center
              </CardTitle>
              <CardDescription>Export your financial worksheets to CSV, Excel, or PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checkbox Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {modules.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`export-${m.id}`}
                      checked={selectedModules.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModules([...selectedModules, m.id]);
                        } else {
                          setSelectedModules(selectedModules.filter((id) => id !== m.id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 bg-background"
                    />
                    <Label htmlFor={`export-${m.id}`} className="text-xs cursor-pointer select-none">
                      {m.label}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex gap-2 pt-2 text-xs">
                <Button variant="ghost" size="sm" onClick={() => setSelectedModules(modules.map(m => m.id))}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedModules([])}>
                  Deselect All
                </Button>
              </div>

              <Separator />

              {/* Export format triggers */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={handleCSVExport} disabled={selectedModules.length === 0}>
                  Export as CSV 📄
                </Button>
                <Button size="sm" variant="outline" onClick={handleExcelExport} disabled={selectedModules.length === 0}>
                  Export as Excel (.xlsx) 📊
                </Button>
                <Button size="sm" variant="outline" onClick={handlePDFExport} disabled={selectedModules.length === 0}>
                  Export as PDF 📕
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground text-sm">
                <p className="font-semibold">PocketPilot</p>
                <p className="mt-1">Personal Finance Tracker</p>
                <p className="mt-2 text-xs">Version 1.0.0</p>
                <p className="mt-1 text-xs">All data stored locally in your browser</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
