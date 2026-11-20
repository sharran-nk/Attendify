import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

import { toast } from 'sonner';

export function InstallPrompt() {
  const { shouldShowPrompt, isIOS, promptInstall, dismissPrompt } = usePWAInstall();

  if (!shouldShowPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:bottom-8 md:left-auto md:right-8 md:w-96"
      >
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          
          {/* Close button */}
          <button 
            onClick={dismissPrompt}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            {/* App Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Install Attendify</h3>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                Smart Attendance Tracking for College Students.
              </p>
            </div>

            {isIOS ? (
              <div className="w-full bg-muted/50 rounded-2xl p-4 mt-2">
                <p className="text-sm font-medium mb-3 text-left">To install as an app:</p>
                <ol className="text-sm text-left space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <div className="bg-background rounded-lg p-2 shadow-sm border border-border/50">
                      <Share size={16} className="text-blue-500" />
                    </div>
                    <span>Tap the <strong>Share</strong> button</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-background rounded-lg p-2 shadow-sm border border-border/50">
                      <PlusSquare size={16} className="text-foreground" />
                    </div>
                    <span>Select <strong>Add to Home Screen</strong></span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="w-full mt-2">
                <div className="flex gap-2 justify-center mb-4 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded-full">
                    <Smartphone size={12} />
                    <span>Works Offline</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded-full">
                    <Download size={12} />
                    <span>Fast Load</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    promptInstall().then(success => {
                      if (!success) {
                        toast.info("Please click the install icon in your browser's address bar.");
                      }
                    });
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Install App
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
