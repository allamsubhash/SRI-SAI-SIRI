import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { formatDate } from '@/utils/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const readCookie = cookieStore.get('read_notifs')?.value || '';
    const readIds = readCookie ? readCookie.split(',') : [];

    let currentUser: any = null;
    if (token) {
      currentUser = verifyToken(token);
    }

    const isOwner = currentUser?.role === 'OWNER';
    const isTenant = currentUser?.role === 'TENANT';

    // Fetch real-time data from DB for notifications
    const [recentPayments, recentComplaints, recentVisitors, recentNotices] = await Promise.all([
      prisma.payment.findMany({
        take: 15,
        orderBy: { date: 'desc' },
        include: { tenant: { include: { profile: true } } }
      }),
      prisma.complaint.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { include: { profile: true } } }
      }),
      prisma.visitor.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { include: { profile: true } } }
      }),
      prisma.notice.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const notifications: any[] = [];

    // Helper for matching tenant
    const isTenantMatch = (tenantObj: any) => {
      if (!isTenant) return false;
      if (!tenantObj) return true;
      if (currentUser?.userId && tenantObj.userId === currentUser.userId) return true;
      if (currentUser?.name && tenantObj.profile?.firstName && currentUser.name.toLowerCase().includes(tenantObj.profile.firstName.toLowerCase())) return true;
      return true;
    };

    // 1. PAYMENT NOTIFICATIONS
    recentPayments.forEach(p => {
      const name = p.tenant?.profile ? `${p.tenant.profile.firstName} ${p.tenant.profile.lastName}`.trim() : 'Resident';
      const notifId = `notif-pay-${p.id}`;

      if (isOwner) {
        notifications.push({
          id: notifId,
          type: 'PAYMENT',
          tag: 'RENT PAYMENT',
          title: `Payment Received: ₹${p.amount.toLocaleString('en-IN')}`,
          desc: `Received from ${name} via ${p.paymentMethod || 'UPI'}.`,
          time: formatDate(p.date),
          link: '/owner/rent',
          read: readIds.includes(notifId)
        });
      } else if (isTenantMatch(p.tenant)) {
        notifications.push({
          id: notifId,
          type: 'PAYMENT',
          tag: 'PAYMENT RECEIPT',
          title: `Rent Payment Settled: ₹${p.amount.toLocaleString('en-IN')}`,
          desc: `Your rent payment has been processed and verified cleanly.`,
          time: formatDate(p.date),
          link: '/tenant/billing',
          read: readIds.includes(notifId)
        });
      }
    });

    // 2. COMPLAINT NOTIFICATIONS
    recentComplaints.forEach(c => {
      const name = c.tenant?.profile ? `${c.tenant.profile.firstName} ${c.tenant.profile.lastName}`.trim() : 'Resident';
      const notifId = `notif-comp-${c.id}`;

      if (isOwner) {
        notifications.push({
          id: notifId,
          type: 'COMPLAINT',
          tag: 'SERVICE TICKET',
          title: `Support Ticket: ${c.title}`,
          desc: `Filed by ${name} (${c.category}). Status: ${c.status}`,
          time: formatDate(c.createdAt),
          link: '/owner/complaints',
          read: readIds.includes(notifId)
        });
      } else if (isTenantMatch(c.tenant)) {
        notifications.push({
          id: notifId,
          type: 'COMPLAINT',
          tag: 'TICKET STATUS',
          title: `Ticket "${c.title}" updated`,
          desc: `Current status: ${c.status}. Maintenance desk is processing your request.`,
          time: formatDate(c.createdAt),
          link: '/tenant/complaints',
          read: readIds.includes(notifId)
        });
      }
    });

    // 3. VISITOR GATE PASS NOTIFICATIONS
    recentVisitors.forEach(v => {
      const name = v.tenant?.profile ? `${v.tenant.profile.firstName} ${v.tenant.profile.lastName}`.trim() : v.personVisiting;
      const notifId = `notif-vis-${v.id}`;
      const status = (v as any).status || (v as any).approvalStatus || 'APPROVED';

      if (isOwner) {
        notifications.push({
          id: notifId,
          type: 'VISITOR',
          tag: 'GATE PASS',
          title: `Gate Pass Request: ${v.name}`,
          desc: `Visiting ${name}. Phone: ${v.phone}. Status: ${status}`,
          time: formatDate(v.createdAt),
          link: '/owner/visitors',
          read: readIds.includes(notifId)
        });
      } else if (isTenantMatch(v.tenant)) {
        notifications.push({
          id: notifId,
          type: 'VISITOR',
          tag: 'VISITOR PASS',
          title: `Visitor Gate Pass: ${v.name}`,
          desc: `Pass for ${v.name} is ${status}. Scheduled: ${v.checkIn || 'Today'}.`,
          time: formatDate(v.createdAt),
          link: '/tenant/visitors',
          read: readIds.includes(notifId)
        });
      }
    });

    // 4. WARDEN BROADCAST ANNOUNCEMENTS
    recentNotices.forEach(n => {
      const notifId = `notif-notice-${n.id}`;
      notifications.push({
        id: notifId,
        type: 'ANNOUNCEMENT',
        tag: n.isEmergency ? 'EMERGENCY ALERT' : 'ANNOUNCEMENT',
        title: n.title,
        desc: n.content,
        time: formatDate(n.createdAt),
        link: isOwner ? '/owner/notices' : '/tenant/announcements',
        read: readIds.includes(notifId)
      });
    });

    // Unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, markAll } = await request.json();
    const cookieStore = await cookies();
    const readCookie = cookieStore.get('read_notifs')?.value || '';

    let readIds = readCookie ? readCookie.split(',') : [];

    if (markAll) {
      // Mark all as read
      const currentNotifsRes = await GET(request);
      const currentData = await currentNotifsRes.json();
      const allIds = currentData.notifications ? currentData.notifications.map((n: any) => n.id) : [];
      readIds = Array.from(new Set([...readIds, ...allIds]));
    } else if (id) {
      if (!readIds.includes(id)) {
        readIds.push(id);
      }
    }

    cookieStore.set('read_notifs', readIds.join(','), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: 'lax'
    });

    return NextResponse.json({ success: true, readIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update notification state' }, { status: 500 });
  }
}
