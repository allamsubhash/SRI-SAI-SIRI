'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Building, 
  Bed, 
  CreditCard, 
  Receipt, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  LogOut, 
  Eye, 
  DollarSign, 
  X, 
  ShieldCheck,
  ChevronRight,
  Phone,
  FileText
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import OfficialPaymentReceiptModal, { OfficialReceiptData } from '@/components/OfficialPaymentReceiptModal';
import { formatDate, formatDateTime, formatINR } from '@/utils/formatters';

interface ShortStayGuest {
  id: string;
  name: string;
  phone: string;
  buildingId?: string;
  buildingName?: string;
  roomId?: string;
  roomNumber?: string;
  bedId?: string;
  bedNumber?: string;
  checkInDate: string;
  checkInTime?: string;
  expectedCheckOutDate: string;
  expectedCheckOutTime?: string;
  actualCheckOutDate?: string;
  numberOfDays: number;
  dailyRent: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentStatus: string; // 'PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE'
  status: string; // 'ACTIVE', 'CHECKED_OUT'
  notes?: string;
  payments?: any[];
  receipts?: any[];
}

export default function ShortStayManagementPage() {
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<ShortStayGuest[]>([]);
  const [stats, setStats] = useState<any>({});
  const [buildings, setBuildings] = useState<any[]>([]);

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<ShortStayGuest | null>(null);
  const [guestDetailTab, setGuestDetailTab] = useState<'details' | 'payments' | 'receipts' | 'history'>('details');
  const [stayHistory, setStayHistory] = useState<any[]>([]);
  
  // Payment Installment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Check-out Confirmation Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Receipt Modal State
  const [activeReceiptData, setActiveReceiptData] = useState<OfficialReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    buildingId: '',
    buildingName: '',
    roomId: '',
    roomNumber: '',
    bedId: '',
    bedNumber: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkInTime: '12:00 PM',
    expectedCheckOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    expectedCheckOutTime: '11:00 AM',
    numberOfDays: 1,
    dailyRent: 600,
    amountPaid: 600,
    paymentMethod: 'CASH',
    receivedBy: 'Hostel Manager',
    notes: ''
  });
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Fetch Buildings for Registration Select
  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/buildings');
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        setBuildings(Array.isArray(data) ? data : data.buildings || []);
      }
    } catch (e) {
      console.error('Error fetching buildings:', e);
    }
  };

  // Fetch Short Stay Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'ALL') params.append('filter', activeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/short-stay?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setGuests(data.guests || []);
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error('Error fetching short stay guests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeFilter, searchQuery]);

  // Handle Automatic Day Calculation
  const handleDateChange = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)));
    
    setRegForm(prev => {
      const newDays = diffDays;
      const newTotal = newDays * prev.dailyRent;
      return {
        ...prev,
        checkInDate: checkIn,
        expectedCheckOutDate: checkOut,
        numberOfDays: newDays,
        amountPaid: newTotal
      };
    });
  };

  // Handle Short Stay Registration Submission
  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regSubmitting) return;
    setRegSubmitting(true);

    try {
      const res = await fetch('/api/short-stay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();

      if (data.success) {
        setShowRegModal(false);
        fetchData();
        // Automatically open receipt if payment made
        if (data.guest && data.guest.receipts && data.guest.receipts.length > 0) {
          const rec = data.guest.receipts[0];
          openReceiptModal(data.guest, rec);
        }
      } else {
        alert(data.error || 'Failed to register short-stay guest');
      }
    } catch (e: any) {
      alert('Error registering guest: ' + e.message);
    } finally {
      setRegSubmitting(false);
    }
  };

  // Fetch Guest Details & Stay History
  const openGuestDetails = async (guest: ShortStayGuest) => {
    setSelectedGuest(guest);
    setGuestDetailTab('details');
    try {
      const res = await fetch(`/api/short-stay/${guest.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedGuest(data.guest);
        setStayHistory(data.stayHistory || []);
      }
    } catch (e) {
      console.error('Error fetching guest details:', e);
    }
  };

  // Handle Installment Payment Submission
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || paySubmitting) return;
    setPaySubmitting(true);

    try {
      const res = await fetch(`/api/short-stay/${selectedGuest.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod: payMethod,
          receivedBy: 'Hostel Manager',
          notes: payNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        setSelectedGuest(data.guest);
        fetchData();
        // Launch newly generated receipt modal
        if (data.guest.receipts && data.guest.receipts.length > 0) {
          openReceiptModal(data.guest, data.guest.receipts[0]);
        }
      } else {
        alert(data.error || 'Failed to process payment');
      }
    } catch (e: any) {
      alert('Payment Error: ' + e.message);
    } finally {
      setPaySubmitting(false);
    }
  };

  // Handle Guest Check-out Submission
  const handleCheckoutSubmit = async () => {
    if (!selectedGuest || checkoutSubmitting) return;
    setCheckoutSubmitting(true);

    try {
      const res = await fetch(`/api/short-stay/${selectedGuest.id}/checkout`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setShowCheckoutModal(false);
        setSelectedGuest(data.guest);
        fetchData();
        alert('Guest checked out successfully. Room/bed has been released!');
      } else {
        alert(data.error || 'Failed to check out guest');
      }
    } catch (e: any) {
      alert('Checkout error: ' + e.message);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Helper to construct OfficialReceiptData from ShortStayGuest + Receipt
  const openReceiptModal = (guest: ShortStayGuest, receipt: any) => {
    const totalStay = guest.totalAmount;
    const remDue = receipt.remainingBalance !== undefined ? receipt.remainingBalance : guest.balance;

    const receiptObj: OfficialReceiptData = {
      receiptNo: receipt.receiptNumber || `SS-${new Date().getFullYear()}-00001`,
      date: receipt.paymentDate || receipt.createdAt || new Date().toISOString(),
      receiptType: 'SHORT_STAY',
      guestName: guest.name,
      mobileNumber: guest.phone,
      buildingName: guest.buildingName || 'Sri Sai Siri Hostel',
      roomNumber: guest.roomNumber || 'N/A',
      bedNumber: guest.bedNumber || 'N/A',
      checkInDate: guest.checkInDate,
      expectedCheckOutDate: guest.expectedCheckOutDate,
      actualCheckOutDate: guest.actualCheckOutDate,
      numberOfDays: guest.numberOfDays,
      dailyRent: guest.dailyRent,
      totalStayAmount: totalStay,
      totalAmount: receipt.amountPaid || guest.amountPaid,
      previousPaid: guest.amountPaid - (receipt.amountPaid || 0),
      totalPaid: guest.amountPaid,
      remainingDue: remDue,
      paymentMethod: receipt.paymentMethod || 'CASH',
      receivedBy: receipt.receivedBy || 'Hostel Manager',
      paymentStatus: receipt.statusStamp || guest.paymentStatus
    };

    setActiveReceiptData(receiptObj);
    setShowReceiptModal(true);
  };

  // Filter available rooms for registration dropdown
  const selectedBuildingObj = buildings.find(b => b.id === regForm.buildingId);
  const availableRooms: any[] = [];
  if (selectedBuildingObj && selectedBuildingObj.floors) {
    selectedBuildingObj.floors.forEach((f: any) => {
      if (f.rooms) {
        f.rooms.forEach((r: any) => {
          availableRooms.push(r);
        });
      }
    });
  }

  const selectedRoomObj = availableRooms.find(r => r.id === regForm.roomId);
  const availableBeds: any[] = selectedRoomObj && selectedRoomObj.beds 
    ? selectedRoomObj.beds.filter((b: any) => b.isAvailable && !b.tenantId && !b.shortStayGuestId) 
    : [];

  return (
    <div className="space-y-6 text-left font-sans max-w-7xl mx-auto pb-12">
      
      {/* 1. TOP HEADER & NEW REGISTRATION BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFDF9] dark:bg-[#141D19] p-5 sm:p-6 rounded-3xl border border-[#DDD8CE] dark:border-[#293832] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2]">
              Short-Stay Guests Management
            </h1>
          </div>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-1">
            Manage daily stay registrations, installment payments, receipts, and room releases.
          </p>
        </div>

        <button
          onClick={() => {
            fetchBuildings();
            setShowRegModal(true);
          }}
          className="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          NEW SHORT-STAY GUEST
        </button>
      </div>

      {/* 2. DASHBOARD METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">CURRENTLY STAYING</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.currentlyStaying || 0}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Active Guests</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">CHECKOUT TODAY</span>
          <div className="text-2xl font-black text-amber-500">{stats.checkingOutToday || 0}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Due Check-outs</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">UPCOMING GUESTS</span>
          <div className="text-2xl font-black text-purple-500">{stats.upcomingGuests || 0}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Future Bookings</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">PARTIALLY PAID</span>
          <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{stats.partiallyPaid || 0}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Partial Dues</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">PENDING PAYMENTS</span>
          <div className="text-2xl font-black text-rose-500">{stats.pendingPayments || 0}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Zero Paid</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">TOTAL REVENUE</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatINR(stats.totalRevenue || 0)}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Collected</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">OUTSTANDING BALANCE</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">{formatINR(stats.outstandingBalance || 0)}</div>
          <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Remaining Dues</span>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FFFDF9] dark:bg-[#141D19] p-3 rounded-2xl border border-[#DDD8CE] dark:border-[#293832]">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Guests' },
            { id: 'STAYING', label: 'Currently Staying' },
            { id: 'CHECKOUT_TODAY', label: 'Check-out Today' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'PARTIAL', label: 'Partially Paid' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'CHECKED_OUT', label: 'Checked Out' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#68736E] dark:text-[#9BAAA4]" />
          <input
            type="text"
            placeholder="Search by name, phone, room, bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs text-[#1C2522] dark:text-[#F2F5F2] outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. SHORT-STAY GUEST TABLE / LIST */}
      <div className="bg-[#FFFDF9] dark:bg-[#141D19] rounded-3xl border border-[#DDD8CE] dark:border-[#293832] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-[#68736E] dark:text-[#9BAAA4]">
            Loading Short-Stay Guests...
          </div>
        ) : guests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-[#68736E] mx-auto opacity-50" />
            <p className="text-sm font-bold text-[#1C2522] dark:text-[#F2F5F2]">No short-stay guests found</p>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">Click "New Short-Stay Guest" above to add a guest stay.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F1EEE7] dark:bg-[#1A2621] border-b border-[#DDD8CE] dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Guest Name & Contact</th>
                  <th className="py-3 px-4">Stay Location</th>
                  <th className="py-3 px-4">Check-In / Out</th>
                  <th className="py-3 px-4">Rate & Days</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#293832] text-[#1C2522] dark:text-[#F2F5F2] font-medium">
                {guests.map((guest) => {
                  const isCheckedOut = guest.status === 'CHECKED_OUT';
                  return (
                    <tr key={guest.id} className="hover:bg-slate-500/5 transition-colors">
                      {/* Name & Phone */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="text-sm font-black text-blue-600 dark:text-blue-400">{guest.name}</div>
                        <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4] font-mono">{guest.phone}</div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold">{guest.buildingName || 'Main Hostel'}</div>
                        <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">
                          {guest.roomNumber ? `Room ${guest.roomNumber}` : 'N/A'} {guest.bedNumber ? `(Bed ${guest.bedNumber})` : ''}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div>In: <strong className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(guest.checkInDate)}</strong></div>
                        <div>Out: <strong className="text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(guest.expectedCheckOutDate)}</strong></div>
                      </td>

                      {/* Daily Rent */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold">₹{guest.dailyRent} / day</div>
                        <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">{guest.numberOfDays} Days</div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-black font-mono text-sm">
                        {formatINR(guest.totalAmount)}
                      </td>

                      {/* Paid / Balance */}
                      <td className="py-3.5 px-4">
                        <div className="font-black font-mono text-emerald-600 dark:text-emerald-400">Paid: {formatINR(guest.amountPaid)}</div>
                        <div className="text-[11px] font-mono font-bold text-rose-500">Bal: {formatINR(guest.balance)}</div>
                      </td>

                      {/* Payment & Stay Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isCheckedOut ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-black uppercase">
                            Checked Out
                          </span>
                        ) : guest.balance <= 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                            ✓ PAID
                          </span>
                        ) : guest.amountPaid > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase">
                            Partially Paid
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openGuestDetails(guest)}
                            className="py-1.5 px-3 rounded-xl bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all cursor-pointer"
                          >
                            Details →
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

      {/* 5. NEW SHORT-STAY GUEST REGISTRATION MODAL */}
      {showRegModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowRegModal(false)}
          title="New Short-Stay Guest Registration"
          subtitle="Assign available room/bed and calculate stay rent"
          size="lg"
          accentColor="blue"
        >
          <form onSubmit={handleRegSubmit} className="space-y-4 text-left font-sans">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="10-digit mobile number"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
                />
              </div>
            </div>

            {/* Check-in & Expected Check-out Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Check-in Date *</label>
                <input
                  type="date"
                  required
                  value={regForm.checkInDate}
                  onChange={(e) => handleDateChange(e.target.value, regForm.expectedCheckOutDate)}
                  className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Expected Check-out Date *</label>
                <input
                  type="date"
                  required
                  value={regForm.expectedCheckOutDate}
                  onChange={(e) => handleDateChange(regForm.checkInDate, e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
                />
              </div>
            </div>

            {/* Building -> Room -> Bed Selection (Only Available Beds!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
              <div>
                <label className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block mb-1">Building</label>
                <select
                  value={regForm.buildingId}
                  onChange={(e) => {
                    const bObj = buildings.find(b => b.id === e.target.value);
                    setRegForm({
                      ...regForm,
                      buildingId: e.target.value,
                      buildingName: bObj ? bObj.name : '',
                      roomId: '',
                      roomNumber: '',
                      bedId: '',
                      bedNumber: ''
                    });
                  }}
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
                >
                  <option value="">Select Building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block mb-1">Room</label>
                <select
                  value={regForm.roomId}
                  disabled={!regForm.buildingId}
                  onChange={(e) => {
                    const rObj = availableRooms.find(r => r.id === e.target.value);
                    setRegForm({
                      ...regForm,
                      roomId: e.target.value,
                      roomNumber: rObj ? rObj.number : '',
                      bedId: '',
                      bedNumber: ''
                    });
                  }}
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold disabled:opacity-50"
                >
                  <option value="">Select Room</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.number} ({r.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block mb-1">Available Bed</label>
                <select
                  value={regForm.bedId}
                  disabled={!regForm.roomId}
                  onChange={(e) => {
                    const bObj = availableBeds.find(b => b.id === e.target.value);
                    setRegForm({
                      ...regForm,
                      bedId: e.target.value,
                      bedNumber: bObj ? bObj.number : ''
                    });
                  }}
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold disabled:opacity-50"
                >
                  <option value="">Select Bed</option>
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>Bed {b.number}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">Number of Days</span>
                  <input
                    type="number"
                    min="1"
                    value={regForm.numberOfDays}
                    onChange={(e) => {
                      const days = Math.max(1, Number(e.target.value));
                      const newTotal = days * regForm.dailyRent;
                      setRegForm({
                        ...regForm,
                        numberOfDays: days,
                        amountPaid: newTotal
                      });
                    }}
                    className="w-20 p-1.5 mx-auto text-center rounded-xl bg-white dark:bg-[#141D19] border border-blue-500/40 text-sm font-black"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">Daily Rent (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={regForm.dailyRent}
                    onChange={(e) => {
                      const rent = Math.max(0, Number(e.target.value));
                      const newTotal = regForm.numberOfDays * rent;
                      setRegForm({
                        ...regForm,
                        dailyRent: rent,
                        amountPaid: newTotal
                      });
                    }}
                    className="w-24 p-1.5 mx-auto text-center rounded-xl bg-white dark:bg-[#141D19] border border-blue-500/40 text-sm font-black"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">Total Stay Amount</span>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
                    {formatINR(regForm.numberOfDays * regForm.dailyRent)}
                  </div>
                </div>
              </div>

              {/* Amount Paid & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-500/20">
                <div>
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200 block mb-1">Amount Paid Now (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={regForm.numberOfDays * regForm.dailyRent}
                    value={regForm.amountPaid}
                    onChange={(e) => setRegForm({ ...regForm, amountPaid: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#141D19] border border-blue-500/40 text-sm font-black text-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200 block mb-1">Payment Method</label>
                  <select
                    value={regForm.paymentMethod}
                    onChange={(e) => setRegForm({ ...regForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#141D19] border border-blue-500/40 text-xs font-bold"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / ONLINE</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={regSubmitting}
                className="py-2.5 px-6 rounded-2xl bg-blue-600 text-white font-black text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                {regSubmitting ? 'Registering Guest...' : 'CONFIRM & REGISTER GUEST →'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 6. GUEST DETAILS POPUP MODAL (4 TABS + CHECK OUT) */}
      {selectedGuest && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedGuest(null)}
          title={`Short-Stay Guest: ${selectedGuest.name}`}
          subtitle={`Mobile: ${selectedGuest.phone} | Room ${selectedGuest.roomNumber || 'N/A'}`}
          size="lg"
          accentColor="blue"
        >
          <div className="space-y-4 text-left font-sans">
            
            {/* Modal Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#293832] pb-2">
              <div className="flex items-center gap-2">
                {[
                  { id: 'details', label: 'Details', icon: <FileText className="w-3.5 h-3.5" /> },
                  { id: 'payments', label: `Payments (${selectedGuest.payments?.length || 0})`, icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { id: 'receipts', label: `Receipts (${selectedGuest.receipts?.length || 0})`, icon: <Receipt className="w-3.5 h-3.5" /> },
                  { id: 'history', label: `Stay History (${stayHistory.length})`, icon: <History className="w-3.5 h-3.5" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setGuestDetailTab(tab.id as any)}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      guestDetailTab === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4]'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Add Payment & Check Out */}
              {selectedGuest.status === 'ACTIVE' && (
                <div className="flex items-center gap-2">
                  {selectedGuest.balance > 0 && (
                    <button
                      onClick={() => {
                        setPayAmount(selectedGuest.balance);
                        setShowPayModal(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      + Add Payment
                    </button>
                  )}

                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Check Out Guest
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: DETAILS */}
            {guestDetailTab === 'details' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] space-y-0.5">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block">Building</span>
                    <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">{selectedGuest.buildingName || 'Main Hostel'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] space-y-0.5">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block">Room / Bed</span>
                    <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">
                      Room {selectedGuest.roomNumber || 'N/A'} (Bed {selectedGuest.bedNumber || 'N/A'})
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] space-y-0.5">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block">Check-in</span>
                    <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(selectedGuest.checkInDate)}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] space-y-0.5">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block">Expected Check-out</span>
                    <span className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">{formatDate(selectedGuest.expectedCheckOutDate)}</span>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex justify-between items-center font-mono">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase block">Daily Rate & Days</span>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      ₹{selectedGuest.dailyRent} / day × {selectedGuest.numberOfDays} Days
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">Total: {formatINR(selectedGuest.totalAmount)}</div>
                    <div className="text-sm font-black text-emerald-600">Paid: {formatINR(selectedGuest.amountPaid)}</div>
                    <div className="text-sm font-black text-rose-500">Balance: {formatINR(selectedGuest.balance)}</div>
                  </div>
                </div>

                {selectedGuest.notes && (
                  <div className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621]">
                    <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase block mb-1">Notes</span>
                    <p className="text-xs text-[#1C2522] dark:text-[#F2F5F2]">{selectedGuest.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PAYMENTS */}
            {guestDetailTab === 'payments' && (
              <div className="space-y-3">
                {(!selectedGuest.payments || selectedGuest.payments.length === 0) ? (
                  <p className="text-xs text-center py-6 text-[#68736E] dark:text-[#9BAAA4]">No payment records found.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedGuest.payments.map((p: any) => (
                      <div key={p.id} className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold font-mono text-blue-600 dark:text-blue-400">Receipt #{p.receiptNumber}</div>
                          <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">
                            {formatDateTime(p.paymentDate)} via <strong>{p.paymentMethod}</strong>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-black text-emerald-600 text-sm">{formatINR(p.amount)}</div>
                          <span className="text-[10px] text-slate-500">Received by {p.receivedBy || 'Manager'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RECEIPTS */}
            {guestDetailTab === 'receipts' && (
              <div className="space-y-3">
                {(!selectedGuest.receipts || selectedGuest.receipts.length === 0) ? (
                  <p className="text-xs text-center py-6 text-[#68736E] dark:text-[#9BAAA4]">No receipts generated.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedGuest.receipts.map((r: any) => (
                      <div key={r.id} className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] flex justify-between items-center text-xs">
                        <div>
                          <div className="font-black font-mono text-blue-600 dark:text-blue-400">
                            Receipt #{r.receiptNumber}
                          </div>
                          <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">
                            Issued on {formatDate(r.paymentDate)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <div className="font-black text-emerald-600">₹{r.amountPaid}</div>
                            <div className="text-[10px] text-slate-500">Stamp: {r.statusStamp}</div>
                          </div>

                          <button
                            onClick={() => openReceiptModal(selectedGuest, r)}
                            className="py-1.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-xs hover:scale-105 transition-all"
                          >
                            View Receipt →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STAY HISTORY */}
            {guestDetailTab === 'history' && (
              <div className="space-y-3">
                {stayHistory.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#68736E] dark:text-[#9BAAA4]">No previous stay history found for this phone number.</p>
                ) : (
                  <div className="space-y-2">
                    {stayHistory.map((h: any) => (
                      <div key={h.id} className="p-3 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Room {h.roomNumber || 'N/A'} (Bed {h.bedNumber || 'N/A'})</span>
                          <span className="text-emerald-600">{formatINR(h.totalAmount)}</span>
                        </div>
                        <div className="text-[11px] text-[#68736E] dark:text-[#9BAAA4]">
                          {formatDate(h.checkInDate)} → {formatDate(h.expectedCheckOutDate)} ({h.numberOfDays} Days)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </NeonModal>
      )}

      {/* 7. INSTALLMENT PAYMENT MODAL */}
      {showPayModal && selectedGuest && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowPayModal(false)}
          title={`Add Installment Payment for ${selectedGuest.name}`}
          subtitle={`Remaining Balance: ${formatINR(selectedGuest.balance)}`}
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-left font-sans">
            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedGuest.balance}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-sm font-black text-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Payment Method *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI / ONLINE</option>
                <option value="CARD">CARD</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Payment Notes</label>
              <input
                type="text"
                placeholder="Optional notes e.g. Second installment"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paySubmitting}
                className="py-2.5 px-6 rounded-2xl bg-emerald-600 text-white font-black text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                {paySubmitting ? 'Recording Payment...' : 'RECORD PAYMENT & GENERATE RECEIPT →'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 8. CHECK-OUT CONFIRMATION MODAL */}
      {showCheckoutModal && selectedGuest && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowCheckoutModal(false)}
          title={`Confirm Check-out for ${selectedGuest.name}`}
          subtitle="Guest room & bed will be made available for new bookings"
          size="md"
          accentColor="rose"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Total Stay Amount:</span>
                <span className="font-mono">{formatINR(selectedGuest.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Total Paid:</span>
                <span className="font-mono">{formatINR(selectedGuest.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-black text-rose-600 border-t border-rose-500/30 pt-2 text-sm">
                <span>Outstanding Balance:</span>
                <span className="font-mono">{formatINR(selectedGuest.balance)}</span>
              </div>
            </div>

            {selectedGuest.balance > 0 && (
              <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200">
                ⚠️ Warning: Guest has an outstanding balance of {formatINR(selectedGuest.balance)}. All payment records and history will be permanently preserved after check-out.
              </p>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckoutSubmit}
                disabled={checkoutSubmitting}
                className="py-2.5 px-6 rounded-2xl bg-rose-600 text-white font-black text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                {checkoutSubmitting ? 'Checking Out...' : 'CONFIRM CHECK-OUT & RELEASE BED →'}
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 9. OFFICIAL RECEIPT MODAL */}
      {showReceiptModal && activeReceiptData && (
        <OfficialPaymentReceiptModal
          isOpen={true}
          onClose={() => setShowReceiptModal(false)}
          receiptData={activeReceiptData}
        />
      )}

    </div>
  );
}
