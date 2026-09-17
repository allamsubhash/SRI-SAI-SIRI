'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Users, Bed, Phone, Mail, ShieldCheck } from 'lucide-react';

export default function TenantRoommatesPage() {
  const [roommates, setRoommates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenants/roommates')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.roommates)) {
          setRoommates(data.roommates);
        } else if (Array.isArray(data)) {
          setRoommates(data);
        }
      })
      .catch(err => console.error('Failed to load roommates:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            My Roommates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Residents sharing your assigned room (financial & personal data privacy protected)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading roommates...</div>
      ) : roommates.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Bed className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No Roommates Assigned</h3>
          <p className="text-xs text-slate-500 mt-1">You are currently the sole resident in this room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roommates.map((rm) => (
            <div
              key={rm.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg">
                {rm.name ? rm.name.charAt(0) : 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white text-base truncate">
                  {rm.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" />
                    Bed {rm.bedNumber || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {rm.phone || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase">
                Active
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
