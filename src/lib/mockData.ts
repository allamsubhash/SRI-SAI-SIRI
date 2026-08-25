export interface MockUser {
  id: string;
  email: string;
  role: 'OWNER' | 'TENANT';
  name: string;
}

export const mockUsers: MockUser[] = [
  { id: 'u-owner-1', email: 'owner@srisaisiri.com', role: 'OWNER', name: 'Alok Sharma (Owner)' },
  { id: 'u-tenant-1', email: 'tenant@srisaisiri.com', role: 'TENANT', name: 'Rohan Verma' },
  { id: 'u-tenant-2', email: 'priya@srisaisiri.com', role: 'TENANT', name: 'Priya Sharma' },
  { id: 'u-tenant-3', email: 'amit@srisaisiri.com', role: 'TENANT', name: 'Amit Patel' },
  { id: 'u-tenant-4', email: 'sneha@srisaisiri.com', role: 'TENANT', name: 'Sneha Reddy' }
];

export interface MockBuilding {
  id: string;
  name: string;
  address: string;
  floors: {
    id: string;
    number: number;
    rooms: {
      id: string;
      number: string;
      type: string;
      rent: number;
      capacity: number;
      status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
      amenities: string[];
      beds: {
        id: string;
        number: string;
        tenantId: string | null;
        tenantName?: string;
        isAvailable: boolean;
      }[];
    }[];
  }[];
}

