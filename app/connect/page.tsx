'use client';

import { Suspense } from 'react';
import ConnectContent from './connect-content';

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-editorial-grey">Loading connection data...</div>}>
      <ConnectContent />
    </Suspense>
  );
}
