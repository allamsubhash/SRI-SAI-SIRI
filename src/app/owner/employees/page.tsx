'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  ShieldCheck, 
  Mail, 
  Loader, 
  UserCheck, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Search,
  Phone,
  Building,
  User,
  CreditCard,
  Check,
  X,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Clock,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatINR, formatDate } from '@/utils/formatters';

export default function EmployeesManagement() {
  const { showToast } = useToast();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [payoutFilter, setPayoutFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Side Panel States
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [activePayEmp, setActivePayEmp] = useState<any>(null);
  const [paySuccess, setPaySuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmp, setDeleteEmp] = useState<any>(null);

  const [showPayrollOverviewModal, setShowPayrollOverviewModal] = useState(false);
  const [showMaskedBankDetails, setShowMaskedBankDetails] = useState(false);

  // Add Employee Form State (3 Sections)
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addRole, setAddRole] = useState('WARDEN');
  const [addJoiningDate, setAddJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [addStatus, setAddStatus] = useState('ACTIVE');
  const [addSalary, setAddSalary] = useState('22000');
  const [addPayMethod, setAddPayMethod] = useState('Bank Transfer');
  const [addBankAccount, setAddBankAccount] = useState('');
  const [addIfsc, setAddIfsc] = useState('');

  // Edit Employee Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRole, setEditRole] = useState('WARDEN');
  const [editSalary, setEditSalary] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editIfsc, setEditIfsc] = useState('');

  // Salary Payout Form State
  const [payAmount, setPayAmount] = useState('');
  const [payBonus, setPayBonus] = useState('0');
  const [payDeductions, setPayDeductions] = useState('0');
  const [payMethod, setPayMethod] = useState<'Bank Transfer' | 'UPI' | 'Cash'>('Bank Transfer');
  const [payMonth, setPayMonth] = useState('August 2026');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payTxnId, setPayTxnId] = useState('');

  const fetchEmployees = () => {
    setLoading(true);
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addPhone || !addSalary) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: addName, 
          phone: addPhone, 
          email: addEmail,
          address: addAddress, 
          role: addRole, 
          salary: addSalary, 
          joiningDate: addJoiningDate,
          status: addStatus,
          bankDetails: addBankAccount ? `A/C: ${addBankAccount} | IFSC: ${addIfsc}` : undefined
        })
      });
      if (res.ok) {
        setAddName('');
        setAddPhone('');
        setAddEmail('');
        setAddAddress('');
        setAddBankAccount('');
        setAddIfsc('');
        setShowAddModal(false);
        showToast('Employee Registered', `${addName} added to workforce roster.`, 'success');
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditModal = (emp: any) => {
    setEditEmp(emp);
    setEditName(emp.name);
    setEditPhone(emp.phone || '');
    setEditEmail(emp.email || '');
    setEditAddress(emp.address || '');
    setEditRole(emp.role || 'WARDEN');
    setEditSalary(String(emp.salary || 22000));
    setEditJoiningDate(emp.joiningDate || '');
    setEditStatus(emp.status || 'ACTIVE');
    setEditBankAccount('');
    setEditIfsc('');
    setShowEditModal(true);
  };

  const handleSaveEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editEmp.id,
          name: editName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          role: editRole,
          salary: parseFloat(editSalary),
          joiningDate: editJoiningDate,
          status: editStatus
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        setSelectedStaffDetails(null);
        showToast('Staff Profile Updated', `${editName}'s details saved.`, 'success');
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaySalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayEmp || !payAmount) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_salary',
          employeeId: activePayEmp.id,
          amount: payAmount,
          bonus: payBonus,
          deductions: payDeductions
        })
      });
      if (res.ok) {
        setPaySuccess(true);
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedStaffDetails(null);
        showToast('Employee Deleted', 'Staff member removed from active registry.', 'info');
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const totalStaffCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'ACTIVE' || !e.status).length;
  const onLeaveCount = employees.filter(e => e.status === 'ON LEAVE').length;
  
  const totalPayrollDue = useMemo(() => employees.reduce((sum, emp) => sum + (emp.salary || 0), 0), [employees]);
  const totalPaidThisMonth = useMemo(() => employees.reduce((sum, emp) => sum + (emp.isPaidThisMonth ? (emp.salary || 0) : 0), 0), [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = search === '' ||
        emp.name?.toLowerCase().includes(search.toLowerCase()) || 
        emp.phone?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
      const matchesPayout = payoutFilter === 'ALL' || 
        (payoutFilter === 'PAID' && emp.isPaidThisMonth) || 
        (payoutFilter === 'UNPAID' && !emp.isPaidThisMonth);
      const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      return matchesSearch && matchesRole && matchesPayout && matchesStatus;
    });
  }, [employees, search, roleFilter, payoutFilter, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Workforce Control Center...</span>
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
              WORKFORCE & PAYROLL DESK
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {activeCount} ACTIVE EMPLOYEES
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Staff Roster & Payroll Command
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Manage wardens, security guards, housekeepers, electrical staff, and monthly payroll distributions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0 z-10"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Employee</span>
        </button>
      </div>

      {/* 📊 2. STAFF SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-[24px] border cursor-pointer transition-all group ${
            statusFilter === 'ALL' 
              ? 'tenant-bg-soft tenant-border-accent shadow-sm' 
              : 'bg-[#FFFDF9] dark:bg-[#141D19] border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent'
          }`}
        >
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL STAFF</span>
          <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] mt-1">{totalStaffCount}</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">Active Roster</span>
        </div>

        {/* ACTIVE */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-4 rounded-[24px] border backdrop-blur-2xl cursor-pointer transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-xl ring-2 ring-emerald-500/20' 
              : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200/80 dark:border-zinc-800 shadow-md'
          }`}
        >
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">ACTIVE</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">On Duty</span>
        </motion.div>

        {/* ON LEAVE */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter('ON LEAVE')}
          className={`p-4 rounded-[24px] border backdrop-blur-2xl cursor-pointer transition-all ${
            statusFilter === 'ON LEAVE'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-xl ring-2 ring-amber-500/20' 
              : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200/80 dark:border-zinc-800 shadow-md'
          }`}
        >
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">ON LEAVE</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{onLeaveCount}</div>
          <span className="text-[10px] font-extrabold text-amber-500 block mt-1">Temporary Leave</span>
        </motion.div>

        {/* PAYROLL DUE */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPayrollOverviewModal(true)}
          className="p-4 rounded-[24px] bg-white/80 dark:bg-[#121826]/80 border border-slate-200/80 dark:border-zinc-800 shadow-md backdrop-blur-2xl cursor-pointer hover:border-purple-500/40 transition-all"
        >
          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">PAYROLL DUE</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{totalPayrollDue.toLocaleString()}</div>
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block mt-1">Monthly Budget</span>
        </motion.div>

        {/* PAID THIS MONTH */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPayoutFilter('PAID')}
          className={`p-4 rounded-[24px] border backdrop-blur-2xl cursor-pointer transition-all ${
            payoutFilter === 'PAID'
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-xl ring-2 ring-emerald-500/20' 
              : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200/80 dark:border-zinc-800 shadow-md'
          }`}
        >
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">PAID THIS MONTH</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{totalPaidThisMonth.toLocaleString()}</div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">Disbursed</span>
        </motion.div>

      </div>

      {/* 🔍 3. SEARCH & FILTER CONTROLS */}
      <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-4 rounded-[28px] border border-white/80 dark:border-zinc-800 shadow-xl backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="WARDEN">Warden</option>
            <option value="MANAGER">Manager</option>
            <option value="CLEANER">Cleaner</option>
            <option value="SECURITY">Security</option>
            <option value="ELECTRICIAN">Electrician</option>
            <option value="COOK">Cook</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={payoutFilter}
            onChange={(e) => setPayoutFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid This Month</option>
            <option value="UNPAID">Not Paid This Month</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Employment Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON LEAVE">On Leave</option>
          </select>
        </div>

      </div>

      {/* 👥 4. STAFF CARDS GRID */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white/80 dark:bg-zinc-900/80 rounded-[32px] border border-slate-200 dark:border-zinc-800 shadow-xl space-y-3">
          <p className="text-sm font-black text-slate-900 dark:text-white">No staff records found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or role filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => (
            <motion.div
              key={emp.id}
              whileHover={{ y: -5, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStaffDetails(emp)}
              className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-5 rounded-[28px] border border-white/80 dark:border-zinc-800 shadow-xl backdrop-blur-2xl cursor-pointer text-left space-y-4 hover:border-purple-500/40 transition-all group"
            >
              {/* Header: Avatar, Name, Role, Status */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-purple-600 transition-colors">
                      {emp.name}
                    </h3>
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block mt-0.5">
                      {emp.role}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  emp.status === 'ACTIVE' || !emp.status ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                  emp.status === 'ON LEAVE' ? 'bg-amber-500/15 text-amber-500' :
                  'bg-rose-500/15 text-rose-500'
                }`}>
                  {emp.status || 'ACTIVE'}
                </span>
              </div>

              {/* Salary & Contact Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-slate-900 dark:text-white">{emp.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Salary</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">₹{(emp.salary || 22000).toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Joining Date</span>
                  <span className="text-slate-500 font-medium">{emp.joiningDate || '10 May 2024'}</span>
                </div>
              </div>

              {/* Payout & Actions Footer */}
              <div className="flex items-center gap-2 pt-1">
                {emp.isPaidThisMonth ? (
                  <div className="flex-1 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs text-center">
                    PAID THIS MONTH ✓
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePayEmp(emp);
                      setPayAmount(String(emp.salary || 22000));
                      setPaySuccess(false);
                      setShowPayModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    Record Payout
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteEmp(emp);
                    setShowDeleteModal(true);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Delete Staff"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* 📌 5. STAFF DETAILS POPUP MODAL */}
      {selectedStaffDetails && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedStaffDetails(null)}
          title={`Staff Profile: ${selectedStaffDetails.name}`}
          subtitle={`Role: ${selectedStaffDetails.role} • Status: ${selectedStaffDetails.status || 'ACTIVE'}`}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-5 text-left font-sans">
            
            {/* Header Card */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shrink-0">
                {selectedStaffDetails.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedStaffDetails.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                    {selectedStaffDetails.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-black mt-0.5">{selectedStaffDetails.role}</p>
                <div className="flex gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedStaffDetails.phone}</span>
                  {selectedStaffDetails.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedStaffDetails.email}</span>}
                </div>
              </div>
            </div>

            {/* Salary Info */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">SALARY & PAYROLL</span>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Base Salary</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black text-sm">₹{(selectedStaffDetails.salary || 22000).toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between border-t border-purple-500/20 pt-2">
                  <span className="text-slate-400">Annual Salary Package</span>
                  <span className="text-emerald-600 font-black text-sm">₹{((selectedStaffDetails.salary || 22000) * 12).toLocaleString()}/yr</span>
                </div>
              </div>
            </div>

            {/* Masked Bank Details */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BANK DETAILS</span>
                <button
                  onClick={() => setShowMaskedBankDetails(!showMaskedBankDetails)}
                  className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer"
                >
                  {showMaskedBankDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                {showMaskedBankDetails ? (
                  selectedStaffDetails.bankDetails || 'A/C: 987654321098 | IFSC: HDFC0001234'
                ) : (
                  'A/C: XXXX XXXX 7291 | IFSC: HDFC000****'
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-zinc-800/80 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedStaffDetails)}
                className="py-2.5 px-5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePayEmp(selectedStaffDetails);
                  setPayAmount(String(selectedStaffDetails.salary || 22000));
                  setPaySuccess(false);
                  setShowPayModal(true);
                  setSelectedStaffDetails(null);
                }}
                className="py-2.5 px-5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Record Payout
              </button>
              <button
                type="button"
                onClick={() => setSelectedStaffDetails(null)}
                className="py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </NeonModal>
      )}

      {/* 📝 6. ADD NEW EMPLOYEE MODAL (LARGE - 820px) */}
      {showAddModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Add New Employee"
          subtitle="Create a staff profile and configure payroll information."
          size="lg"
          accentColor="purple"
        >
          <form onSubmit={handleAddEmployee} className="space-y-5 text-left">
            
            {/* Section 1: Personal Information */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">1. PERSONAL INFORMATION</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Full Name</label>
                  <input
                    type="text" required value={addName} onChange={(e) => setAddName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Phone Number</label>
                  <input
                    type="text" required value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+91 98765-43210"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Employment */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">2. EMPLOYMENT DETAILS</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Staff Role</label>
                  <select
                    value={addRole} onChange={(e) => setAddRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="WARDEN">Warden</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CLEANER">Cleaner</option>
                    <option value="SECURITY">Security</option>
                    <option value="COOK">Cook</option>
                    <option value="ELECTRICIAN">Electrician</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Joining Date</label>
                  <input
                    type="date" required value={addJoiningDate} onChange={(e) => setAddJoiningDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Employment Status</label>
                  <select
                    value={addStatus} onChange={(e) => setAddStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON LEAVE">On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Payroll */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">3. PAYROLL CONFIGURATION</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Monthly Base Salary (₹)</label>
                  <input
                    type="number" required value={addSalary} onChange={(e) => setAddSalary(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Bank Account Number</label>
                  <input
                    type="text" value={addBankAccount} onChange={(e) => setAddBankAccount(e.target.value)}
                    placeholder="e.g. 987654321098"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Create Employee ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* ✏️ 7. EDIT EMPLOYEE MODAL */}
      {showEditModal && editEmp && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          title={`Edit Employee: ${editEmp.name}`}
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleSaveEditEmployee} className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Full Name</label>
                <input
                  type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Phone</label>
                <input
                  type="text" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Staff Role</label>
                <select
                  value={editRole} onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="WARDEN">Warden</option>
                  <option value="MANAGER">Manager</option>
                  <option value="CLEANER">Cleaner</option>
                  <option value="SECURITY">Security</option>
                  <option value="COOK">Cook</option>
                  <option value="ELECTRICIAN">Electrician</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Monthly Salary (₹)</label>
                <input
                  type="number" required value={editSalary} onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Save Changes ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 💵 8. RECORD STAFF PAYOUT MODAL */}
      {showPayModal && activePayEmp && (
        <NeonModal
          isOpen={true}
          onClose={() => { setShowPayModal(false); setActivePayEmp(null); setPaySuccess(false); }}
          title="Record Staff Payout"
          subtitle={`Disburse salary check for ${activePayEmp.name}`}
          size="md"
          accentColor="purple"
        >
          {paySuccess ? (
            <div className="py-3 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xl font-black shadow-md">
                ✓
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Salary Payment Recorded</h4>
                <p className="text-xs text-emerald-600 font-bold mt-1">₹{payAmount} disbursed to {activePayEmp.name}.</p>
              </div>
              <button
                onClick={() => { setShowPayModal(false); setActivePayEmp(null); setPaySuccess(false); }}
                className="w-full py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handlePaySalarySubmit} className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold space-y-1">
                <p className="text-slate-900 dark:text-white font-black">{activePayEmp.name} ({activePayEmp.role})</p>
                <p className="text-purple-600 dark:text-purple-400 font-black">Monthly Salary: ₹{(activePayEmp.salary || 22000).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Base Salary Amount (₹)</label>
                <input
                  type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Method Selectable Tiles */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Bank Transfer', 'UPI', 'Cash'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        payMethod === m 
                          ? 'bg-purple-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setActivePayEmp(null); }}
                  className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Record Payout ✓
                </button>
              </div>
            </form>
          )}
        </NeonModal>
      )}

      {/* ⚠️ 9. DELETE EMPLOYEE MODAL */}
      {showDeleteModal && deleteEmp && (
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
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Employee?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteEmp.name}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This will remove the employee from active staff registry.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEmployee(deleteEmp.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Employee
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 📊 10. PAYROLL OVERVIEW MODAL */}
      {showPayrollOverviewModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowPayrollOverviewModal(false)}
          title="Payroll Overview"
          subtitle="Monthly workforce budget analysis"
          size="md"
          accentColor="purple"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Monthly Payroll Budget</span>
                <span className="text-slate-900 dark:text-white font-black text-sm">₹{totalPayrollDue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid Disbursed Amount</span>
                <span className="text-emerald-600 font-black text-sm">₹{totalPaidThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-purple-500/20 pt-2">
                <span className="text-slate-400">Pending Salary Outflow</span>
                <span className="text-amber-500 font-black text-sm">₹{(totalPayrollDue - totalPaidThisMonth).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPayrollOverviewModal(false)}
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
