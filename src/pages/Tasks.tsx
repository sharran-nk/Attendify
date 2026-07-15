import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, Circle, Calendar, Trash2 } from 'lucide-react';
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
      title: formData.title,
      description: formData.description || undefined,
      subjectId: formData.subjectId || undefined,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime || undefined,
      completed: false,
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
        <div className="ios-card p-1 flex gap-1">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
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
                    className={`ios-card p-3.5 ${isOverdue ? 'ring-2 ring-destructive/20' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleTaskComplete(task.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
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
                          <div className={`flex items-center gap-1 text-xs ${
                            isOverdue ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>{formatDueDate(task.dueDate)}</span>
                            {task.dueTime && <span>at {task.dueTime}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
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
