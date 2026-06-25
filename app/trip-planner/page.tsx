'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInCalendarDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import {
  Plus,
  Plane,
  Edit2,
  Trash2,
  Check,
  Calendar as CalendarIcon,
  HelpCircle,
  DollarSign,
  Trophy,
  Sparkles,
  PlusCircle,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentDate, useSelectors } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { TripStatus, TripPaymentStatus, Trip } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const tripPriorities = ['low', 'medium', 'high'] as const;
const tripStatuses: TripStatus[] = ['planning', 'saving_money', 'budget_ready', 'trip_completed', 'cancelled'];
const paymentStatuses: TripPaymentStatus[] = ['not_started', 'partially_funded', 'fully_funded', 'booked', 'completed'];

const schema = z.object({
  tripName: z.string().min(1, 'Trip name is required'),
  destination: z.string().min(1, 'Destination is required'),
  targetTravelDate: z.string().min(1, 'Travel date is required'),
  priority: z.enum(tripPriorities),
  notes: z.string().optional(),
  status: z.enum(tripStatuses as [string, ...string[]]),
  paymentStatus: z.enum(paymentStatuses as [string, ...string[]]),
  travelBreakdown: z.number().min(0),
  hotelBreakdown: z.number().min(0),
  foodBreakdown: z.number().min(0),
  shoppingBreakdown: z.number().min(0),
  activitiesBreakdown: z.number().min(0),
  emergencyBreakdown: z.number().min(0),
  miscBreakdown: z.number().min(0),
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

export default function TripPlannerPage() {
  const trips = useAppStore((state) => state.trips) || [];
  const addTrip = useAppStore((state) => state.addTrip);
  const updateTrip = useAppStore((state) => state.updateTrip);
  const deleteTrip = useAppStore((state) => state.deleteTrip);
  const addTripContribution = useAppStore((state) => state.addTripContribution);
  const deleteTripContribution = useAppStore((state) => state.deleteTripContribution);

  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'trips' | 'calendar'>('trips');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [contributionAmount, setContributionAmount] = useState<number>(0);
  const [contributionNotes, setContributionNotes] = useState<string>('');
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

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
      tripName: '',
      destination: '',
      targetTravelDate: getCurrentDate(),
      priority: 'medium',
      notes: '',
      status: 'planning',
      paymentStatus: 'not_started',
      travelBreakdown: 0,
      hotelBreakdown: 0,
      foodBreakdown: 0,
      shoppingBreakdown: 0,
      activitiesBreakdown: 0,
      emergencyBreakdown: 0,
      miscBreakdown: 0,
    },
  });

  const { currency } = useSelectors();

  // Handle Quick Action navigation trigger
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddDialog();
      // Remove query parameter cleanly
      router.replace('/trip-planner');
    }
  }, [searchParams, router]);

  // Watch breakdown fields to compute total estimated budget dynamically
  const travelCost = watch('travelBreakdown') || 0;
  const hotelCost = watch('hotelBreakdown') || 0;
  const foodCost = watch('foodBreakdown') || 0;
  const shoppingCost = watch('shoppingBreakdown') || 0;
  const activitiesCost = watch('activitiesBreakdown') || 0;
  const emergencyCost = watch('emergencyBreakdown') || 0;
  const miscCost = watch('miscBreakdown') || 0;

  const totalCalculatedBudget = useMemo(() => {
    return travelCost + hotelCost + foodCost + shoppingCost + activitiesCost + emergencyCost + miscCost;
  }, [travelCost, hotelCost, foodCost, shoppingCost, activitiesCost, emergencyCost, miscCost]);

  // Summary Metrics
  const activeTrips = trips.filter((t) => t.status !== 'trip_completed' && t.status !== 'cancelled');
  const totalReserved = activeTrips.reduce((sum, t) => sum + t.savedAmount, 0);
  const totalRequired = activeTrips.reduce((sum, t) => sum + t.estimatedBudget, 0);
  const totalRemaining = Math.max(0, totalRequired - totalReserved);
  const totalTripsCount = activeTrips.length;
  const readyToBookCount = activeTrips.filter((t) => t.paymentStatus === 'fully_funded' || t.savedAmount >= t.estimatedBudget).length;

  const onSubmit = (data: FormData) => {
    const calculatedBudget = totalCalculatedBudget > 0 ? totalCalculatedBudget : 0;
    const expenses = {
      travel: data.travelBreakdown,
      hotel: data.hotelBreakdown,
      food: data.foodBreakdown,
      shopping: data.shoppingBreakdown,
      activities: data.activitiesBreakdown,
      emergency: data.emergencyBreakdown,
      misc: data.miscBreakdown,
    };

    if (selectedId) {
      updateTrip(selectedId, {
        tripName: data.tripName,
        destination: data.destination,
        estimatedBudget: calculatedBudget,
        targetTravelDate: data.targetTravelDate,
        priority: data.priority,
        notes: data.notes || '',
        status: data.status as TripStatus,
        paymentStatus: data.paymentStatus as TripPaymentStatus,
        expenses,
      });
    } else {
      addTrip({
        tripName: data.tripName,
        destination: data.destination,
        estimatedBudget: calculatedBudget,
        targetTravelDate: data.targetTravelDate,
        priority: data.priority,
        notes: data.notes || '',
        status: data.status as TripStatus,
        paymentStatus: data.paymentStatus as TripPaymentStatus,
        expenses,
      });
    }
    closeDialog();
  };

  const openEditDialog = (trip: Trip) => {
    setSelectedId(trip.id);
    setValue('tripName', trip.tripName);
    setValue('destination', trip.destination);
    setValue('targetTravelDate', trip.targetTravelDate);
    setValue('priority', trip.priority);
    setValue('status', trip.status);
    setValue('paymentStatus', trip.paymentStatus);
    setValue('notes', trip.notes);

    const exp = trip.expenses || { travel: 0, hotel: 0, food: 0, shopping: 0, activities: 0, emergency: 0, misc: 0 };
    setValue('travelBreakdown', exp.travel);
    setValue('hotelBreakdown', exp.hotel);
    setValue('foodBreakdown', exp.food);
    setValue('shoppingBreakdown', exp.shopping);
    setValue('activitiesBreakdown', exp.activities);
    setValue('emergencyBreakdown', exp.emergency);
    setValue('miscBreakdown', exp.misc);
    
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      tripName: '',
      destination: '',
      targetTravelDate: getCurrentDate(),
      priority: 'medium',
      notes: '',
      status: 'planning',
      paymentStatus: 'not_started',
      travelBreakdown: 0,
      hotelBreakdown: 0,
      foodBreakdown: 0,
      shoppingBreakdown: 0,
      activitiesBreakdown: 0,
      emergencyBreakdown: 0,
      miscBreakdown: 0,
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
      deleteTrip(selectedId);
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const handleAddMoneySubmit = () => {
    if (selectedId && contributionAmount > 0) {
      const trip = trips.find(t => t.id === selectedId);
      addTripContribution(selectedId, {
        amount: contributionAmount,
        notes: contributionNotes || 'Manual allocation',
      });

      // Show Confetti if trip becomes fully funded
      if (trip && (trip.savedAmount + contributionAmount) >= trip.estimatedBudget && trip.savedAmount < trip.estimatedBudget) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      setAddMoneyDialogOpen(false);
      setContributionAmount(0);
      setContributionNotes('');
      setSelectedId(null);
    }
  };

  const getPriorityColor = (priority: Trip['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'budget_ready':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'trip_completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'saving_money':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: TripPaymentStatus) => {
    switch (status) {
      case 'fully_funded':
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'booked':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'partially_funded':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Days remaining calculation helper
  const getDaysRemaining = (dateStr: string) => {
    const travelDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    travelDate.setHours(0, 0, 0, 0);
    return differenceInCalendarDays(travelDate, today);
  };

  // Calendar Days computation
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentCalendarDate);
    const end = endOfMonth(currentCalendarDate);
    const days = eachDayOfInterval({ start, end });
    const startOffset = getDay(start); // 0 (Sun) - 6 (Sat)
    
    const paddedDays = [];
    // Add empty placeholders for day of week offset
    for (let i = 0; i < startOffset; i++) {
      paddedDays.push(null);
    }
    return [...paddedDays, ...days];
  }, [currentCalendarDate]);

  const activeTripCalendarMapping = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    trips
      .filter((t) => t.status !== 'cancelled' && t.status !== 'trip_completed')
      .forEach((t) => {
        if (t.targetTravelDate) {
          if (!map[t.targetTravelDate]) {
            map[t.targetTravelDate] = [];
          }
          map[t.targetTravelDate].push(t);
        }
      });
    return map;
  }, [trips]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [selectedTripId, trips]);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto relative">
        
        {/* Floating Custom CSS Confetti */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-xxs" />
              {[...Array(60)].map((_, i) => {
                const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                return (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                    initial={{
                      x: Math.random() * window.innerWidth - window.innerWidth / 2,
                      y: -100,
                      rotate: 0,
                    }}
                    animate={{
                      y: window.innerHeight + 100,
                      rotate: 720,
                      x: `calc(${Math.random() * 200 - 100}px + ${Math.random() * window.innerWidth - window.innerWidth / 2}px)`,
                    }}
                    transition={{
                      duration: Math.random() * 3 + 2,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-card p-6 rounded-2xl shadow-2xl border flex flex-col items-center gap-2 z-10 max-w-xs text-center"
              >
                <Trophy className="h-12 w-12 text-yellow-500 animate-bounce" />
                <h3 className="font-bold text-lg">Goal Reached!</h3>
                <p className="text-sm text-muted-foreground">Congratulations! Your trip budget is fully funded and ready to book.</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary animate-pulse" />
              Trip Budget Planner
            </h1>
            <p className="text-muted-foreground mt-1">Reserve funds gradually and budget details for future travel plans</p>
          </div>
          <Button onClick={openAddDialog} className="mt-4 md:mt-0 bg-primary hover:bg-primary/95">
            <Plus className="h-4 w-4 mr-2" />
            Plan a Trip
          </Button>
        </div>

        {/* Summary Metric Cards */}
        {trips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="card-gradient-balance border-0 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Planned Trips</p>
                    <p className="text-2xl font-bold mt-1">{totalTripsCount}</p>
                  </div>
                  <Plane className="h-10 w-10 text-primary/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient-target border-0 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget Required</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(totalRequired, currency)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-teal-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient-income border-0 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Money Reserved</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalReserved, currency)}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-emerald-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient-debt border-0 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ready to Book</p>
                    <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{readyToBookCount}</p>
                  </div>
                  <Trophy className="h-10 w-10 text-yellow-500/40" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Selection */}
        {trips.length > 0 && (
          <div className="flex justify-between items-center mb-6 bg-muted/30 p-2 rounded-lg">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activeTab === 'trips' ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveTab('trips');
                  setSelectedTripId(null);
                }}
              >
                My Trips
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('calendar')}
              >
                Calendar View
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {trips.length === 0 ? (
          <Card className="py-12 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <Compass className="h-16 w-16 text-muted-foreground opacity-40 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold mb-1">No trips planned yet.</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Map out travel costs, allocate savings slowly, and calculate dynamic expense breakdowns.
              </p>
              <Button onClick={openAddDialog}>Plan Your First Trip</Button>
            </CardContent>
          </Card>
        ) : activeTab === 'trips' ? (
          /* Trips List */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6"
          >
            {trips.map((trip) => {
              const progressPercent = trip.estimatedBudget > 0 ? Math.min(100, (trip.savedAmount / trip.estimatedBudget) * 100) : 0;
              const remaining = Math.max(0, trip.estimatedBudget - trip.savedAmount);
              const daysRemaining = getDaysRemaining(trip.targetTravelDate);
              const formattedDate = format(new Date(trip.targetTravelDate), 'MMM d, yyyy');

              return (
                <motion.div key={trip.id} variants={itemVariants}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4 border-b">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-primary">
                            <Plane className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-bold">{trip.tripName}</h2>
                              <Badge variant="outline" className={getPriorityColor(trip.priority)}>
                                {trip.priority} priority
                              </Badge>
                              <Badge className={getStatusColor(trip.status)}>
                                {trip.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPaymentStatusColor(trip.paymentStatus)}>
                                {trip.paymentStatus.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">Destination: {trip.destination}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-200 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            onClick={() => {
                              setSelectedId(trip.id);
                              setContributionAmount(0);
                              setContributionNotes('');
                              setAddMoneyDialogOpen(true);
                            }}
                          >
                            <PlusCircle className="h-4 w-4 mr-1.5" />
                            Add Money
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(trip)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedId(trip.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                      {/* Funding Progress */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Reserved Money Progress</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {progressPercent.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Saved: {formatCurrency(trip.savedAmount, currency)}</span>
                            <span>Total Budget: {formatCurrency(trip.estimatedBudget, currency)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center bg-muted/20 p-3 rounded-lg border">
                          <div>
                            <p className="text-xxs text-muted-foreground uppercase tracking-wider">Remaining</p>
                            <p className="text-sm font-bold text-red-500 mt-0.5">{formatCurrency(remaining, currency)}</p>
                          </div>
                          <div className="border-l border-r px-2">
                            <p className="text-xxs text-muted-foreground uppercase tracking-wider">Travel Date</p>
                            <p className="text-xs font-semibold mt-1 truncate">{formattedDate}</p>
                          </div>
                          <div>
                            <p className="text-xxs text-muted-foreground uppercase tracking-wider">Timeline</p>
                            <p className={cn(
                              'text-sm font-bold mt-0.5',
                              daysRemaining < 0 ? 'text-red-500' : daysRemaining === 0 ? 'text-orange-500' : 'text-primary'
                            )}>
                              {daysRemaining < 0
                                ? `${Math.abs(daysRemaining)}d ago`
                                : daysRemaining === 0
                                ? 'Today!'
                                : `${daysRemaining}d left`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Accordions for Breakdowns & Contributions */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
                        {/* Expense Breakdown */}
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Compass className="h-4 w-4 text-indigo-500" />
                            Trip Estimated Budget Breakdown
                          </h4>
                          {trip.expenses ? (
                            <div className="space-y-2 text-xs">
                              {[
                                { label: 'Travel / Flights', val: trip.expenses.travel },
                                { label: 'Hotel / Stays', val: trip.expenses.hotel },
                                { label: 'Food / Restaurants', val: trip.expenses.food },
                                { label: 'Shopping', val: trip.expenses.shopping },
                                { label: 'Activities / Sightseeing', val: trip.expenses.activities },
                                { label: 'Emergency Budget', val: trip.expenses.emergency },
                                { label: 'Miscellaneous', val: trip.expenses.misc },
                              ].map((item, idx) => (
                                <div key={idx} className="flex justify-between py-1 border-b last:border-0">
                                  <span className="text-muted-foreground">{item.label}</span>
                                  <span className="font-semibold">{formatCurrency(item.val || 0, currency)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No expense breakdown logged.</p>
                          )}
                        </div>

                        {/* Contribution Logs */}
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Contribution History Logs
                          </h4>
                          {trip.contributions && trip.contributions.length > 0 ? (
                            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                              {trip.contributions.map((log) => (
                                <div key={log.id} className="p-2 bg-muted/30 rounded border text-xs flex justify-between items-start gap-4">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(log.amount, currency)}</span>
                                      <span className="text-xxs text-muted-foreground">{log.date} {log.time}</span>
                                    </div>
                                    {log.notes && <p className="text-muted-foreground mt-0.5 italic">&quot;{log.notes}&quot;</p>}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:text-destructive"
                                    onClick={() => deleteTripContribution(trip.id, log.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 border rounded bg-muted/10 text-xs text-muted-foreground italic">
                              No contributions made yet. Click &quot;Add Money&quot; to reserve funds.
                            </div>
                          )}
                        </div>
                      </div>

                      {trip.notes && (
                        <div className="p-3 bg-muted/20 rounded border text-xs text-muted-foreground">
                          <span className="font-bold">Trip Planner Notes: </span>
                          <span>{trip.notes}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Calendar View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {format(currentCalendarDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs border-b pb-2 mb-2 text-muted-foreground uppercase tracking-wider">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="h-16 bg-muted/5 rounded-md" />;

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                    const matchedTripsList = activeTripCalendarMapping[dateStr] || [];

                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          'h-16 border rounded-md p-1 flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-accent/40 transition-colors',
                          isToday && 'bg-accent/70 border-primary',
                          matchedTripsList.length > 0 && 'border-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10'
                        )}
                        onClick={() => {
                          if (matchedTripsList.length > 0) {
                            setSelectedTripId(matchedTripsList[0].id);
                          }
                        }}
                      >
                        <span className={cn(
                          'text-xxs font-bold rounded-sm h-5 w-5 flex items-center justify-center',
                          isToday && 'bg-primary text-primary-foreground'
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {matchedTripsList.length > 0 && (
                          <div className="text-xxs truncate bg-indigo-600 text-white font-semibold rounded-sm px-1 py-0.5 text-center mt-1 animate-pulse">
                            ✈️ {matchedTripsList[0].tripName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Trip Details */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">Trip Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-6">
                {selectedTrip ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg">{selectedTrip.tripName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Destination: {selectedTrip.destination}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span>Funded Status</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {((selectedTrip.savedAmount / selectedTrip.estimatedBudget) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={(selectedTrip.savedAmount / selectedTrip.estimatedBudget) * 100} className="h-2" />
                    </div>

                    <div className="space-y-2 text-xs border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Travel Date:</span>
                        <span className="font-semibold">{format(new Date(selectedTrip.targetTravelDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Budget Status:</span>
                        <span className="font-semibold uppercase text-emerald-600 dark:text-emerald-400">{selectedTrip.paymentStatus.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-bold text-red-500">{formatCurrency(Math.max(0, selectedTrip.estimatedBudget - selectedTrip.savedAmount), currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <span className="font-bold text-primary">{getDaysRemaining(selectedTrip.targetTravelDate)} days</span>
                      </div>
                    </div>

                    <Button asChild size="sm" className="w-full mt-4 bg-primary hover:bg-primary/95">
                      <Link href={`/trip-planner?trip=${selectedTrip.id}`} onClick={() => setActiveTab('trips')}>
                        Go to Details
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs italic">
                    Click on a marked calendar date with a trip icon to display summary details here.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedId ? 'Edit Planned Trip' : 'Plan Travel Trip'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  placeholder="e.g. Goa Trip, Euro Summer 2026"
                  {...register('tripName')}
                  className={cn(errors.tripName && 'border-destructive')}
                />
                {errors.tripName && (
                  <p className="text-sm text-destructive">{errors.tripName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="e.g. Panaji, Paris"
                    {...register('destination')}
                    className={cn(errors.destination && 'border-destructive')}
                  />
                  {errors.destination && (
                    <p className="text-sm text-destructive">{errors.destination.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetTravelDate">Target Travel Date</Label>
                  <Input
                    id="targetTravelDate"
                    type="date"
                    {...register('targetTravelDate')}
                    className={cn(errors.targetTravelDate && 'border-destructive')}
                  />
                  {errors.targetTravelDate && (
                    <p className="text-sm text-destructive">{errors.targetTravelDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(val) => setValue('priority', val as 'low' | 'medium' | 'high')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tripPriorities.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trip Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(val) => setValue('status', val as TripStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tripStatuses.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedId && (
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Funding Status</Label>
                  <Select
                    value={watch('paymentStatus')}
                    onValueChange={(val) => setValue('paymentStatus', val as TripPaymentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatuses.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Expense Breakdown Subform */}
              <div className="border rounded-lg p-4 bg-muted/10 space-y-3">
                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Dynamic Expense Breakdown</h4>
                <p className="text-xxs text-muted-foreground">Fill itemized cost estimates to calculate the Total Budget automatically.</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="travelBreakdown">Travel / Flights (₹)</Label>
                    <Input id="travelBreakdown" type="number" step="1" {...register('travelBreakdown', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hotelBreakdown">Hotel / Stays (₹)</Label>
                    <Input id="hotelBreakdown" type="number" step="1" {...register('hotelBreakdown', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="foodBreakdown">Food / Dining (₹)</Label>
                    <Input id="foodBreakdown" type="number" step="1" {...register('foodBreakdown', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="shoppingBreakdown">Shopping Budget (₹)</Label>
                    <Input id="shoppingBreakdown" type="number" step="1" {...register('shoppingBreakdown', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="activitiesBreakdown">Activities / Tours (₹)</Label>
                    <Input id="activitiesBreakdown" type="number" step="1" {...register('activitiesBreakdown', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emergencyBreakdown">Emergency Buffer (₹)</Label>
                    <Input id="emergencyBreakdown" type="number" step="1" {...register('emergencyBreakdown', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="miscBreakdown">Miscellaneous (₹)</Label>
                    <Input id="miscBreakdown" type="number" step="1" {...register('miscBreakdown', { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t font-semibold text-sm">
                  <span>Total Calculated Budget:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(totalCalculatedBudget, currency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Itinerary draft, hotels shortlist, packing lists..."
                  {...register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? 'Update' : 'Plan'} Trip
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Money Contribution Dialog */}
        <Dialog open={addMoneyDialogOpen} onOpenChange={setAddMoneyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Reserved Money to Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-2">
                <Label htmlFor="contributionAmount">Allocation Amount (₹)</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  placeholder="Enter amount to reserve"
                  value={contributionAmount || ''}
                  onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contributionNotes">Contribution Note / Reference</Label>
                <Input
                  id="contributionNotes"
                  placeholder="e.g. Leftover freelance cash"
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMoneyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMoneySubmit} disabled={contributionAmount <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Reserve Money
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trip Plan</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this trip budget plan? All contribution history logs will be removed. This action cannot be undone.</p>
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
