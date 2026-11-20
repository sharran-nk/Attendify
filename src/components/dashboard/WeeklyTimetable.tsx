import React, { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { generateDefaultTimetable } from '@/lib/defaultTimetable';
import { parseTimeToMinutes } from '@/utils/timetable';
import { DayOfWeek } from '@/types/attendance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAYS: { key: DayOfWeek; short: string }[] = [
  { key: 'Monday', short: 'Mon' },
  { key: 'Tuesday', short: 'Tue' },
  { key: 'Wednesday', short: 'Wed' },
  { key: 'Thursday', short: 'Thu' },
  { key: 'Friday', short: 'Fri' },
  { key: 'Saturday', short: 'Sat' },
];

/** The week at a glance, plus the option to keep a photo of the printed timetable. */
export function WeeklyTimetable() {
  const { settings, updateSettings, timetable } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const today = format(new Date(), 'EEEE');

  const slots = useMemo(
    () => (timetable && timetable.length > 0 ? timetable : generateDefaultTimetable()),
    [timetable]
  );

  const times = useMemo(
    () =>
      Array.from(new Set(slots.map(s => s.startTime))).sort(
        (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
      ),
    [slots]
  );

  const cell = (day: DayOfWeek, time: string) => slots.find(s => s.day === day && s.startTime === time);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('That image is over 3 MB. Choose a smaller one.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      updateSettings({ timetableImage: base64 });
      toast.success('Timetable photo saved');
    };
    reader.onerror = () => toast.error("Couldn't read that image");
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section aria-labelledby="week-heading" className="ios-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="week-heading" className="text-xl font-bold text-foreground">
          This week
        </h2>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
            aria-label="Upload timetable photo"
          />
          {settings.timetableImage && (
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
              <ImageIcon aria-hidden="true" />
              View photo
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            aria-label={settings.timetableImage ? 'Replace timetable photo' : 'Upload timetable photo'}
          >
            <Camera aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="-mx-5 mt-4 overflow-x-auto px-5">
        <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">Weekly timetable. Rows are periods, columns are days.</caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 pb-2 text-xs font-medium text-muted-foreground">
                Time
              </th>
              {DAYS.map(d => (
                <th
                  key={d.key}
                  scope="col"
                  className={cn(
                    'rounded-t-md px-2 pb-2 pt-1.5 text-sm font-semibold',
                    d.key === today ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {d.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map(time => (
              <tr key={time}>
                <th
                  scope="row"
                  className="tabular border-t border-border py-2 pr-2 text-xs font-medium text-muted-foreground"
                >
                  {time}
                </th>
                {DAYS.map(d => {
                  const slot = cell(d.key, time);
                  const name = slot?.isBreak ? slot.breakLabel || 'Break' : slot?.subjectName || '';
                  return (
                    <td
                      key={d.key}
                      className={cn(
                        'border-t border-border px-2 py-2',
                        d.key === today && 'bg-primary/5',
                        slot?.isBreak ? 'text-xs italic text-muted-foreground' : 'font-medium text-foreground'
                      )}
                    >
                      {name || <span aria-hidden="true" className="text-border">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex max-h-[95vh] max-w-[95vw] items-center justify-center overflow-hidden border-none bg-transparent p-0 shadow-none [&>button]:text-white">
          <DialogTitle className="sr-only">Timetable photo</DialogTitle>
          {settings.timetableImage && (
            <img
              src={settings.timetableImage}
              alt="Your timetable"
              className="h-auto max-h-[95vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
