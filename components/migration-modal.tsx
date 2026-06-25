'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Cloud, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function MigrationModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const localDataImported = useAppStore((state) => state.localDataImported);
  const migrateLocalStorageToCloud = useAppStore((state) => state.migrateLocalStorageToCloud);
  const skipLocalStorageMigration = useAppStore((state) => state.skipLocalStorageMigration);

  useEffect(() => {
    // Check if there is actual data in local storage
    const rawData = localStorage.getItem('pocketpilot-storage');
    if (!rawData || localDataImported) {
      setOpen(false);
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      const stateData = parsed.state || {};
      
      // Look for any existing items
      const hasLocalData =
        (stateData.transactions?.length || 0) > 0 ||
        (stateData.debts?.length || 0) > 0 ||
        (stateData.loans?.length || 0) > 0 ||
        (stateData.bills?.length || 0) > 0 ||
        (stateData.purchasePlanner?.length || 0) > 0 ||
        (stateData.savingsGoals?.length || 0) > 0 ||
        (stateData.trips?.length || 0) > 0 ||
        (stateData.financialNotes?.length || 0) > 0;

      if (hasLocalData) {
        setOpen(true);
      } else {
        // If local storage is empty or only holds settings/defaults, skip modal trigger
        skipLocalStorageMigration();
      }
    } catch (err) {
      console.error('Error parsing local storage for migration check:', err);
    }
  }, [localDataImported, skipLocalStorageMigration]);

  const handleImport = async () => {
    setLoading(true);
    try {
      const success = await migrateLocalStorageToCloud();
      if (success) {
        toast.success('Your local data has been successfully imported to the cloud! 🚀');
        
        // Prompt user to clear local storage cache
        if (confirm('Import successful! Would you like to clear your browser\'s local storage cache to complete the migration? (Highly recommended)')) {
          // Keep only the Zustand persist metadata key if needed, or remove pocketpilot-storage to reset
          localStorage.removeItem('pocketpilot-storage');
          toast.success('Browser local storage cache cleared.');
        }
        setOpen(false);
      } else {
        toast.error('Data migration failed. Please try again.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred during migration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (confirm('Are you sure you want to skip? You can still import manually using the JSON import settings, but this prompt will not appear again.')) {
      setLoading(true);
      try {
        const success = await skipLocalStorageMigration();
        if (success) {
          toast.info('Migration skipped.');
          setOpen(false);
        }
      } catch (err) {
        toast.error('An error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border border-white/10 bg-slate-900/95 backdrop-blur-md text-white">
        <DialogHeader className="space-y-3">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <Cloud className="h-6 w-6 text-primary animate-bounce" />
          </div>
          <DialogTitle className="text-xl font-bold text-center tracking-tight">
            Import Existing Local Data?
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-center text-sm leading-relaxed">
            We detected personal financial data stored in your browser&apos;s local storage.
            Would you like to import all transactions, bills, trips, notes, and targets into your cloud account?
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs items-start leading-relaxed my-2">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Importing merges your local data with any current cloud records. Clear your local cache after import to prevent duplicate triggers on subsequent devices.
          </p>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0 mt-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full border-white/10 hover:bg-white/5 text-slate-300 font-semibold"
            disabled={loading}
          >
            Skip
          </Button>
          <Button
            onClick={handleImport}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Data'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
