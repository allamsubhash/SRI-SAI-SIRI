'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building as BuildingIcon, 
  Plus, 
  MapPin, 
  Bed as BedIcon, 
  CheckCircle2, 
  AlertTriangle,
  Loader,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Trash2,
  HelpCircle,
  Eye,
  Search,
  SlidersHorizontal,
  Layers,
  Box,
  Compass,
  X,
  Users,
  DollarSign,
  Wrench,
  Check,
  Edit2,
  ArrowRight
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';

export default function BuildingsManagement() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number | null>(null);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<any>(null);
  const [selectedBedDetail, setSelectedBedDetail] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<any>(null);

  // Responsive mobile states & View mode
  const [isMobile, setIsMobile] = useState(false);
  const [roomViewMode, setRoomViewMode] = useState<'COLUMNS' | 'ROWS'>('COLUMNS');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'FULL'>('ALL');
  const [hoveredRoom, setHoveredRoom] = useState<any>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

  // Multi-step Add Building Wizard State
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [addBStep, setAddBStep] = useState<1 | 2 | 3 | 4>(1);
  const [bName, setBName] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bFloors, setBFloors] = useState('3');
  const [bRoomsPerFloor, setBRoomsPerFloor] = useState('4');
  const [bDefaultRent, setBDefaultRent] = useState('8500');

  // Add Room Sheet State
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [rBuildingId, setRBuildingId] = useState('');
  const [rFloorId, setRFloorId] = useState('');
  const [rNumber, setRNumber] = useState('');
  const [rCapacity, setRCapacity] = useState('2');
  const [rRent, setRRent] = useState('8500');
  const [rType, setRType] = useState('AC Double');

  // Edit Building State
  const [showEditBModal, setShowEditBModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [editBName, setEditBName] = useState('');
  const [editBAddress, setEditBAddress] = useState('');

  // Edit Room State
  const [showEditRModal, setShowEditRModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editRNumber, setEditRNumber] = useState('');
  const [editRType, setEditRType] = useState('AC Double');
  const [editRRent, setEditRRent] = useState('8500');
  const [editRCapacity, setEditRCapacity] = useState('2');
  const [editRStatus, setEditRStatus] = useState('AVAILABLE');

  // Custom Delete Confirmations State
  const [deleteBConfirm, setDeleteBConfirm] = useState<any>(null);
  const [deleteRConfirm, setDeleteRConfirm] = useState<any>(null);
  const [successToast, setSuccessToast] = useState<{ title: string; subtitle?: string } | null>(null);

  // Register Tenant Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('password123');
  const [targetRoomNumber, setTargetRoomNumber] = useState('');
  const [targetBedNumber, setTargetBedNumber] = useState('');
  const [registering, setRegistering] = useState(false);

  const handleRegisterTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || registering) return;

    setRegistering(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone || '+91 98765 43210',
          password: regPassword || 'password123',
          gender: 'Male',
          roomNumber: targetRoomNumber || 'A-101',
          bedNumber: targetBedNumber || 'Bed A',
          rentAmount: selectedRoomDetail?.rent || 8500,
          moveInDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE'
        })
      });

      if (res.ok) {
        setShowRegModal(false);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setSuccessToast({ title: 'Resident Registered Successfully!', subtitle: `Created resident ${regName} (${regEmail}) — Login Password: ${regPassword || 'password123'}` });
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register tenant');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchInitialData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/buildings').then(res => res.json()),
      fetch('/api/tenants').then(res => res.json())
    ])
      .then(([bData, tData]) => {
        let deletedIds: string[] = [];
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('srisaisiri_deleted_buildings');
          if (saved) {
            try { deletedIds = JSON.parse(saved); } catch (e) {}
          }
        }
        const rawBuildings = Array.isArray(bData) ? bData : [];
        const validBuildings = rawBuildings.filter((b: any) => !deletedIds.includes(b.id));
        setBuildings(validBuildings);
        setTenants(Array.isArray(tData) ? tData : []);
        if (validBuildings.length > 0) {
          setSelectedBuildingId(prev => (prev && validBuildings.some(b => b.id === prev)) ? prev : validBuildings[0].id);
        } else {
          setSelectedBuildingId(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch buildings error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Currently active selected building object
  const activeBuilding = useMemo(() => {
    return buildings.find(b => b.id === selectedBuildingId) || buildings[0] || null;
  }, [buildings, selectedBuildingId]);

  // Aggregate System Architectural Metrics
  const systemMetrics = useMemo(() => {
    let totalFloors = 0;
    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    buildings.forEach(b => {
      totalFloors += b.floors?.length || 0;
      b.floors?.forEach((f: any) => {
        totalRooms += f.rooms?.length || 0;
        f.rooms?.forEach((r: any) => {
          totalBeds += r.capacity || r.beds?.length || 0;
          const occ = r.beds?.filter((bed: any) => !bed.isAvailable).length || 0;
          occupiedBeds += occ;
        });
      });
    });

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return {
      buildings: buildings.length,
      floors: totalFloors,
      rooms: totalRooms,
      beds: totalBeds,
      occupiedBeds,
      vacantBeds: Math.max(0, totalBeds - occupiedBeds),
      occupancyRate
    };
  }, [buildings]);

  // CRUD Handlers
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bName,
          address: bAddress,
          floorsCount: parseInt(bFloors)
        })
      });
      if (res.ok) {
        setShowAddBuildingModal(false);
        setAddBStep(1);
        setBName('');
        setBAddress('');
        setBFloors('3');
        setSuccessToast({ title: 'Building Created!', subtitle: `${bName} added to architectural registry.` });
        fetchInitialData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rFloorId) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorId: rFloorId,
          number: rNumber,
          type: rType,
          rent: parseFloat(rRent),
          capacity: parseInt(rCapacity)
        })
      });
      if (res.ok) {
        setShowAddRoomModal(false);
        setRNumber('');
        setRCapacity('2');
        setRRent('8500');
        setSuccessToast({ title: 'Room Generated!', subtitle: `Room ${rNumber} with ${rCapacity} beds created.` });
        fetchInitialData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBuilding = async (id: string) => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('srisaisiri_deleted_buildings');
        const deletedIds: string[] = saved ? JSON.parse(saved) : [];
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('srisaisiri_deleted_buildings', JSON.stringify(deletedIds));
        }
      }

      setBuildings(prev => prev.filter(b => b.id !== id));
      setDeleteBConfirm(null);
      setSuccessToast({ title: 'Building Deleted', subtitle: 'Property record permanently removed.' });

      await fetch(`/api/buildings?id=${id}`, { method: 'DELETE' });
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setDeleteRConfirm(null);
        setSelectedRoomDetail(null);
        setSuccessToast({ title: 'Room Deleted', subtitle: 'Room record deleted.' });
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding) return;
    try {
      const res = await fetch('/api/buildings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBuilding.id,
          name: editBName,
          address: editBAddress
        })
      });
      if (res.ok) {
        setShowEditBModal(false);
        setSuccessToast({ title: 'Building Updated', subtitle: 'Building details saved.' });
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRoom.id,
          number: editRNumber,
          type: editRType,
          rent: parseFloat(editRRent),
          capacity: parseInt(editRCapacity),
          status: editRStatus
        })
      });
      if (res.ok) {
        setShowEditRModal(false);
        setSuccessToast({ title: 'Room Saved', subtitle: `Room ${editRNumber} updated successfully.` });
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTenantDetails = (tenantId: string, tenantName: string) => {
    if (!tenantId) return;
    const matched = tenants.find(t => t.id === tenantId);
    if (matched) {
      setSelectedTenantDetails({
        name: matched.name,
        email: matched.email || 'N/A',
        phone: matched.phone || 'N/A',
        roomNumber: matched.roomNumber || 'N/A',
        bedNumber: matched.bedNumber || 'N/A',
        moveInDate: matched.moveInDate ? new Date(matched.moveInDate).toLocaleDateString() : 'N/A'
      });
    } else if (tenantName && tenantName !== 'Vacant Bed Spot' && tenantName !== 'Available for allocation') {
      setSelectedTenantDetails({
        name: tenantName,
        email: 'N/A',
        phone: 'N/A',
        roomNumber: 'N/A',
        bedNumber: 'N/A',
        moveInDate: 'N/A'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Architectural Explorer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-16 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              HOSTEL ARCHITECTURE & ROOMS
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {systemMetrics.occupancyRate}% OCCUPIED ({systemMetrics.occupiedBeds}/{systemMetrics.beds} BEDS)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Property & Room Allocations
          </h1>
          
          {/* Architectural Summary Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="px-3 py-1 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[10px] font-black text-[#1C2522] dark:text-[#F2F5F2]">
              <span className="text-[#68736E] dark:text-[#9BAAA4] font-medium mr-1">BUILDINGS</span>
              <span className="tenant-text-accent">{systemMetrics.buildings}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[10px] font-black text-[#1C2522] dark:text-[#F2F5F2]">
              <span className="text-[#68736E] dark:text-[#9BAAA4] font-medium mr-1">FLOORS</span>
              <span className="tenant-text-accent">{systemMetrics.floors}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[10px] font-black text-[#1C2522] dark:text-[#F2F5F2]">
              <span className="text-[#68736E] dark:text-[#9BAAA4] font-medium mr-1">ROOMS</span>
              <span className="tenant-text-accent">{systemMetrics.rooms}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[10px] font-black text-[#1C2522] dark:text-[#F2F5F2]">
              <span className="text-[#68736E] dark:text-[#9BAAA4] font-medium mr-1">TOTAL BEDS</span>
              <span className="tenant-text-accent">{systemMetrics.beds}</span>
            </div>
          </div>
        </div>

        {/* Right Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto z-10">
          
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929B96]" />
            <input 
              type="text" 
              placeholder="Search room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
            />
          </div>

          {/* Floor Filter Dropdown */}
          <select
            value={selectedFloorNumber === null ? 'ALL' : selectedFloorNumber.toString()}
            onChange={(e: any) => setSelectedFloorNumber(e.target.value === 'ALL' ? null : parseInt(e.target.value))}
            className="py-2 px-3 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
          >
            <option value="ALL">All Floors</option>
            {activeBuilding?.floors?.map((fl: any) => (
              <option key={fl.id} value={fl.number}>
                Floor {fl.number} ({fl.rooms?.length || 0} Rooms)
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* View Switcher (COLUMNS | ROWS) */}
          <div className="p-1 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] flex items-center gap-1">
            <button
              onClick={() => setRoomViewMode('COLUMNS')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                roomViewMode === 'COLUMNS' 
                  ? 'tenant-bg-accent text-white shadow-sm' 
                  : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
              }`}
            >
              🧱 COLUMNS VIEW
            </button>
            <button
              onClick={() => setRoomViewMode('ROWS')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                roomViewMode === 'ROWS' 
                  ? 'tenant-bg-accent text-white shadow-sm' 
                  : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
              }`}
            >
              📊 ROWS VIEW
            </button>
          </div>

          {/* Add Building Action Button */}
          <button
            onClick={() => setShowAddBuildingModal(true)}
            className="py-2.5 px-4 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Building</span>
          </button>
        </div>

      </div>

      {/* 🏢 2. MULTIPLE BUILDINGS SELECTION STRIP */}
      {buildings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {buildings.map((b) => {
            const isSelected = activeBuilding?.id === b.id;
            const bRooms = b.floors?.reduce((sum: number, f: any) => sum + (f.rooms?.length || 0), 0) || 0;
            const bBeds = b.floors?.reduce((sum: number, f: any) => sum + f.rooms?.reduce((rSum: number, r: any) => rSum + (r.capacity || 0), 0), 0) || 0;
            
            return (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBuildingId(b.id);
                  setSelectedFloorNumber(null);
                }}
                className={`p-5 rounded-[28px] border backdrop-blur-xl cursor-pointer transition-all flex justify-between items-start group ${
                  isSelected 
                    ? 'bg-purple-500/10 border-purple-500/40 shadow-xl ring-2 ring-purple-500/20' 
                    : 'bg-white/80 dark:bg-[#121826]/80 border-slate-200 dark:border-zinc-800 shadow-md hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-md shrink-0 ${
                    isSelected ? 'bg-purple-600' : 'bg-slate-800 dark:bg-zinc-800'
                  }`}>
                    <BuildingIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-purple-600 transition-colors">
                      {b.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </p>
                    <div className="flex gap-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-2">
                      <span>{b.floors?.length || 0} Floors</span> • <span>{bRooms} Rooms</span> • <span>{bBeds} Beds</span>
                    </div>
                  </div>
                </div>

                {/* Building Action Controls */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setEditingBuilding(b);
                      setEditBName(b.name);
                      setEditBAddress(b.address);
                      setShowEditBModal(true);
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 hover:text-purple-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit Building"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteBConfirm(b)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete Building"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔮 3. MAIN ARCHITECTURAL CANVAS STAGE */}
      {activeBuilding ? (
        <div className="bg-[#FDFBF9]/95 dark:bg-[#121826]/95 p-6 sm:p-8 rounded-[36px] border border-white/80 dark:border-zinc-800 shadow-2xl backdrop-blur-2xl space-y-6 text-left relative min-h-[550px] overflow-hidden">
          
          {/* Header of Active Building */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/80 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activeBuilding.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                  All Rooms List
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{activeBuilding.address}</p>
            </div>

            <button
              onClick={() => {
                if (activeBuilding.floors?.length > 0) {
                  setRBuildingId(activeBuilding.id);
                  setRFloorId(activeBuilding.floors[0].id);
                  setShowAddRoomModal(true);
                }
              }}
              className="py-2.5 px-4 rounded-2xl bg-purple-600/15 text-purple-600 dark:text-purple-300 font-black text-xs hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </button>
          </div>

          {/* 🏢 ROOM DIRECTORY - COLUMNS (GRID) OR ROWS (TABLE) VIEW */}
          {(() => {
            const allRooms = activeBuilding.floors
              ?.flatMap((f: any) => f.rooms || [])
              .filter((r: any) => {
                if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
                if (searchQuery && !r.number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
              }) || [];

            if (allRooms.length === 0) {
              return (
                <div className="p-12 text-center text-slate-400 dark:text-zinc-500 font-bold text-xs italic">
                  No rooms found matching your current filter criteria.
                </div>
              );
            }

            if (roomViewMode === 'COLUMNS') {
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Showing {allRooms.length} Rooms in Columns View</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-extrabold">💡 Click any room card to open details pop-up</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allRooms.map((room: any) => {
                      const occupiedBeds = room.beds?.filter((b: any) => !b.isAvailable).length || 0;
                      const isPartiallyOcc = occupiedBeds > 0 && occupiedBeds < (room.capacity || 2);
                      const isFull = occupiedBeds === (room.capacity || 2);
                      const isVacant = occupiedBeds === 0;

                      const statusBadge = isFull ? 'FULL' : isPartiallyOcc ? 'PARTIALLY OCCUPIED' : isVacant ? 'AVAILABLE' : room.status;
                      const statusColorClass = isFull 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                        : isPartiallyOcc 
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' 
                        : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';

                      return (
                        <motion.div
                          key={room.id}
                          whileHover={{ y: -4, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedRoomDetail(room)}
                          className={`p-5 rounded-[28px] bg-white/90 dark:bg-zinc-900/90 border shadow-lg backdrop-blur-xl cursor-pointer text-left space-y-3 transition-all ${
                            selectedRoomDetail?.id === room.id 
                              ? 'border-purple-600 dark:border-purple-400 ring-2 ring-purple-500/20 scale-[1.02]' 
                              : 'border-slate-200/80 dark:border-zinc-800 hover:border-purple-500/40'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-black text-slate-900 dark:text-white text-base">ROOM {room.number}</h5>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">{room.type || 'Standard'}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${statusColorClass}`}>
                              {statusBadge}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              {occupiedBeds} / {room.capacity || 2} Beds Occupied
                            </span>
                            <div className="flex gap-2">
                              {Array.from({ length: room.capacity || 2 }).map((_, bedIdx) => {
                                const bedObj = room.beds?.[bedIdx];
                                const isBedOccupied = bedObj && !bedObj.isAvailable;
                                
                                return (
                                  <div
                                    key={bedIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (bedObj) {
                                        setSelectedBedDetail({ ...bedObj, roomNumber: room.number, rent: room.rent });
                                      }
                                    }}
                                    className={`flex-1 p-2 rounded-xl border text-center transition-transform hover:scale-105 ${
                                      isBedOccupied 
                                        ? 'bg-purple-600 text-white border-purple-500' 
                                        : 'bg-slate-100 dark:bg-zinc-800/80 text-cyan-600 dark:text-cyan-400 border-slate-200 dark:border-zinc-700'
                                    }`}
                                    title={isBedOccupied ? `Bed ${bedIdx + 1}: ${bedObj?.tenantName || 'Occupied'}` : `Bed ${bedIdx + 1}: Available`}
                                  >
                                    <BedIcon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                                    <span className="text-[8px] font-black block">BED {String.fromCharCode(65 + bedIdx)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs font-black">
                            <span className="text-slate-400 text-[10px]">Monthly Tariff</span>
                            <span className="text-slate-900 dark:text-white">₹{(room.rent || 8500).toLocaleString()}/mo</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            /* ROWS VIEW (TABLE ROWS) */
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold">Showing {allRooms.length} Rooms in Rows View</span>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-extrabold">💡 Click any room row to open details pop-up</span>
                </div>

                <div className="p-4 rounded-[28px] bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                          <th className="py-3 px-4">Room Number</th>
                          <th className="py-3 px-4">Room Category</th>
                          <th className="py-3 px-4">Bed Capacity</th>
                          <th className="py-3 px-4">Monthly Rent</th>
                          <th className="py-3 px-4">Occupancy Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                        {allRooms.map((room: any) => {
                          const occupiedBeds = room.beds?.filter((b: any) => !b.isAvailable).length || 0;
                          const isPartiallyOcc = occupiedBeds > 0 && occupiedBeds < (room.capacity || 2);
                          const isFull = occupiedBeds === (room.capacity || 2);
                          const isVacant = occupiedBeds === 0;

                          const statusBadge = isFull ? 'FULL' : isPartiallyOcc ? 'PARTIALLY OCCUPIED' : isVacant ? 'AVAILABLE' : room.status;
                          const statusColorClass = isFull 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                            : isPartiallyOcc 
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' 
                            : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';

                          return (
                            <tr
                              key={room.id}
                              onClick={() => setSelectedRoomDetail(room)}
                              className="hover:bg-purple-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                            >
                              <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                                    {room.number}
                                  </div>
                                  <span>Room {room.number}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-zinc-300">
                                {room.type || 'Standard'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-zinc-300">
                                {occupiedBeds} / {room.capacity || 2} Beds Occupied
                              </td>
                              <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                                ₹{(room.rent || 8500).toLocaleString()}/mo
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusColorClass}`}>
                                  {statusBadge}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="text-purple-600 dark:text-purple-400 font-extrabold text-xs flex items-center justify-end gap-1 group-hover:translate-x-1 transition-transform">
                                  Inspect Details <Eye className="w-3.5 h-3.5" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      ) : (
        /* EMPTY STATE FOR BUILDINGS */
        <div className="p-12 text-center bg-white/80 dark:bg-zinc-900/80 rounded-[36px] border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/15 text-purple-600 mx-auto flex items-center justify-center text-3xl">
            🏢
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">No Buildings Registered Yet</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">Create your first hostel building structure to start adding floors, rooms, and managing bed allocations.</p>
          <button
            onClick={() => setShowAddBuildingModal(true)}
            className="py-3 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            + Create First Building
          </button>
        </div>
      )}

      {/* 🚪 4. CONTEXTUAL ROOM DETAIL DRAWER / POPUP (MEDIUM - 540px) */}
      <AnimatePresence>
        {selectedRoomDetail && (
          <NeonModal
            isOpen={true}
            onClose={() => setSelectedRoomDetail(null)}
            title={`ROOM ${selectedRoomDetail.number}`}
            subtitle={`Floor Structure • ${selectedRoomDetail.type || 'Standard Suite'}`}
            size="md"
            accentColor="purple"
          >
            <div className="space-y-5 text-left">
              
              {/* Room Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-slate-400 text-[10px] font-bold block">Capacity</span>
                  <span className="font-black text-slate-900 dark:text-white text-base mt-0.5 block">{selectedRoomDetail.capacity || 2} Beds</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-slate-400 text-[10px] font-bold block">Monthly Rent</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base mt-0.5 block">₹{(selectedRoomDetail.rent || 8500).toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-slate-400 text-[10px] font-bold block">Occupied</span>
                  <span className="font-black text-purple-600 dark:text-purple-400 text-base mt-0.5 block">
                    {selectedRoomDetail.beds?.filter((b: any) => !b.isAvailable).length || 0} / {selectedRoomDetail.capacity || 2}
                  </span>
                </div>
              </div>

              {/* Bed Status Breakdown */}
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block mb-2">BED ALLOCATION & RESIDENTS</span>
                <div className="space-y-2">
                  {selectedRoomDetail.beds?.map((b: any, idx: number) => {
                    const isBedOccupied = !b.isAvailable;
                    return (
                      <div 
                        key={b.id || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <BedIcon className={`w-4 h-4 ${isBedOccupied ? 'text-purple-600' : 'text-slate-400'}`} />
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">BED {String.fromCharCode(65 + idx)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {isBedOccupied ? (b.tenantName || 'Resident Occupant') : 'Vacant Bed Spot'}
                            </p>
                          </div>
                        </div>

                        {isBedOccupied ? (
                          <button
                            onClick={() => handleOpenTenantDetails(b.tenantId, b.tenantName)}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black text-[10px] hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                          >
                            View Resident Profile
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setTargetRoomNumber(selectedRoomDetail.number);
                              setTargetBedNumber(`Bed ${String.fromCharCode(65 + idx)}`);
                              setSelectedRoomDetail(null);
                              setShowRegModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Tenant
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Actions */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setEditingRoom(selectedRoomDetail);
                    setEditRNumber(selectedRoomDetail.number);
                    setEditRType(selectedRoomDetail.type || 'AC Double');
                    setEditRRent(selectedRoomDetail.rent?.toString() || '8500');
                    setEditRCapacity(selectedRoomDetail.capacity?.toString() || '2');
                    setEditRStatus(selectedRoomDetail.status || 'AVAILABLE');
                    setSelectedRoomDetail(null);
                    setShowEditRModal(true);
                  }}
                  className="py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Edit Room Config
                </button>

                <button
                  onClick={() => setDeleteRConfirm(selectedRoomDetail)}
                  className="py-3 rounded-2xl bg-rose-500/15 text-rose-600 font-bold text-xs hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                >
                  Delete Room
                </button>
              </div>

            </div>
          </NeonModal>
        )}
      </AnimatePresence>

      {/* 🛌 5. BED DETAIL POPUP (SMALL - 380px) */}
      <AnimatePresence>
        {selectedBedDetail && (
          <NeonModal
            isOpen={true}
            onClose={() => setSelectedBedDetail(null)}
            title={`BED SPOT`}
            subtitle={`Room ${selectedBedDetail.roomNumber}`}
            size="sm"
            accentColor="purple"
          >
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                <BedIcon className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">{selectedBedDetail.number || 'BED A'}</h4>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">₹{(selectedBedDetail.rent || 8500).toLocaleString()} / month</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-slate-400">Status</span>
                  <span className="font-black text-emerald-600">{selectedBedDetail.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}</span>
                </div>
                {!selectedBedDetail.isAvailable && (
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <span className="text-slate-400">Tenant</span>
                    <span className="font-black text-slate-900 dark:text-white">{selectedBedDetail.tenantName || 'Ananya Roy'}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedBedDetail(null)}
                className="w-full py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Close
              </button>
            </div>
          </NeonModal>
        )}
      </AnimatePresence>

      {/* 🏢 6. ADD BUILDING SINGLE-PAGE POPUP MODAL */}
      {showAddBuildingModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowAddBuildingModal(false)}
          title="Add New Building"
          subtitle="Provision building name, address, floors, & rooms in one single popup."
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleCreateBuilding} className="space-y-4 text-left font-sans select-none">
            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-zinc-300 block mb-1">Building Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Block C - Elite Hostel"
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-zinc-300 block mb-1">Street Address</label>
              <input 
                type="text" 
                required
                placeholder="Plot 42, Cyber City, Knowledge Park"
                value={bAddress}
                onChange={(e) => setBAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 dark:text-zinc-300 block mb-1">Number of Floors</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  required
                  value={bFloors}
                  onChange={(e) => setBFloors(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-700 dark:text-zinc-300 block mb-1">Rooms per Floor</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  required
                  value={bRoomsPerFloor}
                  onChange={(e) => setBRoomsPerFloor(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 dark:text-zinc-300 block mb-1">Default Monthly Rent (₹)</label>
              <input 
                type="number" 
                required
                value={bDefaultRent}
                onChange={(e) => setBDefaultRent(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddBuildingModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                CREATE BUILDING ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 🚪 7. ADD ROOM SHEET MODAL WITH LIVE ROOM PREVIEW (MEDIUM - 540px) */}
      {showAddRoomModal && activeBuilding && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowAddRoomModal(false)}
          title="Add Room & Generate Beds"
          subtitle="Real-time live room preview generator"
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4 text-left">
            
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Select Floor</label>
              <select 
                value={rFloorId}
                onChange={(e) => setRFloorId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              >
                {activeBuilding.floors?.map((f: any) => (
                  <option key={f.id} value={f.id}>Floor {f.number}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Room Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. C-104"
                  value={rNumber}
                  onChange={(e) => setRNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Bed Capacity</label>
                <input 
                  type="number" 
                  min="1" 
                  max="6"
                  value={rCapacity}
                  onChange={(e) => setRCapacity(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Monthly Rent (₹)</label>
              <input 
                type="number" 
                value={rRent}
                onChange={(e) => setRRent(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* LIVE ROOM PREVIEW PANEL */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">LIVE ROOM PREVIEW</span>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 dark:text-white">
                <span>ROOM {rNumber || 'A-104'}</span>
                <span>₹{parseFloat(rRent || '8500').toLocaleString()}/mo</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {Array.from({ length: parseInt(rCapacity) || 2 }).map((_, bIdx) => (
                  <div key={bIdx} className="p-2 rounded-xl bg-purple-600 text-white text-center text-[10px] font-bold">
                    <BedIcon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    BED {String.fromCharCode(65 + bIdx)}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Generate Room & Beds ✓
              </button>
            </div>

          </form>
        </NeonModal>
      )}

      {/* ✏️ 8. EDIT BUILDING MODAL */}
      {showEditBModal && editingBuilding && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowEditBModal(false)}
          title="Edit Building Configuration"
          subtitle="Update building name and street address"
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleUpdateBuilding} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Building Name</label>
              <input 
                type="text" 
                value={editBName}
                onChange={(e) => setEditBName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Street Address</label>
              <input 
                type="text" 
                value={editBAddress}
                onChange={(e) => setEditBAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Save Building Updates ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* ✏️ 9. EDIT ROOM MODAL */}
      {showEditRModal && editingRoom && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowEditRModal(false)}
          title={`Edit Room ${editingRoom.number}`}
          subtitle="Modify room tariff, capacity, or status"
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleUpdateRoom} className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Room Number</label>
                <input 
                  type="text" 
                  value={editRNumber}
                  onChange={(e) => setEditRNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Monthly Rent (₹)</label>
                <input 
                  type="number" 
                  value={editRRent}
                  onChange={(e) => setEditRRent(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Save Room Updates ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* ⚠️ 10. CUSTOM DELETE CONFIRMATION POPUP FOR BUILDINGS */}
      {deleteBConfirm && (
        <NeonModal
          isOpen={true}
          onClose={() => setDeleteBConfirm(null)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Building?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteBConfirm.name}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This will affect all attached floors, rooms, and room structure.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteBConfirm(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBuilding(deleteBConfirm.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Building
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 11. CUSTOM DELETE CONFIRMATION POPUP FOR ROOMS */}
      {deleteRConfirm && (
        <NeonModal
          isOpen={true}
          onClose={() => setDeleteRConfirm(null)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Room {deleteRConfirm.number}?</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">This action cannot be undone. Are you sure?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteRConfirm(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(deleteRConfirm.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Room
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 🎉 12. SUCCESS TOAST POPUP */}
      {successToast && (
        <NeonModal
          isOpen={true}
          onClose={() => setSuccessToast(null)}
          size="sm"
          accentColor="emerald"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xl font-black shadow-md">
              ✓
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{successToast.title}</h4>
              {successToast.subtitle && (
                <p className="text-xs text-slate-400 font-medium mt-1">{successToast.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              Done
            </button>
          </div>
        </NeonModal>
      )}

      {/* 👤 13. TENANT PROFILE DETAIL MODAL */}
      {selectedTenantDetails && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedTenantDetails(null)}
          title="Resident Profile"
          subtitle="Current tenant occupancy profile"
          size="sm"
          accentColor="purple"
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md">
                {selectedTenantDetails.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">{selectedTenantDetails.name}</h4>
                <p className="text-xs text-slate-400 font-bold">Room {selectedTenantDetails.roomNumber} • Bed {selectedTenantDetails.bedNumber}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Phone</span>
                <span className="text-slate-900 dark:text-white">{selectedTenantDetails.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-900 dark:text-white">{selectedTenantDetails.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Move-in Date</span>
                <span className="text-slate-900 dark:text-white">{selectedTenantDetails.moveInDate}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTenantDetails(null)}
              className="w-full py-2.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </NeonModal>
      )}

      {/* 📝 REGISTER TENANT POPUP MODAL */}
      {showRegModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowRegModal(false)}
          title="Register New Resident"
          subtitle={`Assigning to Room ${targetRoomNumber} · ${targetBedNumber}`}
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handleRegisterTenantSubmit} className="space-y-4 text-left text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">TARGET BED SPOT</span>
                <span className="font-black text-slate-900 dark:text-white text-base">Room {targetRoomNumber} ({targetBedNumber})</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase">
                VACANT
              </span>
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Resident Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Account Initial Password</label>
              <input
                type="text"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registering}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-md hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {registering ? <Loader className="w-4 h-4 animate-spin" /> : 'Confirm & Assign Resident'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

    </div>
  );
}
