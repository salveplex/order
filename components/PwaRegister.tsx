'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.error('ServiceWorker registration failed: ', err);
        });
      });
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    } else if (isIOS && !isInstalled) {
      alert("Trykk på dele-ikonet nederst på skjermen og velg 'Legg til på hjemskjerm' for å installere.");
    }
  };

  if (isInstalled) {
    return (
      <div className="fixed top-4 right-4 z-50 pointer-events-none opacity-50">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 text-slate-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          <span>App installert</span>
        </div>
      </div>
    );
  }

  if (showPrompt || (isIOS && !isInstalled)) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={handleInstallClick}
          className="bg-amber-500/90 hover:bg-amber-500 backdrop-blur-sm text-slate-900 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Installer App</span>
        </button>
      </div>
    );
  }

  return null;
}
