import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Edit2, Trash2, BookOpen, ChevronDown, Check, X } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApp } from '@/contexts/AppContext';
import { AttendanceRing } from '@/components/ui/AttendanceRing';
import { Subject, ExamMarks } from '@/types/attendance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { calculateMissableClasses } from '@/utils/attendance';

const subjectColors = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5856D6', '#00C7BE', '#FF2D55', '#FF6482', '#32ADE6'
];

export default function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject, settings, addCoursePlan, deleteCoursePlan, coursePlans } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    instructor: '',
    credits: '' as number | '',
    totalClasses: 0,
    attendedClasses: 0,
    color: subjectColors[0],
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter a subject name.");
      return;
    }
    if (!formData.credits || formData.credits <= 0) {
      alert("Please enter a valid number of credits (greater than 0).");
      return;
    }

    const payload = {
      ...formData,
      credits: Number(formData.credits)
    };

    if (editingSubject) {
      updateSubject(editingSubject.id, payload);
    } else {
      addSubject(payload);
    }

    closeDialog();
  };

  const handleExamMarksChange = (subjectId: string, field: keyof ExamMarks, value: number | undefined) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      updateSubject(subjectId, {
        examMarks: {
          ...subject.examMarks,
          [field]: value,
        }
      });
    }
  };

  const handleFileUpload = async (subjectId: string, file: File) => {
    if (file.size > 500 * 1024) { // 500KB limit for local storage safety
      alert("File too large. Please upload files smaller than 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      addCoursePlan({
        subjectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      instructor: subject.instructor || '',
      credits: subject.credits || '',
      totalClasses: subject.totalClasses,
      attendedClasses: subject.attendedClasses,
      color: subject.color,
    });
    setIsAddOpen(true);
  };

  const toggleExpanded = (subjectId: string) => {
    setExpandedSubjectId(prev => prev === subjectId ? null : subjectId);
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      instructor: '',
      credits: '',
      totalClasses: 0,
      attendedClasses: 0,
      color: subjectColors[subjects.length % subjectColors.length],
    });
  };

  const getAttendancePercentage = (subject: Subject) => {
    if (subject.totalClasses === 0) return 100;
    return (subject.attendedClasses / subject.totalClasses) * 100;
  };

  const getExamTotal = (examMarks?: ExamMarks) => {
    if (!examMarks) return { obtained: 0, max: 100 };
    const obtained = (examMarks.ct1 || 0) + (examMarks.ct2 || 0) + (examMarks.project || 0) + (examMarks.endSem || 0);
    const max = (examMarks.ct1Max || 25) + (examMarks.ct2Max || 25) + (examMarks.projectMax || 50) + (examMarks.endSemMax || 50);
    return { obtained, max };
  };

  return (
    <PageContainer
      title="Subjects"
      subtitle={`${subjects.length} subjects`}
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
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {subjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ios-card p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Subjects Yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first subject to start tracking attendance
              </p>
              <Button onClick={() => setIsAddOpen(true)} className="ios-button">
                Add Subject
              </Button>
            </motion.div>
          ) : (
            subjects.map((subject, index) => {
              const percentage = getAttendancePercentage(subject);
              const isLow = percentage < settings.attendanceWarningThreshold;
              const isExpanded = expandedSubjectId === subject.id;
              const examTotal = getExamTotal(subject.examMarks);

              return (
                <motion.div
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`ios-card overflow-hidden ${isLow ? 'ring-2 ring-destructive/20 border-destructive/20' : ''}`}
                >
                  {/* Subject Header */}
                  <div
                    className="p-3.5 cursor-pointer active:bg-muted/50 transition-colors"
                    onClick={() => toggleExpanded(subject.id)}
                  >
                    <div className="flex items-center gap-3">
                      <AttendanceRing
                        percentage={percentage}
                        size="sm"
                        color={subject.color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                          <h3 className="font-semibold truncate">{subject.name}</h3>
                        </div>
                        {subject.instructor && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {subject.instructor}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {subject.attendedClasses} / {subject.totalClasses} classes • {subject.credits || 0} credits
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(subject);
                          }}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubject(subject.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expandable Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3.5 pb-3.5 space-y-5">

                          {/* Attendance Prediction */}
                          <div className="space-y-2.5 pt-2 border-t border-border/40">
                            <h4 className="text-[13px] font-medium text-muted-foreground">Attendance Prediction</h4>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="p-2.5 bg-success/10 rounded-xl">
                                <p className="text-[11px] text-muted-foreground mb-0.5">If You Attend Next</p>
                                <p className="text-base font-bold text-success">
                                  {((subject.attendedClasses + 1) / (subject.totalClasses + 1) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div className="p-2.5 bg-destructive/10 rounded-xl">
                                <p className="text-[11px] text-muted-foreground mb-0.5">If You Miss Next</p>
                                <p className="text-base font-bold text-destructive">
                                  {((subject.attendedClasses) / (subject.totalClasses + 1) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            {/* Missable Classes Calculation */}
                            <div className="mt-2.5 p-2.5 bg-secondary/30 rounded-xl border border-border/40">
                              {(() => {
                                const missable = calculateMissableClasses(
                                  subject.attendedClasses,
                                  subject.totalClasses,
                                  settings.attendanceWarningThreshold
                                );

                                return (
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${missable > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                      {missable > 0 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {missable > 0
                                          ? `Safe to Miss: ${missable} Class${missable !== 1 ? 'es' : ''}`
                                          : 'Cannot Miss More Classes'}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {missable > 0
                                          ? `You can miss ${missable} more classes and stay above ${settings.attendanceWarningThreshold}%`
                                          : `You are at or below the ${settings.attendanceWarningThreshold}% threshold`}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Course Materials */}
                          <div className="space-y-2.5 pt-2 border-t border-border/40">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[13px] font-medium text-muted-foreground">Course Materials</h4>
                              <label className="cursor-pointer text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90 transition-colors">
                                Upload PDF
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleFileUpload(subject.id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            <div className="space-y-2">
                              {coursePlans.filter(cp => cp.subjectId === subject.id).length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No files uploaded</p>
                              ) : (
                                coursePlans.filter(cp => cp.subjectId === subject.id).map(plan => (
                                  <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                                      <span className="truncate max-w-[150px]">{plan.fileName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const win = window.open();
                                          if (win) {
                                            win.document.write('<iframe src="' + plan.fileData + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                                          }
                                        }}
                                        className="text-xs text-primary hover:underline"
                                      >
                                        View
                                      </button>
                                      <button
                                        onClick={() => deleteCoursePlan(plan.id)}
                                        className="text-xs text-destructive hover:underline"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Exam Marks */}
                          <div className="space-y-2.5 pt-2 border-t border-border/40">
                            <h4 className="text-[13px] font-medium text-muted-foreground mb-2">Exam Marks</h4>

                            {/* CT1 */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">CT1</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={subject.examMarks?.ct1Max || 25}
                                  value={subject.examMarks?.ct1 ?? ''}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'ct1',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-16 h-8 text-center text-sm"
                                  placeholder="--"
                                />
                                <span className="text-muted-foreground text-sm">/</span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={subject.examMarks?.ct1Max || 25}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'ct1Max',
                                    parseInt(e.target.value) || 25
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-14 h-8 text-center text-sm"
                                />
                              </div>
                            </div>

                            {/* CT2 */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">CT2</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={subject.examMarks?.ct2Max || 25}
                                  value={subject.examMarks?.ct2 ?? ''}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'ct2',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-16 h-8 text-center text-sm"
                                  placeholder="--"
                                />
                                <span className="text-muted-foreground text-sm">/</span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={subject.examMarks?.ct2Max || 25}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'ct2Max',
                                    parseInt(e.target.value) || 25
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-14 h-8 text-center text-sm"
                                />
                              </div>
                            </div>

                            {/* Project */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Project</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={subject.examMarks?.projectMax || 50}
                                  value={subject.examMarks?.project ?? ''}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'project',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-16 h-8 text-center text-sm"
                                  placeholder="--"
                                />
                                <span className="text-muted-foreground text-sm">/</span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={subject.examMarks?.projectMax || 50}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'projectMax',
                                    parseInt(e.target.value) || 50
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-14 h-8 text-center text-sm"
                                />
                              </div>
                            </div>

                            {/* End Sem */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">End Sem</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={subject.examMarks?.endSemMax || 50}
                                  value={subject.examMarks?.endSem ?? ''}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'endSem',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-16 h-8 text-center text-sm"
                                  placeholder="--"
                                />
                                <span className="text-muted-foreground text-sm">/</span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={subject.examMarks?.endSemMax || 50}
                                  onChange={(e) => handleExamMarksChange(
                                    subject.id,
                                    'endSemMax',
                                    parseInt(e.target.value) || 50
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  className="ios-input w-14 h-8 text-center text-sm"
                                />
                              </div>
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                              <span className="text-sm font-semibold">Total</span>
                              <span className="text-lg font-bold text-primary">
                                {examTotal.obtained.toFixed(1)}
                                <span className="text-sm text-muted-foreground font-normal"> / {examTotal.max}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isAddOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="ios-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instructor (Optional)</Label>
                <Input
                  placeholder="e.g., Prof. Smith"
                  value={formData.instructor}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                  className="ios-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credits: e.target.value
                  }))}
                  className="ios-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Classes</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.totalClasses}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    totalClasses: parseInt(e.target.value) || 0
                  }))}
                  className="ios-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Attended</Label>
                <Input
                  type="number"
                  min={0}
                  max={formData.totalClasses}
                  value={formData.attendedClasses}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    attendedClasses: Math.min(
                      parseInt(e.target.value) || 0,
                      formData.totalClasses
                    )
                  }))}
                  className="ios-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {subjectColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full ios-button"
              disabled={!formData.name.trim()}
            >
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}