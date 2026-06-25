'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  Calendar,
  AlertCircle,
  Pin,
  Archive,
  Search,
  Tag,
  ArrowUpDown,
  Filter,
  FileText
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
import { MainLayout } from '@/components/main-layout';
import { useAppStore, getCurrentDate } from '@/lib/store';
import { FinancialNote } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

const notePriorities = ['low', 'medium', 'high'] as const;

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Content is required'),
  priority: z.enum(notePriorities),
  reminderDate: z.string().optional().or(z.literal('')),
  tagsString: z.string().optional(),
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

export default function FinancialNotesPage() {
  const financialNotes = useAppStore((state) => state.financialNotes) || [];
  const addFinancialNote = useAppStore((state) => state.addFinancialNote);
  const updateFinancialNote = useAppStore((state) => state.updateFinancialNote);
  const deleteFinancialNote = useAppStore((state) => state.deleteFinancialNote);
  const pinFinancialNote = useAppStore((state) => state.pinFinancialNote);
  const archiveFinancialNote = useAppStore((state) => state.archiveFinancialNote);

  const searchParams = useSearchParams();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [showArchived, setShowArchived] = useState(false);

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
      title: '',
      description: '',
      priority: 'medium',
      reminderDate: '',
      tagsString: '',
    },
  });

  // Handle FAB/Quick Action navigation parameter
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddDialog();
      router.replace('/financial-notes');
    }
  }, [searchParams, router]);

  // Extract unique tags for filtering
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    financialNotes.forEach((note: FinancialNote) => {
      note.tags.forEach((tag: string) => {
        if (tag.trim()) {
          tagsSet.add(tag.trim().toLowerCase());
        }
      });
    });
    return Array.from(tagsSet);
  }, [financialNotes]);

  const onSubmit = (data: FormData) => {
    const tags = data.tagsString
      ? data.tagsString
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      : [];

    const payload = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      date: getCurrentDate(),
      reminderDate: data.reminderDate || undefined,
      tags,
    };

    if (selectedId) {
      updateFinancialNote(selectedId, payload);
      toast.success('Note updated successfully');
    } else {
      addFinancialNote(payload);
      toast.success('Note added successfully');
    }
    closeDialog();
  };

  const openAddDialog = () => {
    setSelectedId(null);
    reset({
      title: '',
      description: '',
      priority: 'medium',
      reminderDate: '',
      tagsString: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (note: FinancialNote) => {
    setSelectedId(note.id);
    reset({
      title: note.title,
      description: note.description,
      priority: note.priority,
      reminderDate: note.reminderDate || '',
      tagsString: note.tags.join(', '),
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
      deleteFinancialNote(selectedId);
      toast.success('Note deleted successfully');
    }
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  // Filter & Sort Logic
  const processedNotes = useMemo(() => {
    let result = [...financialNotes];

    // Filter by archived status
    if (showArchived) {
      result = result.filter((n: FinancialNote) => n.status === 'archived');
    } else {
      result = result.filter((n: FinancialNote) => n.status === 'active');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n: FinancialNote) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.tags.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      result = result.filter((n: FinancialNote) => n.priority === selectedPriority);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      result = result.filter((n: FinancialNote) => n.tags.map((t: string) => t.toLowerCase()).includes(selectedTag));
    }

    // Sorting
    result.sort((a: FinancialNote, b: FinancialNote) => {
      // Pinned notes always float to the top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'priority-high': {
          const weights: Record<'low' | 'medium' | 'high', number> = { high: 3, medium: 2, low: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        case 'priority-low': {
          const weights: Record<'low' | 'medium' | 'high', number> = { high: 3, medium: 2, low: 1 };
          return weights[a.priority] - weights[b.priority];
        }
        case 'date-asc':
          return a.createdAt - b.createdAt;
        case 'date-desc':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [financialNotes, searchQuery, selectedPriority, selectedTag, sortBy, showArchived]);

  const getPriorityColor = (priority: FinancialNote['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Financial Notes
            </h1>
            <p className="text-muted-foreground mt-1">
              Save key reminders, emergency notes, payment drafts, and notes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowArchived(!showArchived)} variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'View Active' : 'View Archived'}
            </Button>
            <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/95">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, content, tags..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <div className="flex items-center gap-1.5 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Priority" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <div className="flex items-center gap-1.5 text-xs">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Tag filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allUniqueTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    #{tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
                <SelectItem value="priority-high">Highest Priority</SelectItem>
                <SelectItem value="priority-low">Lowest Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes Grid */}
        {processedNotes.length === 0 ? (
          <Card className="py-12 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <FileText className="h-16 w-16 text-muted-foreground opacity-40 mb-4" />
              <h3 className="text-xl font-bold mb-1">
                {showArchived ? 'No archived notes' : 'No active notes'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {showArchived
                  ? 'Notes you archive will appear here instead of cluttering your active dashboard.'
                  : 'Start writing notes for salary changes, repayments, goals, or financial ideas.'}
              </p>
              {!showArchived && <Button onClick={openAddDialog}>Create Your First Note</Button>}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {processedNotes.map((note) => (
              <motion.div key={note.id} variants={itemVariants}>
                <Card className={cn(
                  'h-full flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden',
                  note.pinned && 'border-primary/50 bg-primary/5 dark:bg-primary/5'
                )}>
                  {/* Pinned visual accent line */}
                  {note.pinned && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-bold text-base leading-tight truncate max-w-[180px]">
                            {note.title}
                          </h3>
                          <Badge variant="outline" className={getPriorityColor(note.priority)}>
                            {note.priority}
                          </Badge>
                        </div>
                        <p className="text-xxs text-muted-foreground">
                          Logged: {format(new Date(note.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      {/* Control buttons (Pin / Archive) */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn('h-7 w-7', note.pinned && 'text-primary')}
                          onClick={() => pinFinancialNote(note.id)}
                        >
                          <Pin className="h-4 w-4" fill={note.pinned ? 'currentColor' : 'transparent'} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            archiveFinancialNote(note.id);
                            toast.info(note.status === 'active' ? 'Note archived' : 'Note unarchived');
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap flex-1">
                      {note.description}
                    </p>

                    <div className="space-y-3 pt-3 border-t text-xs">
                      {note.reminderDate && (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Reminder: {format(new Date(note.reminderDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}

                      {/* Tag badging */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 hover:bg-secondary/80 cursor-pointer"
                              onClick={() => setSelectedTag(tag)}
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Edit & Delete Action Row */}
                      <div className="flex justify-end gap-1.5 pt-1">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(note)}>
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedId(note.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedId ? 'Edit Note' : 'Add Financial Note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. repayment checklist, bike savings ideas"
                  {...register('title')}
                  className={cn(errors.title && 'border-destructive')}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Content / Details</Label>
                <Textarea
                  id="description"
                  placeholder="Save repayment steps, deadlines, dates, or drafts..."
                  rows={4}
                  {...register('description')}
                  className={cn(errors.description && 'border-destructive')}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(val) => setValue('priority', val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reminderDate">Reminder Date (optional)</Label>
                  <Input id="reminderDate" type="date" {...register('reminderDate')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tagsString">Tags (comma separated)</Label>
                <Input
                  id="tagsString"
                  placeholder="e.g. debt, emergency, goals"
                  {...register('tagsString')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">{selectedId ? 'Update' : 'Add'} Note</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Financial Note?</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this note? This action cannot be undone and will erase all data.
            </p>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
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
