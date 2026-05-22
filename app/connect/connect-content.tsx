'use client';

import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Smartphone, 
  Fingerprint,
  Mic,
  Camera,
  HeartPulse,
  MonitorPlay
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const DATA_LAYERS = [
  { id: 'location', name: 'LIVE LOCATION', icon: MapPin, active: true },
  { id: 'biometrics', name: 'HEART RATE', icon: HeartPulse, active: true },
  { id: 'camera', name: 'RAW CAM FEED', icon: Camera, active: false },
  { id: 'mic', name: 'AMBIENT MIC', icon: Mic, active: false },
  { id: 'device', name: 'DEVICE METRICS', icon: Smartphone, active: true },
  { id: 'screen', name: 'SCREEN MIRROR', icon: MonitorPlay, active: false },
];

export default function ConnectContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');
  const token = searchParams.get('token');
  
  // Anti-XSS and injection sanitization
  const safeId = (userId || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 32);
  
  const [appState, setAppState] = useState<'decrypting' | 'viewing' | 'connecting' | 'accepted' | 'declined' | 'invalid'>('decrypting');
  const [time, setTime] = useState<string>('00:00:00');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].split('.')[0]); // Gives HH:MM:SS
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Logic to simulate invalid or missing token (anti-spam/fake links)
  useEffect(() => {
    // Basic rate limit simulation using localStorage
    const attempts = parseInt(localStorage.getItem('connection_attempts') || '0');
    if (attempts > 5) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppState('invalid');
      return;
    }

    if (appState === 'decrypting') {
      const timer = setTimeout(() => {
        if (!userId || !token || token.length < 10) {
          setAppState('invalid');
          localStorage.setItem('connection_attempts', (attempts + 1).toString());
        } else {
          setAppState('viewing');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [appState, userId, token]);

  const handleAccept = () => {
    // Forward all search parameters (e.g., cryptographic tokens, signatures) to prevent CSRF vulnerabilities
    const queryStr = searchParams.toString();
    const query = queryStr ? `?${queryStr}` : `?user=${userId || ''}`;
    window.location.href = `nearyou://connect/accept${query}`;
    
    setAppState('connecting');
    setTimeout(() => {
      setAppState('accepted');
    }, 2000);
  };

  const handleDecline = () => {
    setAppState('declined');
  };

  if (appState === 'decrypting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#121212] text-[#F7F7F7] p-6 font-mono selection:bg-[#F7F7F7] selection:text-[#121212]">
        <div className="flex items-center gap-1">
           <span className="text-sm tracking-widest uppercase">Decrypting magic link...</span>
           <motion.span 
             animate={{ opacity: [1, 0] }} 
             transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
             className="w-2.5 h-4 bg-[#F7F7F7] inline-block" 
           />
        </div>
      </main>
    );
  }

  if (appState === 'accepted') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-accent-green text-black selection:bg-black selection:text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 border-4 border-black rounded-full flex items-center justify-center mb-8">
            <div className="w-6 h-6 bg-black animate-pulse" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight uppercase leading-none mb-4">Connection<br/>Active</h1>
          <p className="font-mono text-sm tracking-wider uppercase mb-12">
            Secure stream established.
          </p>
          
          <button 
             onClick={() => setAppState('viewing')}
             className="w-full py-4 border border-black text-black font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          >
            Review Session
          </button>
        </motion.div>
      </main>
    );
  }

  if (appState === 'declined') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-editorial-white text-editorial-black font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-sm"
        >
          <div className="w-full border border-black p-8 flex flex-col items-center">
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest mb-2">Request Denied</h1>
            <p className="font-mono text-xs text-editorial-grey uppercase tracking-wider mb-8">Connection severed.</p>
            <button 
               onClick={() => setAppState('viewing')}
               className="text-xs uppercase font-mono border-b border-black pb-1 hover:text-editorial-grey transition-colors"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  if (appState === 'invalid') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white font-sans selection:bg-white selection:text-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-sm"
        >
          <div className="w-full border border-red-500 p-8 flex flex-col items-center">
            <h1 className="text-3xl font-display font-bold uppercase tracking-widest mb-2 text-red-500">404 / 403</h1>
            <p className="font-mono text-xs text-editorial-grey uppercase tracking-wider mb-4 leading-relaxed">
              Invalid or corrupted magic link.<br/>
              Signature validation failed.
            </p>
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-mono px-3 py-2 uppercase mb-8 w-full">
              ERR_MALFORMED_TOKEN<br />
              RATE_LIMIT_STRICT<br />
              IP_LOGGED
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-editorial-white text-editorial-black relative selection:bg-black selection:text-white">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-editorial-white border-b border-black">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-md mx-auto w-full">
          <span className="font-display font-bold text-lg tracking-tight">NearYou.</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-accent-green opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 bg-accent-green"></span>
            </span>
            <span className="font-mono text-xs tracking-widest text-editorial-grey">CONNECTION - {time}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 pt-8 pb-48">
        
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="block font-mono text-xs tracking-widest text-editorial-grey uppercase mb-4">Incoming Request</span>
          <h1 className="font-display text-4xl font-bold uppercase leading-[1.1] mb-6 tracking-tight">
            A peer has initiated a deep connection.
          </h1>
          
          <div className="flex items-center gap-5 bg-white border border-black p-5">
            <div className="relative w-24 h-24 shrink-0 border-2 border-black bg-gray-200">
               <Image 
                 src={`https://picsum.photos/seed/${safeId}/200/200`}
                 alt="User Profile"
                 fill
                 className="object-cover grayscale contrast-125"
                 referrerPolicy="no-referrer"
                 unoptimized
               />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl leading-none uppercase mb-2">{safeId.substring(0, 12)}</span>
              <span className="font-mono font-bold text-[10px] tracking-widest text-[#00FF41] uppercase bg-black px-2 py-1 inline-block w-max mb-1">Live Request</span>
              <span className="font-sans text-[10px] tracking-widest text-editorial-grey uppercase">Verified Peer</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="border-t border-black py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-sm font-bold tracking-widest uppercase">Data Layers Requested</h2>
              <span className="border border-black px-3 py-1 rounded-full font-mono text-[10px] uppercase">Encrypted Route</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {DATA_LAYERS.map((layer, idx) => (
                <div 
                  key={layer.id}
                  className={`flex flex-col justify-between p-4 border border-black h-32 transition-colors duration-200 cursor-default ${layer.active ? 'bg-white' : 'bg-gray-50 text-editorial-grey'}`}
                >
                  <div className="flex items-start justify-between">
                    <layer.icon className={`w-5 h-5 ${layer.active ? 'text-black' : 'text-editorial-grey/50'}`} strokeWidth={1.5} />
                    {layer.active && (
                       <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs tracking-wider uppercase">{layer.name}</span>
                    <span className="font-mono text-[9px] uppercase mt-1 opacity-70">
                      {layer.active ? 'Active Stream' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-editorial-white/80 backdrop-blur-md border-t border-black">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <button 
            onClick={appState === 'connecting' ? undefined : handleAccept}
            disabled={appState === 'connecting'}
            className="w-full bg-black text-white h-16 uppercase font-bold tracking-widest hover:bg-gray-900 transition-colors flex items-center justify-center text-sm disabled:opacity-50"
          >
            {appState === 'connecting' ? (
               <div className="flex items-center gap-3 font-sans font-bold text-xs">
                 <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                 <span>AUTHORIZING...</span>
               </div>
            ) : (
               "Authorize & Connect"
            )}
          </button>
          
          {!appState.includes('connecting') && (
            <div className="pt-3 text-center">
              <button 
                onClick={handleDecline}
                className="text-xs uppercase font-bold font-mono text-editorial-grey hover:text-black transition-colors"
              >
                Reject Connection
              </button>
            </div>
          )}

          <div className="pt-2 text-center">
            <a href="https://github.com/Renoo-AI/nearyouu/raw/main/nearyou.apk" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-mono text-editorial-grey underline hover:text-black transition-colors">
              App not installed? Download nearyou.apk
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
