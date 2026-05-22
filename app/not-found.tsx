import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white font-sans selection:bg-white selection:text-black">
      <div className="text-center w-full max-w-sm">
        <div className="w-full border border-red-500 p-8 flex flex-col items-center">
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest mb-2 text-red-500">404</h1>
          <p className="font-mono text-xs text-editorial-grey uppercase tracking-wider mb-4 leading-relaxed">
            Target Not Found.<br/>
            The requested spatial coordinate is void.
          </p>
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-mono px-3 py-2 uppercase mb-8 w-full">
            ERR_NO_ROUTE<br />
            REQUEST_LOGGED
          </div>
          <Link href="/" className="text-xs uppercase font-mono border-b border-white pb-1 hover:text-editorial-grey transition-colors text-white">
            Access Root
          </Link>
        </div>
      </div>
    </main>
  );
}
