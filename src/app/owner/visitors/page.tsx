'use client';

import React, { useState, useEffect } from 'react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { 
  UserCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  Clock, 
  User, 
  Phone, 
  Building, 
  Key, 
  ShieldCheck,
  AlertCircle,
  Filter,
  Printer,
  Share2,
  Calendar,
  Eye
} from 'lucide-react';

export default function OwnerVisitorsPage() {
  const { showToast } = useToast();

  const [visitors, setVisitors] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKOUT'>('ALL');

  // Selected Visitor Popup Modal State
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);

  // New Visitor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [personVisiting, setPersonVisiting] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const visRes = await fetch('/api/visitors');
      if (visRes.ok) {
        const visData = await visRes.json();
        if (Array.isArray(visData) && visData.length > 0) {
          setVisitors(visData);
        } else {
          setVisitors([
            {
              id: 'v-101',
              name: 'Karan Malhotra',
              phone: '+91 98112 33445',
              personVisiting: 'Subhash Allam',
              roomNumber: 'A-101',
              checkIn: new Date().toISOString().replace('T', ' ').slice(0, 16),
              checkOut: null,
              approvalStatus: 'APPROVED'
            },
            {
              id: 'v-102',
              name: 'Suresh Kumar',
              phone: '+91 98223 44556',
              personVisiting: 'Rahul Verma',
              roomNumber: 'B-201',
              checkIn: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 16),
              checkOut: new Date().toISOString().replace('T', ' ').slice(0, 16),
              approvalStatus: 'APPROVED'
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load visitor data:', err);
      showToast('Error', 'Failed to load gate pass records', 'danger');
    } finally {
      setLoading(false);
    }

    // Fetch tenant list asynchronously in the background for modal selection
    fetch('/api/tenants')
      .then(res => res.json())
      .then(tenData => {
        if (Array.isArray(tenData)) setTenants(tenData);
      })
      .catch(err => console.error('Background tenant fetch error:', err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action handlers
  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'CHECKOUT') => {
    try {
      // Optimistic Update
      setVisitors(prev => prev.map(v => {
        if (v.id === id) {
          if (status === 'CHECKOUT') {
            return { ...v, checkOut: new Date().toISOString().replace('T', ' ').slice(0, 16) };
          }
          return { ...v, approvalStatus: status };
        }
        return v;
      }));

      // Update selected popup visitor if open
      if (selectedVisitor && selectedVisitor.id === id) {
        setSelectedVisitor((prev: any) => ({
          ...prev,
          approvalStatus: status === 'CHECKOUT' ? prev.approvalStatus : status,
          checkOut: status === 'CHECKOUT' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : prev.checkOut
        }));
      }

      const res = await fetch('/api/visitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        const statusText = status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Checked Out';
        showToast('Status Updated', `Gate Pass request ${statusText} successfully`, 'success');
        fetchData();
      } else {
        showToast('Update Failed', 'Failed to update status', 'danger');
        fetchData();
      }
    } catch (err) {
      showToast('Error', 'Error processing request', 'danger');
      fetchData();
    }
  };

  // Add Gate Pass Submission
  const handleCreateGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone || !personVisiting || !checkInTime) {
      showToast('Validation Error', 'Please fill in all required visitor fields', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId || 't-1',
          name: visitorName,
          phone: visitorPhone,
          personVisiting,
          checkIn: checkInTime
        })
      });

      if (res.ok) {
        showToast('Success', 'New Gate Pass pre-approval created!', 'success');
        setShowAddModal(false);
        setVisitorName('');
        setVisitorPhone('');
        setPersonVisiting('');
        setCheckInTime('');
        fetchData();
      } else {
        showToast('Error', 'Failed to create gate pass', 'danger');
      }
    } catch (err) {
      showToast('Error', 'Error creating gate pass', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper map tenant ID to tenant details
  const getTenantInfo = (tenantId: string, personVisitingName?: string) => {
    const found = tenants.find(t => t.id === tenantId || t.name === personVisitingName);
    if (found) {
      return {
        name: found.name,
        room: `Room ${found.roomNumber || found.room || '101'}`,
        building: found.buildingName || 'Main Block'
      };
    }
    return {
      name: personVisitingName || 'Resident',
      room: 'Room 204',
      building: 'Main Block'
    };
  };

  // Filter logic
  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.personVisiting.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return v.approvalStatus === 'PENDING';
    if (statusFilter === 'APPROVED') return v.approvalStatus === 'APPROVED' && !v.checkOut;
    if (statusFilter === 'REJECTED') return v.approvalStatus === 'REJECTED';
    if (statusFilter === 'CHECKOUT') return !!v.checkOut;

    return true;
  });

  // Metrics
  const pendingCount = visitors.filter(v => v.approvalStatus === 'PENDING').length;
  const activeInsideCount = visitors.filter(v => v.approvalStatus === 'APPROVED' && !v.checkOut).length;
  const checkedOutCount = visitors.filter(v => !!v.checkOut).length;

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DDD8CE] dark:border-[#293832] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            Gate Passes & Visitor Roster
          </h1>
          <p className="text-xs font-bold text-[#677771] dark:text-[#A3B3AC] mt-1">
            Manage resident visitor pre-approvals, main gate entries, and checkouts. Click any row for details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#2563EB] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs hover:scale-105 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Gate Pass</span>
        </button>
      </div>

      {/* METRIC SUMMARY CARDS (Clickable Filter Shortcuts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-xs flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#677771] dark:text-[#A3B3AC] uppercase tracking-wider block">
              Total Visitor Passes
            </span>
            <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {visitors.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-black">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-xs flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Pre-Approvals
            </span>
            <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {pendingCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('APPROVED')}
          className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-xs flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Currently Inside Campus
            </span>
            <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {activeInsideCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('CHECKOUT')}
          className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-xs flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#677771] dark:text-[#A3B3AC] uppercase tracking-wider block">
              Logged Checkouts
            </span>
            <span className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2]">
              {checkedOutCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-black">
            <LogOut className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* CONTROLS: SEARCH & FILTERS */}
      <div className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* SEARCH FIELD */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#677771] dark:text-[#A3B3AC]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visitor, resident or phone..."
              className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* STATUS FILTER CHIPS */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Passes' },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'APPROVED', label: 'Approved & Inside' },
              { id: 'CHECKOUT', label: 'Checked Out' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#2563EB] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* GATE PASS ROSTER LIST */}
      <div className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-xs space-y-4">
        <h3 className="text-base font-black text-[#1C2522] dark:text-[#F2F5F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>Active & Historical Visitor Gate Passes</span>
          </div>
          <span className="text-xs font-bold text-[#677771] dark:text-[#A3B3AC] italic">
            💡 Click any row to view full pass details popup
          </span>
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[#677771] dark:text-[#A3B3AC] space-y-2">
            <span className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin inline-block" />
            <p>Loading gate pass records...</p>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[#677771] dark:text-[#A3B3AC] space-y-2">
            <AlertCircle className="w-8 h-8 text-[#677771] dark:text-[#A3B3AC] mx-auto opacity-50" />
            <p>No visitor passes match the selected search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DDD8CE] dark:border-[#293832] text-[#677771] dark:text-[#A3B3AC] font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Visitor Info</th>
                  <th className="py-3 px-4">Resident & Room</th>
                  <th className="py-3 px-4">Check-in Schedule</th>
                  <th className="py-3 px-4">Checkout Log</th>
                  <th className="py-3 px-4">Gate Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE]/60 dark:divide-[#293832]/60">
                {filteredVisitors.map((vis) => {
                  const tenantInfo = getTenantInfo(vis.tenantId, vis.personVisiting);
                  const isCheckedOut = !!vis.checkOut;
                  const isApproved = vis.approvalStatus === 'APPROVED';
                  const isPending = vis.approvalStatus === 'PENDING';
                  const isRejected = vis.approvalStatus === 'REJECTED';

                  return (
                    <tr 
                      key={vis.id} 
                      onClick={() => setSelectedVisitor(vis)}
                      className="hover:bg-[#F1EEE7]/80 dark:hover:bg-[#1A2621]/80 transition-colors cursor-pointer group"
                    >
                      
                      {/* Visitor Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-[#1C2522] dark:text-[#F2F5F2] flex items-center gap-2 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                          <User className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                          <span>{vis.name}</span>
                        </div>
                        <div className="text-[11px] font-bold text-[#677771] dark:text-[#A3B3AC] flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{vis.phone}</span>
                        </div>
                      </td>

                      {/* Resident & Room */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-[#1C2522] dark:text-[#F2F5F2]">
                          {vis.personVisiting}
                        </div>
                        <div className="text-[10px] font-bold text-[#2563EB] dark:text-[#60A5FA]">
                          {tenantInfo.room} • {tenantInfo.building}
                        </div>
                      </td>

                      {/* Check-in Schedule */}
                      <td className="py-3.5 px-4 text-[#677771] dark:text-[#A3B3AC] font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{vis.checkIn}</span>
                        </div>
                      </td>

                      {/* Checkout Log */}
                      <td className="py-3.5 px-4 font-bold">
                        {isCheckedOut ? (
                          <span className="text-slate-600 dark:text-zinc-400 text-[11px]">
                            {vis.checkOut}
                          </span>
                        ) : isApproved ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Inside Campus
                          </span>
                        ) : (
                          <span className="text-[#677771] dark:text-[#A3B3AC] text-[11px] italic">Not Entered</span>
                        )}
                      </td>

                      {/* Gate Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-black text-[10px]">
                            ⏳ Pending Pre-Approval
                          </span>
                        )}
                        {isApproved && !isCheckedOut && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-black text-[10px]">
                            ✓ Gate Pass Approved
                          </span>
                        )}
                        {isCheckedOut && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-700 dark:text-zinc-400 font-black text-[10px]">
                            🚪 Checked Out
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-black text-[10px]">
                            ✕ Access Denied
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(vis.id, 'APPROVED')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[11px] hover:scale-105 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(vis.id, 'REJECTED')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-[11px] hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && !isCheckedOut && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(vis.id, 'CHECKOUT')}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-black text-[11px] hover:scale-105 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Checkout</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedVisitor(vis)}
                            className="p-1.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#2563EB] hover:text-white transition-all cursor-pointer"
                            title="View Full Gate Pass Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📌 VISITOR GATE PASS DETAILS POPUP MODAL */}
      {selectedVisitor && (
        <NeonModal
          isOpen={!!selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
          title="Main Gate Visitor Pass Token"
        >
          <div className="space-y-6 text-left">
            
            {/* PASS TOKEN BANNER */}
            <div className="p-4 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider block">
                  Gate Token ID
                </span>
                <span className="text-base font-black text-[#1C2522] dark:text-[#F2F5F2]">
                  {selectedVisitor.id.toUpperCase()}
                </span>
              </div>
              <div>
                {selectedVisitor.approvalStatus === 'PENDING' && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-black text-xs">
                    ⏳ PENDING APPROVAL
                  </span>
                )}
                {selectedVisitor.approvalStatus === 'APPROVED' && !selectedVisitor.checkOut && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-black text-xs">
                    ✓ ACTIVE INSIDE CAMPUS
                  </span>
                )}
                {selectedVisitor.checkOut && (
                  <span className="px-3 py-1 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-700 dark:text-zinc-400 font-black text-xs">
                    🚪 CHECKED OUT
                  </span>
                )}
                {selectedVisitor.approvalStatus === 'REJECTED' && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-black text-xs">
                    ✕ ACCESS DENIED
                  </span>
                )}
              </div>
            </div>

            {/* VISITOR & RESIDENT DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4">
              {/* Visitor Details */}
              <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2">
                <span className="text-[10px] font-black text-[#677771] dark:text-[#A3B3AC] uppercase tracking-wider block">
                  Visitor Details
                </span>
                <div className="flex items-center gap-2 font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">
                  <User className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>{selectedVisitor.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#677771] dark:text-[#A3B3AC]">
                  <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{selectedVisitor.phone}</span>
                </div>
              </div>

              {/* Host Resident Details */}
              <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2">
                <span className="text-[10px] font-black text-[#677771] dark:text-[#A3B3AC] uppercase tracking-wider block">
                  Host Resident & Room
                </span>
                <div className="font-black text-sm text-[#1C2522] dark:text-[#F2F5F2]">
                  {selectedVisitor.personVisiting}
                </div>
                <div className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                  {getTenantInfo(selectedVisitor.tenantId, selectedVisitor.personVisiting).room} • {getTenantInfo(selectedVisitor.tenantId, selectedVisitor.personVisiting).building}
                </div>
              </div>
            </div>

            {/* TIMESTAMPS */}
            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-2 text-xs font-bold">
              <div className="flex justify-between items-center">
                <span className="text-[#677771] dark:text-[#A3B3AC] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                  <span>Scheduled Check-in:</span>
                </span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2] font-black">{selectedVisitor.checkIn}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#DDD8CE]/60 dark:border-[#293832]/60">
                <span className="text-[#677771] dark:text-[#A3B3AC] flex items-center gap-1.5">
                  <LogOut className="w-4 h-4 text-[#2563EB]" />
                  <span>Recorded Checkout:</span>
                </span>
                <span className="text-[#1C2522] dark:text-[#F2F5F2] font-black">
                  {selectedVisitor.checkOut || 'Not Checked Out'}
                </span>
              </div>
            </div>

            {/* POPUP ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {selectedVisitor.approvalStatus === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedVisitor.id, 'APPROVED')}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Gate Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedVisitor.id, 'REJECTED')}
                    className="flex-1 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Deny Access</span>
                  </button>
                </>
              )}

              {selectedVisitor.approvalStatus === 'APPROVED' && !selectedVisitor.checkOut && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedVisitor.id, 'CHECKOUT')}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Gate Checkout</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => showToast('Gate Pass Token', `Pass ID ${selectedVisitor.id} copied`, 'info')}
                className="py-3 px-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] font-black text-xs text-[#1C2522] dark:text-[#F2F5F2] hover:bg-[#2563EB] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Token</span>
              </button>
            </div>

          </div>
        </NeonModal>
      )}

      {/* NEW GATE PASS MODAL */}
      <NeonModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Main Gate Visitor Pass"
      >
        <form onSubmit={handleCreateGatePass} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-[#1C2522] dark:text-[#F2F5F2]">Select Resident</label>
            <select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                const found = tenants.find(t => t.id === e.target.value);
                if (found) setPersonVisiting(found.name);
              }}
              className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl px-4 py-3 text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
            >
              <option value="">Select Host Resident</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (Room {t.roomNumber || t.room || '101'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-[#1C2522] dark:text-[#F2F5F2]">Resident Name</label>
            <input
              type="text"
              required
              value={personVisiting}
              onChange={(e) => setPersonVisiting(e.target.value)}
              placeholder="Rohan Verma"
              className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl px-4 py-3 text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-[#1C2522] dark:text-[#F2F5F2]">Visitor Name</label>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Guest Name"
                className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl px-4 py-3 text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-[#1C2522] dark:text-[#F2F5F2]">Visitor Phone</label>
              <input
                type="text"
                required
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="+91 99887 76655"
                className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl px-4 py-3 text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-[#1C2522] dark:text-[#F2F5F2]">Check-in Date & Time</label>
            <input
              type="datetime-local"
              required
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] rounded-2xl px-4 py-3 text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-xs font-bold text-[#677771] dark:text-[#A3B3AC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-2xl bg-[#2563EB] text-white text-xs font-black cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Generating...' : 'Issue Gate Pass'}
            </button>
          </div>
        </form>
      </NeonModal>

    </div>
  );
}
