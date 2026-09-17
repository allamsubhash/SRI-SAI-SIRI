'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerGuidelinesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/owner/settings?tab=guidelines');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D1411] flex flex-col items-center justify-center space-y-3 text-slate-200 font-sans">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin text-blue-500" />
      <span className="text-xs font-bold text-slate-400">Redirecting to Hostel Guidelines in Settings...</span>
    </div>
  );
}
