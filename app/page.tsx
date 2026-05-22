import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-editorial-white text-editorial-black overflow-hidden relative selection:bg-black selection:text-white">
      {/* Empty space */}
      
      <div className="relative z-10 flex flex-col justify-between items-center w-full max-w-md mx-auto h-full min-h-[60vh] border border-black p-8 bg-white/80 backdrop-blur-sm">
        
        <div className="flex w-full justify-between items-start mb-12">
           <div className="w-12 h-12 border border-black flex items-center justify-center bg-black text-white font-mono text-xs font-bold">
             N/Y
           </div>
           <div className="border border-black px-3 py-1 font-sans font-bold text-[10px] uppercase tracking-widest bg-gray-100">
             V_1.0.4
           </div>
        </div>
        
        <div className="text-center w-full mb-16">
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tighter mb-6 uppercase leading-none">
            NearYou<span className="text-accent-green">.</span>
          </h1>
          <p className="text-editorial-grey font-mono text-xs uppercase tracking-widest leading-relaxed border-y border-black py-4">
            Total transparency.<br/>
            Bi-directional synchronization.<br/>
            No secrets.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <a 
            href="https://github.com/Renoo-AI/nearyouu/raw/main/nearyou.apk" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center h-14 bg-black hover:bg-gray-800 text-white font-bold tracking-wider transition-colors text-xs sm:text-sm border border-black uppercase"
          >
            Download nearyou.apk
          </a>
          <p className="text-center text-[10px] uppercase font-mono text-editorial-grey mt-2">
            Use magic links to form deep connections.
          </p>
        </div>
      </div>
    </main>
  );
}
