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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-lg font-bold">Weekly Timetable</h2>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg text-xs flex items-center gap-2">
          <Camera className="w-4 h-4" /> Upload Timetable
        </Button>
      </div>

      <div className="p-4 sm:p-6 min-h-[200px] flex items-center justify-center">
        {settings.timetableImage ? (
          <div className="w-full relative group cursor-pointer" onClick={() => setIsOpen(true)}>
            <img 
              src={settings.timetableImage} 
              alt="Timetable" 
              className="w-full h-auto rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 object-contain max-h-[600px] transition-opacity group-hover:opacity-90"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
              <span className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
                Click to expand
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
              <ImageIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold">No Timetable Uploaded</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              Upload an image of your timetable to view it here.
            </p>
            <Button onClick={() => fileInputRef.current?.click()} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              Upload Timetable Image
            </Button>
          </div>
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
