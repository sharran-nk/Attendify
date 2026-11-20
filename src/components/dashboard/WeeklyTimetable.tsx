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
    <div className="ios-card flex items-center justify-between px-5 py-4">
      <div 
        className={`flex items-center gap-4 ${settings.timetableImage ? 'cursor-pointer' : ''}`}
        onClick={() => { if (settings.timetableImage) setIsOpen(true); }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Timetable</h2>
          <p className="text-xs text-muted-foreground">
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
