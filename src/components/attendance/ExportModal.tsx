import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generatePDF, generateCSV, downloadCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, BookOpen, FileSpreadsheet, FileText } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DateRangeType = 'all' | 'week' | 'month' | 'custom';
type ExportFormatType = 'pdf' | 'csv';

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { subjects, attendance, settings } = useApp();
  const { user } = useAuth();

  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [formatType, setFormatType] = useState<ExportFormatType>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    // Bounded timeout to simulate and show generating state
    setTimeout(() => {
      try {
        // Resolve date range values
        let start: Date | undefined;
        let end: Date | undefined;

        if (dateRangeType === 'week') {
          start = startOfWeek(new Date(), { weekStartsOn: 1 });
          end = endOfWeek(new Date(), { weekStartsOn: 1 });
        } else if (dateRangeType === 'month') {
          start = startOfMonth(new Date());
          end = endOfMonth(new Date());
        } else if (dateRangeType === 'custom') {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            toast.error('Invalid custom date range selected.');
            setIsExporting(false);
            return;
          }
          if (start > end) {
            toast.error('Start date cannot be after end date.');
            setIsExporting(false);
            return;
          }
        }

        const reportData = {
          userName: user?.name || 'Student',
          userEmail: user?.email || 'N/A',
          subjects,
          attendance,
          dateRange: {
            type: dateRangeType,
            start,
            end,
          },
          selectedSubjectId,
          warningThreshold: settings.attendanceWarningThreshold || 75,
        };

        // Filter attendance to verify we have records
        let filtered = [...attendance];
        if (selectedSubjectId !== 'all') {
          filtered = filtered.filter(e => e.subjectId === selectedSubjectId);
        }
        if (start && end) {
          filtered = filtered.filter(e => {
            const d = new Date(e.date);
            return d >= start! && d <= end!;
          });
        }

        if (filtered.length === 0) {
          toast.error('No attendance records found for the selected period.');
          setIsExporting(false);
          return;
        }

        const dateSuffix = format(new Date(), 'yyyyMMdd_HHmmss');
        const filename = `Attendance_Report_${dateSuffix}`;

        if (formatType === 'pdf') {
          const doc = generatePDF(reportData);
          doc.save(`${filename}.pdf`);
          toast.success('Report generated successfully!');
        } else {
          const csvContent = generateCSV(reportData);
          downloadCSV(csvContent, `${filename}.csv`);
          toast.success('Attendance CSV downloaded successfully.');
        }
        
        onClose();
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(`Export failed. Please try again.`);
      } finally {
        setIsExporting(false);
      }
    }, 1200); // 1.2s delay to show loading state nicely
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isExporting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
          <DialogDescription>
            Configure your filters below and choose a format to download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-primary" /> Date Range
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['all', 'week', 'month', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDateRangeType(type)}
                  className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                    dateRangeType === type
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {type === 'all' ? 'All Time' : type === 'week' ? 'This Week' : type === 'month' ? 'This Month' : 'Custom'}
                </button>
              ))}
            </div>

            {dateRangeType === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">End Date</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" /> Subject Filter
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormatType('pdf')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  formatType === 'pdf'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                <FileText className="w-4 h-4" /> PDF Document
              </button>
              <button
                type="button"
                onClick={() => setFormatType('csv')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  formatType === 'csv'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV Sheet
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Export Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
