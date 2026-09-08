'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/lib/auth/server';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  FARMER: [
    { href: '/dashboard/farmer', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/farmer/bookings', label: 'My Bookings', icon: '📋' },
    { href: '/dashboard/farmer/queue', label: 'Queue Status', icon: '⏳' },
    { href: '/centres', label: 'Find Centre', icon: '🏢' },
  ],
  OPERATOR: [
    { href: '/dashboard/operator', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/operator/queue', label: 'Queue', icon: '📋' },
    { href: '/dashboard/operator/procurements', label: 'Procurements', icon: '📦' },
    { href: '/dashboard/operator/checkin', label: 'Check-In', icon: '✅' },
  ],
  ADMIN: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/admin/centres', label: 'Centres', icon: '🏢' },
    { href: '/dashboard/admin/operators', label: 'Operators', icon: '👥' },
    { href: '/dashboard/admin/reports', label: 'Reports', icon: '📊' },
  ],
};

export default function DashboardSidebar({
  role,
  fullName,
}: {
  role: UserRole;
  fullName: string;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] || [];

  return (
    <aside
      style={{
        width: '16rem',
        minHeight: '100%',
        background: 'white',
        borderRight: '1px solid var(--border)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        flexShrink: 0,
      }}
    >
      {/* User info */}
      <div
        style={{
          padding: '1rem',
          background: 'var(--green-50)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--green-200)',
        }}
      >
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: 'var(--green-600)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: '0.5rem',
          }}
        >
          {fullName.charAt(0).toUpperCase()}
        </div>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)' }}>
          {fullName}
        </p>
        <span className="badge badge-green" style={{ marginTop: '0.25rem' }}>
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Sign out at bottom */}
      <div style={{ marginTop: 'auto' }}>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="sidebar-link"
            style={{
              width: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--destructive)',
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>🚪</span>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
