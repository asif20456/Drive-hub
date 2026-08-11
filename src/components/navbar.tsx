'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { QuickRoleSwitcher } from './quick-role-switcher';
import {
  Car,
  Calendar,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `nav-link ${active ? 'nav-link-active' : ''}`;

  const isActive = (path: string) => pathname === path;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || '?';

  return (
    <header className="sticky top-0 z-40 bg-paper backdrop-blur border-b border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1 — wordmark + auth cluster */}
        <div className="h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 rounded-md bg-ink text-paper flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xl font-semibold tracking-tight text-ink leading-none block truncate">
                Drive Hub
              </span>
              <span className="label-mono text-[9px] block mt-1 truncate">
                Pakistan car rental platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <QuickRoleSwitcher />

            {user ? (
              <div className="flex items-center gap-2 border-l border-rule pl-3">
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={`${user.name} avatar`}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-paper-3 border border-rule shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent text-paper flex items-center justify-center text-xs font-bold font-mono shrink-0">
                    {initials(user.name)}
                  </div>
                )}
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-semibold text-ink leading-tight">{user.name}</p>
                  <p className="text-[10px] text-muted font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                    {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-accent" />}
                    {user.role === 'owner' && <Building2 className="w-3 h-3 text-accent" />}
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-muted hover:text-ink hover:bg-paper-3 rounded-md transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="btn btn-ghost px-3 py-1.5 text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary px-3.5 py-1.5 text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 — mono masthead nav links */}
        <nav className="hidden md:flex items-center gap-6 h-10 overflow-x-auto">
          <Link href="/" className={linkClass(isActive('/'))}>
            <Car className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Browse Cars
          </Link>

          {user?.role === 'customer' && (
            <Link href="/customer/bookings" className={linkClass(isActive('/customer/bookings'))}>
              <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              My Bookings
            </Link>
          )}

          {(user?.role === 'owner' || user?.role === 'staff') && (
            <>
              <Link href="/tenant/dashboard" className={linkClass(isActive('/tenant/dashboard'))}>
                <LayoutDashboard className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Dashboard
              </Link>
              <Link href="/tenant/cars" className={linkClass(isActive('/tenant/cars'))}>
                <Car className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Fleet Cars
              </Link>
              <Link href="/tenant/bookings" className={linkClass(isActive('/tenant/bookings'))}>
                <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Tenant Bookings
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <Link href="/admin" className={linkClass(isActive('/admin'))}>
              <Building2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Platform Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
