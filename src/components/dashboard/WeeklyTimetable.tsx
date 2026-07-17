import React, { useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function WeeklyTimetable() {
  const { settings, updateSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image too large. Please upload an image under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateSettings({ timetableImage: base64 });
      toast.success("Timetable image saved!");
    };
    reader.onerror = () => toast.error("Failed to read image");
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-center justify-between">
      <div 
        className={`flex items-center gap-4 ${settings.timetableImage ? 'cursor-pointer' : ''}`}
        onClick={() => { if (settings.timetableImage) setIsOpen(true); }}
      >
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-base">Weekly Timetable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {settings.timetableImage ? "Tap to view schedule" : "No image uploaded"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg h-9 w-9 p-0" title="Upload New Timetable">
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
    </div>
  );
}
