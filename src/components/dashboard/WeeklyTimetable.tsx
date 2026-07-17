import React, { useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Camera, Image as ImageIcon, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
import { Subject } from '@/types/attendance';

export function WeeklyTimetable() {
  const { settings, updateSettings, subjects } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [scannedSubjects, setScannedSubjects] = useState<Subject[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image too large. Please upload an image under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      updateSettings({ timetableImage: base64 });
      toast.success("Timetable image saved!");

      setIsScanning(true);
      toast.info("Scanning timetable for subjects...");
      
      try {
        const { data: { text } } = await Tesseract.recognize(base64, 'eng');
        
        const foundSubjects = subjects.filter(s => 
          text.toLowerCase().includes(s.name.toLowerCase()) ||
          (s.instructor && text.toLowerCase().includes(s.instructor.toLowerCase()))
        );
        
        setScannedSubjects(foundSubjects);
        setShowSyncModal(true);
      } catch (err) {
        console.error("OCR Error:", err);
        toast.error("Failed to scan timetable text.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.onerror = () => toast.error("Failed to read image");
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSyncGoogleCalendar = () => {
    // Basic Google Calendar Template generator (for demo purposes we open the first found subject)
    const subject = scannedSubjects[0];
    if (subject) {
      const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
      const text = encodeURIComponent(`Class: ${subject.name}`);
      const details = encodeURIComponent(`Instructor: ${subject.instructor || 'N/A'}`);
      window.open(`${baseUrl}&text=${text}&details=${details}`, '_blank');
    }
    setShowSyncModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-center justify-between">
      <div 
        className={`flex items-center gap-4 ${settings.timetableImage ? 'cursor-pointer' : ''}`}
        onClick={() => { if (settings.timetableImage) setIsOpen(true); }}
      >
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="font-bold text-base">Weekly Timetable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isScanning ? "Scanning image..." : settings.timetableImage ? "Tap to view schedule" : "No image uploaded"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg h-9 w-9 p-0" title="Upload New Timetable" disabled={isScanning}>
          <Camera className="w-4 h-4" />
        </Button>
        {settings.timetableImage && (
          <Button variant="default" size="sm" onClick={() => setIsOpen(true)} className="rounded-lg h-9 px-4">
            View
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden [&>button]:text-white">
          <DialogTitle className="sr-only">Timetable Preview</DialogTitle>
          {settings.timetableImage && (
            <img 
              src={settings.timetableImage} 
              alt="Timetable Fullscreen" 
              className="w-auto h-auto max-w-full max-h-[95vh] object-contain rounded-xl shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Google Calendar Sync
          </DialogTitle>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              We detected the following subjects from your timetable:
            </p>
            {scannedSubjects.length > 0 ? (
              <ul className="list-disc pl-5 text-sm font-medium">
                {scannedSubjects.map(s => <li key={s.id}>{s.name}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md">
                No matching subjects found in your records.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Would you like to automatically integrate this with Google Calendar?
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowSyncModal(false)} className="flex-1 ios-button">
                Cancel
              </Button>
              <Button 
                onClick={handleSyncGoogleCalendar} 
                className="flex-1 ios-button bg-primary text-primary-foreground"
                disabled={scannedSubjects.length === 0}
              >
                Sync Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
