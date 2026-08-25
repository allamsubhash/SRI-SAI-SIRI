'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader,
  User,
  Zap,
  Droplet,
  Wifi,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  Plus,
  X,
  FileText,
  ShieldAlert,
  Trash2,
  Edit2,
  UserPlus,
  Check,
  Tag,
  Paperclip,
  Calendar,
  MessageSquare
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';

export default function ComplaintsManagement() {
  const { showToast } = useToast();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'URGENT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Side Panel / Modal States
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Dialog Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignComplaint, setAssignComplaint] = useState<any>(null);
  const [selEmployeeId, setSelEmployeeId] = useState('');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusComplaint, setStatusComplaint] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>('IN_PROGRESS');

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityComplaint, setPriorityComplaint] = useState<any>(null);
  const [targetPriority, setTargetPriority] = useState<string>('HIGH');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteComplaint, setNoteComplaint] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState<any>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteComplaint, setDeleteComplaint] = useState<any>(null);

  // Floating Quick Action Menu
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const fetchComplaintsData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/complaints').then(res => res.json()),
      fetch('/api/employees').then(res => res.json())
    ])
      .then(([compData, empData]) => {
        setComplaints(Array.isArray(compData) ? compData : []);
        const techStaff = Array.isArray(empData) ? empData.filter((e: any) => e.role === 'WARDEN' || e.role === 'MAINTENANCE' || e.role === 'CLEANER' || e.role === 'ELECTRICIAN') : [];
        setEmployees(techStaff);
        if (techStaff.length > 0) {
          setSelEmployeeId(techStaff[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaintsData();
  }, []);

  const handleUpdateStatus = async (compId: string, status: string, empId?: string) => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: compId,
          status,
          employeeId: empId
        })
      });
      if (res.ok) {
        setShowAssignModal(false);
        setShowStatusModal(false);
        setShowResolveModal(false);
        setSelectedComplaint(null);
        showToast('Complaint Updated', `Ticket status changed to ${status}.`, 'success');
        fetchComplaintsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComplaint = async (compId: string) => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: compId })
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedComplaint(null);
        showToast('Complaint Deleted', 'Ticket removed from operations board.', 'info');
        fetchComplaintsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    if (selectedComplaint) {
      const updatedTimeline = selectedComplaint.timeline || [];
      updatedTimeline.push({
        title: 'Note Added',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: noteText
      });
      setSelectedComplaint({ ...selectedComplaint, timeline: updatedTimeline });
    }
    setShowNoteModal(false);
    setNoteText('');
    showToast('Note Added', 'Internal note logged in timeline.', 'success');
  };

  const getCategoryIcon = (cat: string) => {
    switch ((cat || '').toUpperCase()) {
      case 'ELECTRICAL':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'PLUMBING':
        return <Droplet className="w-3.5 h-3.5 text-blue-500" />;
      case 'WIFI':
      case 'INTERNET':
        return <Wifi className="w-3.5 h-3.5 text-violet-500" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Group Complaints for Summary Metrics
  const totalCount = complaints.length;
  const pendingTickets = useMemo(() => complaints.filter(c => c.status === 'PENDING'), [complaints]);
  const assignedTickets = useMemo(() => complaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS'), [complaints]);
  const resolvedTickets = useMemo(() => complaints.filter(c => c.status === 'RESOLVED'), [complaints]);
  const urgentTickets = useMemo(() => complaints.filter(c => (c.priority || '').toUpperCase() === 'URGENT' || (c.priority || '').toUpperCase() === 'HIGH'), [complaints]);

  // Filtered tickets
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = search === '' ||
        (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.tenantName || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.roomNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.id || '').toLowerCase().includes(search.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'PENDING') matchesStatus = c.status === 'PENDING';
      else if (statusFilter === 'ASSIGNED') matchesStatus = c.status === 'ASSIGNED';
      else if (statusFilter === 'IN_PROGRESS') matchesStatus = c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED';
      else if (statusFilter === 'RESOLVED') matchesStatus = c.status === 'RESOLVED';
      else if (statusFilter === 'URGENT') matchesStatus = (c.priority || '').toUpperCase() === 'URGENT' || (c.priority || '').toUpperCase() === 'HIGH';

      const matchesCategory = categoryFilter === 'ALL' || (c.category || '').toUpperCase() === categoryFilter.toUpperCase();
      const matchesPriority = priorityFilter === 'ALL' || (c.priority || '').toUpperCase() === priorityFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Hostel Operations Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-24 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              HOSTEL MAINTENANCE DESK
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {pendingTickets.length} OPEN ISSUES
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Maintenance & Complaints Desk
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Track resident complaints, dispatch technicians, log maintenance status, and resolve issues.
          </p>
        </div>

        <button
          onClick={() => {
            if (pendingTickets.length > 0) {
              setAssignComplaint(pendingTickets[0]);
              setShowAssignModal(true);
            } else {
              showToast('No Pending Tickets', 'There are no pending complaints to dispatch staff.', 'info');
            }
          }}
          className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0 z-10"
        >
          <Wrench className="w-4 h-4" />
          <span>+ Dispatch Technician</span>
        </button>
      </div>

      {/* 📊 2. COMPLAINT SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* TOTAL REQUESTS */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all group ${
            statusFilter === 'ALL' 
              ? 'tenant-bg-soft tenant-border-accent shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL REQUESTS</span>
          <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] mt-1">{totalCount}</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">All Tickets</span>
        </div>

        {/* PENDING */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all group ${
            statusFilter === 'PENDING' 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest block">PENDING</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{pendingTickets.length}</div>
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 block mt-1">Awaiting Technician</span>
        </div>

        {/* IN PROGRESS */}
        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all group ${
            statusFilter === 'IN_PROGRESS' || statusFilter === 'ASSIGNED' 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">IN PROGRESS</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{assignedTickets.length}</div>
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 block mt-1">Work Underway</span>
        </div>

        {/* RESOLVED */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 rounded-[24px] border backdrop-blur-2xl cursor-pointer transition-all ${
            statusFilter === 'RESOLVED' 
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-xl ring-2 ring-emerald-500/20' 
              : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200/80 dark:border-zinc-800 shadow-md'
          }`}
        >
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">RESOLVED</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedTickets.length}</div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">Completed Archive</span>
        </motion.div>

        {/* URGENT */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter('URGENT')}
          className={`p-4 rounded-[24px] border backdrop-blur-2xl cursor-pointer transition-all ${
            statusFilter === 'URGENT' 
              ? 'bg-rose-500/20 border-rose-500 shadow-xl ring-2 ring-rose-500/30 animate-pulse' 
              : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200/80 dark:border-zinc-800 shadow-md'
          }`}
        >
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest block">URGENT</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{urgentTickets.length}</div>
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 block mt-1">High Priority Dues</span>
        </motion.div>

      </div>

      {/* 🔍 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-4 rounded-[28px] border border-white/80 dark:border-zinc-800 shadow-xl backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search complaints, resident, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Furniture">Furniture</option>
            <option value="Internet">Internet / Wifi</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

      </div>

      {/* 📋 4. JIRA-STYLE KANBAN BOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMN 1: PENDING QUEUE */}
        <div className="p-5 rounded-[28px] bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <h3 className="font-black text-slate-900 dark:text-white text-sm">PENDING QUEUE</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-black text-xs">
              {filteredComplaints.filter(c => c.status === 'PENDING').length}
            </span>
          </div>

          <div className="space-y-3">
            {filteredComplaints.filter(c => c.status === 'PENDING').length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase">NO PENDING TICKETS</p>
                <p className="text-[10px] text-slate-400">All submitted tickets have been dispatched.</p>
              </div>
            ) : (
              filteredComplaints.filter(c => c.status === 'PENDING').map(c => (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedComplaint(c)}
                  className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-4.5 rounded-[24px] border border-white/80 dark:border-zinc-800 shadow-lg text-left space-y-3 cursor-pointer hover:border-rose-500/40 transition-all border-l-4 border-l-rose-500"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-slate-400 font-mono">CMP-{c.id.slice(-4).toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-black uppercase">
                      {c.priority || 'HIGH'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{c.title}</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                    <span className="font-bold text-slate-400">{c.tenantName} (Room {c.roomNumber})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignComplaint(c);
                        setShowAssignModal(true);
                      }}
                      className="py-1 px-3 rounded-xl bg-purple-600 text-white font-black text-[10px] hover:scale-105 transition-transform cursor-pointer"
                    >
                      Assign Staff
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS */}
        <div className="p-5 rounded-[28px] bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-black text-slate-900 dark:text-white text-sm">IN PROGRESS</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-black text-xs">
              {filteredComplaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length}
            </span>
          </div>

          <div className="space-y-3">
            {filteredComplaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase">NO ACTIVE WORK</p>
                <p className="text-[10px] text-slate-400">No technicians currently on active duty.</p>
              </div>
            ) : (
              filteredComplaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').map(c => (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedComplaint(c)}
                  className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-4.5 rounded-[24px] border border-white/80 dark:border-zinc-800 shadow-lg text-left space-y-3 cursor-pointer hover:border-amber-500/40 transition-all border-l-4 border-l-amber-500"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-slate-400 font-mono">CMP-{c.id.slice(-4).toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-black uppercase">
                      IN WORK
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{c.title}</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-600 dark:text-purple-400">
                    Tech: {c.assignedEmployeeName || 'Satish Kumar (Warden)'}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                    <span className="font-bold text-slate-400">{c.tenantName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResolveComplaint(c);
                        setShowResolveModal(true);
                      }}
                      className="py-1 px-3 rounded-xl bg-emerald-500 text-white font-black text-[10px] hover:scale-105 transition-transform cursor-pointer"
                    >
                      Resolve ✓
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: RESOLVED ARCHIVE */}
        <div className="p-5 rounded-[28px] bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-black text-slate-900 dark:text-white text-sm">RESOLVED ARCHIVE</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs">
              {filteredComplaints.filter(c => c.status === 'RESOLVED').length}
            </span>
          </div>

          <div className="space-y-3">
            {filteredComplaints.filter(c => c.status === 'RESOLVED').length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase">NO RESOLVED LOGS</p>
                <p className="text-[10px] text-slate-400">Completed tickets will appear in the archive.</p>
              </div>
            ) : (
              filteredComplaints.filter(c => c.status === 'RESOLVED').map(c => (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedComplaint(c)}
                  className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-4.5 rounded-[24px] border border-white/80 dark:border-zinc-800 shadow-md text-left space-y-2 opacity-85 cursor-pointer border-l-4 border-l-emerald-500"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-slate-400 font-mono">CMP-{c.id.slice(-4).toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-black uppercase">
                      RESOLVED
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-through">{c.title}</h4>
                  <p className="text-slate-400 text-xs font-medium">{c.tenantName} (Room {c.roomNumber})</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 📌 5. COMPLAINT DETAILS RIGHT-SIDE DRAWER (480px) */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div 
            key="complaint-side-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex justify-end bg-slate-900/40 dark:bg-black/70 backdrop-blur-md cursor-pointer"
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 w-full max-w-[480px] h-full p-6 sm:p-7 shadow-2xl border-l border-white/80 dark:border-zinc-800 backdrop-blur-2xl flex flex-col justify-between text-left overflow-y-auto custom-scrollbar cursor-default"
            >
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200/80 dark:border-zinc-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">COMPLAINT DETAILS</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{selectedComplaint.title}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: CMP-{selectedComplaint.id.slice(-4).toUpperCase()}</p>
                  </div>

                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Section 1: Resident Info */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RESIDENT</span>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name</span>
                      <span className="text-slate-900 dark:text-white font-black">{selectedComplaint.tenantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Room</span>
                      <span className="text-purple-600 dark:text-purple-400 font-black">Room {selectedComplaint.roomNumber || 'A-101'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Description */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DESCRIPTION</span>
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Section 3: Assigned Tech */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ASSIGNED TECHNICIAN</span>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-bold">
                    {selectedComplaint.assignedEmployeeName ? (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-900 dark:text-white font-black">{selectedComplaint.assignedEmployeeName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px]">Active Tech</span>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No technician assigned yet.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Actions Footer Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAssignComplaint(selectedComplaint);
                      setShowAssignModal(true);
                    }}
                    className="py-3 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    Assign Staff
                  </button>
                  <button
                    onClick={() => {
                      setResolveComplaint(selectedComplaint);
                      setShowResolveModal(true);
                    }}
                    className="py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setNoteComplaint(selectedComplaint);
                      setShowNoteModal(true);
                    }}
                    className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => {
                      setDeleteComplaint(selectedComplaint);
                      setShowDeleteModal(true);
                    }}
                    className="py-2.5 rounded-2xl bg-rose-500/15 text-rose-600 font-bold text-xs hover:bg-rose-500 hover:text-white cursor-pointer"
                  >
                    Delete Ticket
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 6. ASSIGN STAFF POPUP */}
      {showAssignModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowAssignModal(false)}
          title="Assign Maintenance Staff"
          subtitle={`Assign technician to complaint: ${assignComplaint?.title || ''}`}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Select Technician</label>
              <select
                value={selEmployeeId}
                onChange={(e) => setSelEmployeeId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(assignComplaint?.id, 'ASSIGNED', selEmployeeId)}
                className="py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Assign Staff ✓
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 📝 7. ADD NOTE POPUP */}
      {showNoteModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowNoteModal(false)}
          title="Add Internal Note"
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleAddNote} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Internal Note Details</label>
              <textarea
                required
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add internal note about parts, delay, or tenant contact..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Save Note ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* ⚠️ 8. RESOLVE COMPLAINT CONFIRMATION MODAL */}
      {showResolveModal && resolveComplaint && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowResolveModal(false)}
          size="sm"
          accentColor="emerald"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xl font-black shadow-md">
              ✓
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Resolve Complaint?</h4>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">{resolveComplaint.title}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Are you sure this maintenance issue has been completed?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(resolveComplaint.id, 'RESOLVED')}
                className="py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 9. DELETE COMPLAINT MODAL */}
      {showDeleteModal && deleteComplaint && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowDeleteModal(false)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Ticket?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteComplaint.title}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This action cannot be undone.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteComplaint(deleteComplaint.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Complaint
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ➕ 10. FLOATING QUICK ACTION BUTTON (+) */}
      <div className="fixed bottom-6 right-6 z-50">
        {quickMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="mb-3 space-y-2 flex flex-col items-end"
          >
            <button
              onClick={() => {
                setStatusFilter('URGENT');
                setQuickMenuOpen(false);
              }}
              className="py-2.5 px-4 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-xl hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> View Urgent
            </button>
            <button
              onClick={() => {
                setStatusFilter('PENDING');
                setQuickMenuOpen(false);
              }}
              className="py-2.5 px-4 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-xl hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
            >
              <Clock className="w-4 h-4" /> View Pending Queue
            </button>
          </motion.div>
        )}

        <button
          onClick={() => setQuickMenuOpen(!quickMenuOpen)}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
        >
          {quickMenuOpen ? '×' : '+'}
        </button>
      </div>

    </div>
  );
}
