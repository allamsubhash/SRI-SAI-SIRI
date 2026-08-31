'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/owner/buildings');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-400">
      <span>Loading Buildings & Rooms...</span>
    </div>
  );
}
