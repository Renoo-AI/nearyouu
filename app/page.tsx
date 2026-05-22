import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-editorial-white text-editorial-black overflow-hidden relative selection:bg-black selection:text-white">
      {/* Empty space */}
      
      <div className="relative z-10 flex flex-col justify-between items-center w-full max-w-md mx-auto h-full min-h-[60vh] border border-black p-8 bg-white/80 backdrop-blur-sm">
        
        <div className="flex w-full justify-center items-start mb-12">
            <div className="relative w-24 h-24 border-2 border-black bg-gray-200 rounded-full overflow-hidden">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
                 src="https://picsum.photos/seed/Friend_Name/200/200"
                 alt="Friend Profile"
                 className="object-cover w-full h-full grayscale"
               />
            </div>
        </div>
        
        <div className="text-center w-full mb-16">
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tighter mb-6 uppercase leading-none">
            NearYou<span className="text-accent-green">.</span>
          </h1>
        </div>

        <Link 
          href="/connect?user=Friend_Name&token=sec_abc123_cryptographic_signature" 
          className="w-full flex items-center justify-center h-14 bg-black hover:bg-gray-800 text-white font-bold tracking-wide transition-colors mb-4 text-xs sm:text-sm border border-[#0d0101]"
        >
          Accept friend request +Friend_Name
        </Link>
      </div>
    </main>
  );
}
