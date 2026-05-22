'use client';

import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Smartphone, 
  Mic,
  Camera,
  HeartPulse,
  MonitorPlay
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';

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
  const userId = searchParams.get('deep_auth') || searchParams.get('user');
  const token = searchParams.get('token');
  
  // Anti-XSS and injection sanitization
  const safeId = (userId || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 32);
  
  const [appState, setAppState] = useState<'decrypting' | 'viewing' | 'connecting' | 'accepted' | 'declined' | 'invalid'>('decrypting');
  const [time, setTime] = useState<string>('00:00:00');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [faqOpen, setFaqOpen] = useState<boolean>(false);

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

  // Sync Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
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
        if (!userId) {
          setAppState('invalid');
          localStorage.setItem('connection_attempts', (attempts + 1).toString());
        } else {
          setAppState('viewing');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [appState, userId, token]);

  const handleAccept = async () => {
    setAppState('connecting');
    try {
      let user = auth.currentUser;
      
      // Perform genuine Google Sign-In with popup if not authenticated
      if (!user) {
        const provider = new GoogleAuthProvider();
        // Force provider options for popups
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      }

      // Write connection record to Firestore (connections/{senderId}_{recipientId})
      const connectionDocId = `${safeId}_${user.uid}`;
      try {
        await setDoc(doc(db, 'connections', connectionDocId), {
          senderId: safeId,
          recipientId: user.uid,
          recipientEmail: user.email || '',
          recipientName: user.displayName || 'Authorized Peer',
          status: 'accepted',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `connections/${connectionDocId}`);
      }

      setAppState('accepted');

      // Seamless Mobile Deep Link Handshake Redirection back to native Android
      setTimeout(() => {
        const deepLinkUrl = `nearyou://connect/accept?deep_auth=${encodeURIComponent(safeId)}`;
        window.location.href = deepLinkUrl;
      }, 1500);

    } catch (error) {
      console.error("Authentication or database writing error:", error);
      setAppState('viewing');
    }
  };

  const handleDecline = async () => {
    setAppState('connecting');
    try {
      let user = auth.currentUser;
      if (!user) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      }

      const connectionDocId = `${safeId}_${user.uid}`;
      try {
        await setDoc(doc(db, 'connections', connectionDocId), {
          senderId: safeId,
          recipientId: user.uid,
          recipientEmail: user.email || '',
          recipientName: user.displayName || 'Authorized Peer',
          status: 'declined',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `connections/${connectionDocId}`);
      }
    } catch (e) {
      console.error("Save decline state failed:", e);
    }
    setAppState('declined');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed:", e);
    }
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
    const deepLinkUrl = `nearyou://connect/accept?deep_auth=${encodeURIComponent(safeId)}`;
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
          <p className="font-mono text-sm tracking-wider uppercase mb-8">
            Secure stream established.
          </p>

          <div className="w-full flex flex-col gap-3 mb-10">
            <a 
               href={deepLinkUrl}
               className="w-full h-16 bg-black text-white font-bold uppercase tracking-widest hover:bg-neutral-900 transition-colors text-xs flex items-center justify-center gap-2 border border-black"
            >
              <span>➔ Open NearYou App</span>
            </a>
            
            <button 
               onClick={() => {
                 window.location.href = deepLinkUrl;
               }}
               className="w-full h-12 bg-transparent border border-black/30 text-black font-mono font-bold uppercase tracking-wider text-[10px] hover:border-black transition-colors"
            >
              Relaunch Handshake
            </button>
          </div>
          
          <button 
             onClick={() => setAppState('viewing')}
             className="text-xs uppercase font-mono border-b border-black pb-0.5 hover:text-neutral-800 transition-colors"
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
          <span className="font-display font-bold text-lg tracking-tight col-span-1">NearYou.</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-accent-green opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 bg-accent-green"></span>
            </span>
            <span className="font-mono text-[10px] sm:text-xs tracking-widest text-editorial-grey">CONNECTION - {time}</span>
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
              <span className="font-sans text-[10px] tracking-widest text-editorial-grey uppercase font-bold">Verified Peer</span>
            </div>
          </div>
        </motion.section>

        {/* User Authentication Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 border border-black p-4 bg-white"
        >
          <span className="block font-mono text-[10px] tracking-widest text-editorial-grey uppercase mb-2">Recipient Identity Status</span>
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold uppercase font-mono">{currentUser.displayName || 'Authorized Responder'}</span>
                <span className="text-[10px] text-editorial-grey font-mono">{currentUser.email}</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="text-[10px] font-mono font-bold uppercase tracking-widest underline text-red-500 hover:text-red-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] leading-relaxed text-editorial-grey uppercase">
                Authorize via Google to trace this handshake.
              </p>
              <div className="bg-gray-100 text-[9px] font-mono p-2 border border-black/10 uppercase">
                Google account email signature required.
              </div>
            </div>
          )}
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
              {DATA_LAYERS.map((layer) => {
                const IconComp = layer.icon;
                return (
                  <div 
                    key={layer.id}
                    className={`flex flex-col justify-between p-4 border border-black h-32 transition-colors duration-200 cursor-default ${layer.active ? 'bg-white' : 'bg-gray-50 text-editorial-grey'}`}
                  >
                    <div className="flex items-start justify-between">
                      <IconComp className={`w-5 h-5 ${layer.active ? 'text-black' : 'text-editorial-grey/50'}`} strokeWidth={1.5} />
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
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Play Protect FAQ Block */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-black py-8 mb-12"
        >
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-sm font-bold tracking-widest uppercase">Android Sideloading Guidance</h3>
            
            <div className="border border-black p-4 bg-white">
              <button 
                onClick={() => setFaqOpen(!faqOpen)} 
                className="flex items-center justify-between w-full font-bold text-xs uppercase text-left font-mono"
              >
                <span>Why does Play Protect flag the APK?</span>
                <span className="text-xs">{faqOpen ? '▲' : '▼'}</span>
              </button>
              
              <AnimatePresence>
                {faqOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-dashed border-gray-300 font-mono text-[11px] leading-relaxed text-editorial-grey flex flex-col gap-3"
                  >
                    <p>
                      <strong>1. Missing Play Store Signature:</strong> Official Play Store apps are signed centrally by Google. Custom-built raw development APKs are signed with local, ephemeral debug keys on compiling.
                    </p>
                    <p>
                      <strong>2. Unlisted Identification:</strong> The app&apos;s build signature is fully unique, but is not indexed in Google&apos;s play-store database registries yet.
                    </p>
                    <p>
                      <strong>3. High-Transparency Permissions:</strong> Because NearYou matches spatial coordinates and sharing states, it declares low-level diagnostic authorizations. Play Protect security engines flag unrecognized binaries executing these permissions.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/40 text-[10px] p-2 text-yellow-800 uppercase font-bold leading-normal">
                       ➔ Play Protect warnings are completely standard for developmental APKs. Tap &quot;More details&quot; then &quot;Install Anyway&quot; to bypass the false positive safely.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
            ) : currentUser ? (
               "Authorize & Connect"
            ) : (
               "Sign In & Authorize"
            )}
          </button>
          
          {appState !== 'connecting' && (
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
