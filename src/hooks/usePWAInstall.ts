import { useState, useEffect } from 'react';

// Extend the Window interface for iOS standalone detection
declare global {
  interface Window {
    MSStream: any;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export interface PWAInstallState {
  isInstallable: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  deferredPrompt: any | null;
  hasDismissed: boolean;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isIOS: false,
    isInstalled: false,
    deferredPrompt: null,
    hasDismissed: localStorage.getItem('pwa-prompt-dismissed') === 'true',
  });

  useEffect(() => {
    // 1. Detect if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setState(prev => ({ ...prev, isInstalled: true }));
      return;
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Check if it's an iOS device that isn't installed yet
    if (isIOSDevice && !isIOSStandalone) {
      setState(prev => ({ ...prev, isIOS: true, isInstallable: true }));
    }

    // 3. Listen for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: e,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
      // Clear deferredPrompt so it can be garbage collected
      console.log('PWA was installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (state.deferredPrompt) {
      // Show the install prompt
      state.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await state.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      setState(prev => ({ ...prev, deferredPrompt: null }));
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    setState(prev => ({ ...prev, hasDismissed: true }));
  };

  const shouldShowPrompt = state.isInstallable && !state.isInstalled && !state.hasDismissed;

  return {
    ...state,
    shouldShowPrompt,
    promptInstall,
    dismissPrompt
  };
}