export const mockBuildings: MockBuilding[] = [
  {
    id: 'b-1',
    name: 'Block A - Premium Executive',
    address: 'Sector 62, Noida, UP - 201301',
    floors: [
      {
        id: 'f-1-1',
        number: 1,
        rooms: [
          {
            id: 'r-101',
            number: 'A-101',
            type: 'AC Double Sharing',
            rent: 8500,
            capacity: 2,
            status: 'OCCUPIED',
            amenities: ['AC', 'Wifi', 'Attached Bathroom', 'Study Table'],
            beds: [
              { id: 'bed-101-1', number: 'A-101-A', tenantId: 'u-tenant-1', tenantName: 'Rohan Verma', isAvailable: false },
              { id: 'bed-101-2', number: 'A-101-B', tenantId: 'u-tenant-2', tenantName: 'Priya Sharma', isAvailable: false }
            ]
          },
          {
            id: 'r-102',
            number: 'A-102',
            type: 'AC Single Deluxe',
            rent: 14000,
            capacity: 1,
            status: 'OCCUPIED',
            amenities: ['AC', 'Wifi', 'Attached Bathroom', 'Balcony', 'TV'],
            beds: [
              { id: 'bed-102-1', number: 'A-102-A', tenantId: 'u-tenant-3', tenantName: 'Amit Patel', isAvailable: false }
            ]
          },
          {
            id: 'r-103',
            number: 'A-103',
            type: 'AC Double Sharing',
            rent: 8500,
            capacity: 2,
            status: 'AVAILABLE',
            amenities: ['AC', 'Wifi', 'Attached Bathroom'],
            beds: [
              { id: 'bed-103-1', number: 'A-103-A', tenantId: null, isAvailable: true },
              { id: 'bed-103-2', number: 'A-103-B', tenantId: null, isAvailable: true }
            ]
          }
        ]
      },
      {
        id: 'f-1-2',
        number: 2,
        rooms: [
          {
            id: 'r-201',
            number: 'A-201',
            type: 'AC Triple Sharing',
            rent: 6500,
            capacity: 3,
            status: 'OCCUPIED',
            amenities: ['AC', 'Wifi', 'Attached Bathroom'],
            beds: [
              { id: 'bed-201-1', number: 'A-201-A', tenantId: 'u-tenant-4', tenantName: 'Sneha Reddy', isAvailable: false },
              { id: 'bed-201-2', number: 'A-201-B', tenantId: null, isAvailable: true },
              { id: 'bed-201-3', number: 'A-201-C', tenantId: null, isAvailable: true }
            ]
          },
          {
            id: 'r-202',
            number: 'A-202',
            type: 'AC Single Deluxe',
            rent: 14000,
            capacity: 1,
            status: 'MAINTENANCE',
            amenities: ['AC', 'Wifi', 'Attached Bathroom', 'Balcony'],
            beds: [
              { id: 'bed-202-1', number: 'A-202-A', tenantId: null, isAvailable: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'b-2',
    name: 'Block B - Classic Standard',
    address: 'Sector 62, Noida, UP - 201301',
    floors: [
      {
        id: 'f-2-1',
        number: 1,
        rooms: [
          {
            id: 'r-301',
            number: 'B-101',
            type: 'Non-AC Double Sharing',
            rent: 5500,
            capacity: 2,
            status: 'AVAILABLE',
            amenities: ['Wifi', 'Ceiling Fan', 'Attached Bathroom'],
            beds: [
              { id: 'bed-301-1', number: 'B-101-A', tenantId: null, isAvailable: true },
              { id: 'bed-301-2', number: 'B-101-B', tenantId: null, isAvailable: true }
            ]
          },
          {
            id: 'r-302',
            number: 'B-102',
            type: 'Non-AC Triple Sharing',
            rent: 4500,
            capacity: 3,
            status: 'AVAILABLE',
            amenities: ['Wifi', 'Ceiling Fan', 'Common Bathroom'],
            beds: [
              { id: 'bed-302-1', number: 'B-102-A', tenantId: null, isAvailable: true },
              { id: 'bed-302-2', number: 'B-102-B', tenantId: null, isAvailable: true },
              { id: 'bed-302-3', number: 'B-102-C', tenantId: null, isAvailable: true }
            ]
          }
        ]
      }
    ]
  }
];

export interface MockTenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  aadhaar: string;
  emergencyName: string;
  emergencyPhone: string;
  guardianName: string;
  guardianPhone: string;
  occupation: string;
  moveInDate: string;
  moveOutDate: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED';
  roomNumber: string;
  bedNumber: string;
  rentAmount: number;
  agreementUrl: string;
  medicalNotes: string;
  photoUrl: string;
}

export const mockTenants: MockTenant[] = [
  {
    id: 't-1',
    userId: 'u-tenant-1',
    name: 'Rohan Verma',
    email: 'tenant@srisaisiri.com',
    phone: '+91 98765 43210',
    gender: 'Male',
    address: '12/4, Mall Road, Shimla, HP',
    aadhaar: '1234-5678-9012',
    emergencyName: 'Vijay Verma (Father)',
    emergencyPhone: '+91 98765 43211',
    guardianName: 'Sanjay Verma (Uncle)',
    guardianPhone: '+91 98765 43212',
    occupation: 'Student (Software Engineering)',
    moveInDate: '2026-01-15',
    moveOutDate: null,
    status: 'ACTIVE',
    roomNumber: 'A-101',
    bedNumber: 'A-101-A',
    rentAmount: 8500,
    agreementUrl: '/docs/rohan_agreement.pdf',
    medicalNotes: 'No major medical issues. Penicillin allergy.',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&auto=format&fit=crop'
  },
  {
    id: 't-2',
    userId: 'u-tenant-2',
    name: 'Priya Sharma',
    email: 'priya@srisaisiri.com',
    phone: '+91 87654 32109',
    gender: 'Female',
    address: '45, Civil Lines, Jaipur, Rajasthan',
    aadhaar: '5678-9012-3456',
    emergencyName: 'Ramesh Sharma (Father)',
    emergencyPhone: '+91 87654 32100',
    guardianName: 'Sudha Sharma (Mother)',
    guardianPhone: '+91 87654 32101',
    occupation: 'UI Designer (TCS)',
    moveInDate: '2026-02-01',
    moveOutDate: null,
    status: 'ACTIVE',
    roomNumber: 'A-101',
    bedNumber: 'A-101-B',
    rentAmount: 8500,
    agreementUrl: '/docs/priya_agreement.pdf',
    medicalNotes: 'Asthmatic, carries inhaler.',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop'
  },
  {
    id: 't-3',
    userId: 'u-tenant-3',
    name: 'Amit Patel',
    email: 'amit@srisaisiri.com',
    phone: '+91 76543 21098',
    gender: 'Male',
    address: '78, Satellite Road, Ahmedabad, Gujarat',
    aadhaar: '9012-3456-7890',
    emergencyName: 'Dinesh Patel (Father)',
    emergencyPhone: '+91 76543 21090',
    guardianName: 'Neela Patel (Mother)',
    guardianPhone: '+91 76543 21091',
    occupation: 'Student (MBA - Amity)',
    moveInDate: '2026-01-10',
    moveOutDate: null,
    status: 'ACTIVE',
    roomNumber: 'A-102',
    bedNumber: 'A-102-A',
    rentAmount: 14000,
    agreementUrl: '/docs/amit_agreement.pdf',
    medicalNotes: 'None.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop'
  },
  {
    id: 't-4',
    userId: 'u-tenant-4',
    name: 'Sneha Reddy',
    email: 'sneha@srisaisiri.com',
    phone: '+91 65432 10987',
    gender: 'Female',
    address: '90, Gachibowli, Hyderabad, Telangana',
    aadhaar: '3456-7890-1234',
    emergencyName: 'Prasad Reddy (Father)',
    emergencyPhone: '+91 65432 10980',
    guardianName: 'Latha Reddy (Mother)',
    guardianPhone: '+91 65432 10981',
    occupation: 'Student (B.Tech - JIIT)',
    moveInDate: '2026-03-01',
    moveOutDate: null,
    status: 'ACTIVE',
    roomNumber: 'A-201',
    bedNumber: 'A-201-A',
    rentAmount: 6500,
    agreementUrl: '/docs/sneha_agreement.pdf',
    medicalNotes: 'None.',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop'
  }
];

export interface MockInvoice {
  id: string;
  number: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'PENDING_VERIFICATION';
  items: { description: string; amount: number }[];
  dateCreated: string;
}

export const mockInvoices: MockInvoice[] = [
  {
    id: 'inv-1',
    number: 'INV-2026-07-001',
    tenantId: 't-1',
    tenantName: 'Rohan Verma',
    roomNumber: 'A-101',
    amount: 9000,
    paidAmount: 9000,
    dueDate: '2026-07-05',
    status: 'PAID',
    items: [
      { description: 'Monthly Room Rent (July 2026)', amount: 8500 },
      { description: 'High-Speed Wi-Fi Service', amount: 500 }
    ],
    dateCreated: '2026-07-01'
  },
  {
    id: 'inv-2',
    number: 'INV-2026-07-002',
    tenantId: 't-2',
    tenantName: 'Priya Sharma',
    roomNumber: 'A-101',
    amount: 9000,
    paidAmount: 9000,
    dueDate: '2026-07-05',
    status: 'PAID',
    items: [
      { description: 'Monthly Room Rent (July 2026)', amount: 8500 },
      { description: 'High-Speed Wi-Fi Service', amount: 500 }
    ],
    dateCreated: '2026-07-01'
  },
  {
    id: 'inv-3',
    number: 'INV-2026-07-003',
    tenantId: 't-3',
    tenantName: 'Amit Patel',
    roomNumber: 'A-102',
    amount: 14500,
    paidAmount: 14500,
    dueDate: '2026-07-05',
    status: 'PAID',
    items: [
      { description: 'Monthly Room Rent (July 2026)', amount: 14000 },
      { description: 'High-Speed Wi-Fi Service', amount: 500 }
    ],
    dateCreated: '2026-07-01'
  },
  {
    id: 'inv-4',
    number: 'INV-2026-07-004',
    tenantId: 't-4',
    tenantName: 'Sneha Reddy',
    roomNumber: 'A-201',
    amount: 7000,
    paidAmount: 3000,
    dueDate: '2026-07-05',
    status: 'PARTIAL',
    items: [
      { description: 'Monthly Room Rent (July 2026)', amount: 6500 },
      { description: 'High-Speed Wi-Fi Service', amount: 500 }
    ],
    dateCreated: '2026-07-01'
  },
  {
    id: 'inv-5',
    number: 'INV-2026-06-005',
    tenantId: 't-4',
    tenantName: 'Sneha Reddy',
    roomNumber: 'A-201',
    amount: 7000,
    paidAmount: 0,
    dueDate: '2026-06-05',
    status: 'OVERDUE',
    items: [
      { description: 'Monthly Room Rent (June 2026)', amount: 6500 },
      { description: 'High-Speed Wi-Fi Service', amount: 500 }
    ],
    dateCreated: '2026-06-01'
  }
];

export interface MockEmployee {
  id: string;
  name: string;
  phone: string;
  address: string;
  role: string;
  salary: number;
  status: 'ACTIVE' | 'INACTIVE';
  bankDetails: string;
  emergencyContact: string;
  photoUrl: string;
  joiningDate: string;
  pendingSalary: number;
  advanceTaken: number;
}

export const mockEmployees: MockEmployee[] = [
  {
    id: 'emp-1',
    name: 'Satish Kumar',
    phone: '+91 99887 76655',
    address: 'Village Nithari, Sector 31, Noida',
    role: 'Warden',
    salary: 22000,
    status: 'ACTIVE',
    bankDetails: 'SBI - A/C 20394857291 (IFSC: SBIN0001254)',
    emergencyContact: 'Maya Devi (Wife) - +91 99887 76650',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop',
    joiningDate: '2024-05-10',
    pendingSalary: 0,
    advanceTaken: 2000
  },
  {
    id: 'emp-2',
    name: 'Ram Singh',
    phone: '+91 88776 65544',
    address: 'Gali 2, Harola, Sector 5, Noida',
    role: 'Cook',
    salary: 16000,
    status: 'ACTIVE',
    bankDetails: 'HDFC - A/C 98725412354 (IFSC: HDFC0000412)',
    emergencyContact: 'Lokesh Singh (Son) - +91 88776 65540',
    photoUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=256&auto=format&fit=crop',
    joiningDate: '2025-01-15',
    pendingSalary: 4000,
    advanceTaken: 0
  },
  {
    id: 'emp-3',
    name: 'Karan Bahadur',
    phone: '+91 77665 54433',
    address: 'Khora Colony, Ghaziabad',
    role: 'Security',
    salary: 14000,
    status: 'ACTIVE',
    bankDetails: 'PNB - A/C 45129845123 (IFSC: PUNB0124500)',
    emergencyContact: 'Prem Bahadur (Brother) - +91 77665 54430',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop',
    joiningDate: '2025-03-01',
    pendingSalary: 0,
    advanceTaken: 0
  },
  {
    id: 'emp-4',
    name: 'Sunita Bai',
    phone: '+91 66554 43322',
    address: 'Madanpur Khadar, New Delhi',
    role: 'Cleaner',
    salary: 10000,
    status: 'ACTIVE',
    bankDetails: 'Cash Preferred',
    emergencyContact: 'Raju (Husband) - +91 66554 43320',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop',
    joiningDate: '2025-02-10',
    pendingSalary: 0,
    advanceTaken: 500
  }
];

export interface MockComplaint {
  id: string;
  title: string;
  description: string;
  category: 'ELECTRICITY' | 'WATER' | 'FURNITURE' | 'INTERNET' | 'CLEANING' | 'FOOD' | 'OTHER';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  assignedEmployeeId: string | null;
  assignedEmployeeName?: string;
  dateCreated: string;
}

export const mockComplaints: MockComplaint[] = [];

export interface MockVisitor {
  id: string;
  name: string;
  phone: string;
  personVisiting: string;
  checkIn: string;
  checkOut: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  tenantId: string;
}

export const mockVisitors: MockVisitor[] = [
  {
    id: 'vis-1',
    name: 'Manish Verma',
    phone: '+91 99112 23344',
    personVisiting: 'Rohan Verma',
    checkIn: '2026-07-13 14:00',
    checkOut: '2026-07-13 17:30',
    approvalStatus: 'APPROVED',
    tenantId: 't-1'
  },
  {
    id: 'vis-2',
    name: 'Asha Sharma',
    phone: '+91 88223 34455',
    personVisiting: 'Priya Sharma',
    checkIn: '2026-07-13 18:15',
    checkOut: null,
    approvalStatus: 'PENDING',
    tenantId: 't-2'
  }
];

export interface MockInventory {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  purchaseDate: string;
  cost: number;
  warrantyYears: number;
  vendor: string;
  replacementDate: string | null;
}

export const mockInventory: MockInventory[] = [
  {
    id: 'inv-item-1',
    name: 'Voltas 1.5 Ton Split AC',
    category: 'ELECTRONIC',
    quantity: 12,
    condition: 'GOOD',
    purchaseDate: '2024-04-12',
    cost: 38000,
    warrantyYears: 5,
    vendor: 'Croma Retail Noida',
    replacementDate: '2029-04-12'
  },
  {
    id: 'inv-item-2',
    name: 'Sleepwell Ortho Mattress 6x3',
    category: 'MATTRESS',
    quantity: 35,
    condition: 'GOOD',
    purchaseDate: '2025-06-01',
    cost: 5500,
    warrantyYears: 3,
    vendor: 'Sleepwell Studio',
    replacementDate: '2028-06-01'
  },
  {
    id: 'inv-item-3',
    name: 'Havells Ceiling Fan 1200mm',
    category: 'FAN',
    quantity: 24,
    condition: 'GOOD',
    purchaseDate: '2024-05-15',
    cost: 2400,
    warrantyYears: 2,
    vendor: 'Electric World Sector 18',
    replacementDate: '2026-05-15'
  },
  {
    id: 'inv-item-4',
    name: 'Wooden Study Table + Chair Sets',
    category: 'FURNITURE',
    quantity: 20,
    condition: 'FAIR',
    purchaseDate: '2024-08-10',
    cost: 4500,
    warrantyYears: 1,
    vendor: 'Noida Furniture Market',
    replacementDate: '2027-08-10'
  }
];

export interface MockExpense {
  id: string;
  title: string;
  amount: number;
  category: 'ELECTRICITY' | 'WATER' | 'INTERNET' | 'FOOD' | 'REPAIRS' | 'FURNITURE' | 'CLEANING' | 'SALARY' | 'TAXES' | 'MISC';
  date: string;
  notes: string;
}

export const mockExpenses: MockExpense[] = [
  { id: 'exp-1', title: 'Monthly Electricity Bill (June 2026)', amount: 24500, category: 'ELECTRICITY', date: '2026-07-02', notes: 'Payment for entire building block A & B main meters.' },
  { id: 'exp-2', title: 'Internet Lease Line 100 Mbps fiber', amount: 4800, category: 'INTERNET', date: '2026-07-01', notes: 'Excitel broadband monthly recharge.' },
  { id: 'exp-3', title: 'Groceries & Mess supplies (Week 1 July)', amount: 15300, category: 'FOOD', date: '2026-07-07', notes: 'Vegetables, rice, oil, milk, and eggs.' },
  { id: 'exp-4', title: 'Plumbing materials (tap, seal, washers)', amount: 1200, category: 'REPAIRS', date: '2026-07-10', notes: 'Purchased for room A-102 tap repairs.' },
  { id: 'exp-5', title: 'Warden Salary Alok Sharma', amount: 22000, category: 'SALARY', date: '2026-07-01', notes: 'Paid warden salary for June 2026.' }
];

export interface MockNotice {
  id: string;
  title: string;
  content: string;
  target: 'EVERYONE' | 'TENANTS' | 'EMPLOYEES';
  isEmergency: boolean;
  scheduleDate: string;
}

export const mockNotices: MockNotice[] = [
  {
    id: 'n-1',
    title: 'Scheduled Water Supply Interruption',
    content: 'Please note that water overhead tanks will undergo semi-annual cleaning on Wednesday (July 15th) from 10:00 AM to 2:00 PM. Water supply will be suspended during this time. Please store water in advance.',
    target: 'EVERYONE',
    isEmergency: true,
    scheduleDate: '2026-07-13'
  },
  {
    id: 'n-2',
    title: 'Mess Menu Feedback Form Submission',
    content: 'All tenants are requested to fill out the weekly mess rating and menu selection form at the Warden desk before Friday. Your inputs help us curate better food choices.',
    target: 'TENANTS',
    isEmergency: false,
    scheduleDate: '2026-07-12'
  },
  {
    id: 'n-3',
    title: 'Staff Review & Briefing Meeting',
    content: 'A mandatory meeting for all cleaning and kitchen staff will be held on July 16th at 4:00 PM in the Warden Office to discuss cleanliness guidelines.',
    target: 'EMPLOYEES',
    isEmergency: false,
    scheduleDate: '2026-07-11'
  }
];

export interface MockLeaveRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dateCreated: string;
}

export const mockLeaveRequests: MockLeaveRequest[] = [
  {
    id: 'l-1',
    tenantId: 't-1',
    tenantName: 'Rohan Verma',
    roomNumber: 'A-101',
    startDate: '2026-07-18',
    endDate: '2026-07-21',
    reason: 'Going home for cousin\'s wedding in Shimla.',
    status: 'PENDING',
    dateCreated: '2026-07-13'
  },
  {
    id: 'l-2',
    tenantId: 't-2',
    tenantName: 'Priya Sharma',
    roomNumber: 'A-101',
    startDate: '2026-07-02',
    endDate: '2026-07-05',
    reason: 'Weekend trip with family.',
    status: 'APPROVED',
    dateCreated: '2026-06-30'
  }
];
