import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, Circle, Calendar, Trash2, ExternalLink, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApp } from '@/contexts/AppContext';
import { format, parseISO, isToday, isPast, isTomorrow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Tasks() {
  const { tasks, subjects, addTask, toggleTaskComplete, deleteTask } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    dueTime: '',
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    addTask({
      title: formData.title.trim(),
      dueDate: formData.dueDate,
      completed: false,
      ...(formData.description ? { description: formData.description.trim() } : {}),
      ...(formData.subjectId ? { subjectId: formData.subjectId } : {}),
      ...(formData.dueTime ? { dueTime: formData.dueTime } : {}),
    });

    closeDialog();
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      dueTime: '',
    });
  };

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Overdue';
    return format(date, 'MMM d');
  };

  const getGoogleCalendarUrl = (task: typeof tasks[0], subjectName?: string) => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = encodeURIComponent(`Task: ${task.title} ${subjectName ? `(${subjectName})` : ''}`);
    const details = task.description ? encodeURIComponent(task.description) : '';
    
    const dateStr = task.dueDate.replace(/-/g, '');
    let dates = `${dateStr}/${dateStr}`;
    
    if (task.dueTime) {
       const timeStr = task.dueTime.replace(':', '') + '00';
       dates = `${dateStr}T${timeStr}/${dateStr}T${timeStr}`; 
    }
    
    return `${baseUrl}&text=${text}&details=${details}&dates=${dates}`;
  };

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'pending') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <PageContainer 
      title="Tasks" 
      subtitle={`${pendingCount} pending, ${completedCount} completed`}
      rightAction={
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAddOpen(true)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </motion.button>
      }
    >
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="ios-card p-1 flex gap-1" role="tablist" aria-label="Filter tasks">
          {(['all', 'pending', 'completed'] as const).map((f) => {
            const count = f === 'all' ? tasks.length : f === 'pending' ? pendingCount : completedCount;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ${
                  filter === f
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold ${
                    filter === f ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tasks List */}
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ios-card p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                {filter === 'pending' ? 'All caught up!' : 'No tasks yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'pending' 
                  ? 'You have no pending tasks'
                  : 'Add your first task to get started'
                }
              </p>
              {filter !== 'completed' && (
                <Button onClick={() => setIsAddOpen(true)} className="ios-button">
                  Add Task
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task, index) => {
                const subject = subjects.find(s => s.id === task.subjectId);
                const isOverdue = isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && !task.completed;
                
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    className={`ios-card relative overflow-hidden p-3.5 ${isOverdue ? 'border-destructive/30' : ''} ${task.completed ? 'opacity-70' : ''}`}
                  >
                    {isOverdue && (
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-destructive" />
                    )}
                    <div className="flex items-start gap-2.5">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleTaskComplete(task.id)}
                        aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                        aria-pressed={task.completed}
                        className="-m-1 flex-shrink-0 p-1"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-6 h-6 text-success" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                      </motion.button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {subject && (
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                              <span className="text-xs text-muted-foreground">{subject.name}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            isOverdue
                              ? 'bg-destructive/10 text-destructive'
                              : isToday(parseISO(task.dueDate)) && !task.completed
                                ? 'bg-warning/10 text-warning'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>{formatDueDate(task.dueDate)}</span>
                            {task.dueTime && <span>at {task.dueTime}</span>}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label={`Options for "${task.title}"`}
                            className="-mr-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.open(getGoogleCalendarUrl(task, subject?.name), '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Add to Google Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteTask(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Submit assignment"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="ios-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Add details..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="ios-input min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Select 
                value={formData.subjectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
              >
                <SelectTrigger className="ios-input">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="ios-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Time (Optional)</Label>
                <Input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                  className="ios-input"
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full ios-button"
              disabled={!formData.title.trim()}
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
