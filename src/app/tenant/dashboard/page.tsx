'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchTenantCars } from '@/lib/services/cars';
import { fetchTenantBookings } from '@/lib/services/bookings';
import { fetchTenantById } from '@/lib/services/tenants';
import { Car, Booking, Tenant } from '@/types';
import {
  LayoutDashboard,
  Car as CarIcon,
  Calendar,
  DollarSign,
  PlayCircle,
  Building2,
  AlertTriangle,
  MapPin,
  Phone,
  ShieldAlert
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role !== 'owner' && user.role !== 'staff') {
      router.push('/');
      return;
    }
    if (!user.tenantId) { setLoading(false); return; }
    loadData();
  }, [user]);

  async function loadData() {
    if (!user?.tenantId) return;
    setLoading(true);
    const [fetchedCars, fetchedBookings, fetchedTenant] = await Promise.all([
      fetchTenantCars(user.tenantId),
      fetchTenantBookings(user.tenantId),
      fetchTenantById(user.tenantId),
    ]);
    setCars(fetchedCars);
    setBookings(fetchedBookings);
    setTenant(fetchedTenant);
    setLoading(false);
  }

  if (!user || (user.role !== 'owner' && user.role !== 'staff')) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-danger mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Access restricted</h1>
        <p className="text-sm text-muted">This dashboard is for rental business owners and staff only.</p>
      </div>
    );
  }

  // Stats
  const totalRevenue = bookings
    .filter(b => b.status === 'completed' || b.status === 'active')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const activeBookings = bookings.filter(b => b.status === 'active').length;
  const availableCars = cars.filter(c => c.status === 'available').length;
  const rentedCars = cars.filter(c => c.status === 'rented').length;

  // Recent bookings (last 5)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const isSuspended = tenant?.status === 'suspended';

  return (
    <div className="space-y-10">

      {/* Suspension warning */}
      {isSuspended && (
        <div className="p-4 rounded-md bg-danger-soft border border-danger flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger">Account suspended</p>
            <p className="text-xs text-danger mt-0.5">Your rental business has been suspended by the Platform Administrator. You cannot add, edit, or manage cars or bookings until reactivated.</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label-mono">Tenant workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-accent" />
            Dashboard
          </h1>
          {tenant && (
            <p className="text-sm text-muted mt-2 flex items-center gap-2 flex-wrap">
              <Building2 className="w-3.5 h-3.5 text-neutral" />
              {tenant.name} — {tenant.city}
              <span className={`badge ${isSuspended ? 'badge-suspended' : 'badge-available'}`}>
                {tenant.status}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/tenant/cars')} className="btn btn-primary">
            Manage fleet
          </button>
          <button onClick={() => router.push('/tenant/bookings')} className="btn btn-secondary">
            View bookings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CarIcon, label: 'Total vehicles', value: cars.length, sub: `${availableCars} available · ${rentedCars} rented`, color: 'text-info' },
          { icon: Calendar, label: 'Total bookings', value: bookings.length, sub: `${pendingBookings} pending`, color: 'text-warn' },
          { icon: PlayCircle, label: 'Active rentals', value: activeBookings, sub: `${confirmedBookings} confirmed`, color: 'text-purple' },
          { icon: DollarSign, label: 'Revenue earned', value: `$${totalRevenue.toLocaleString()}`, sub: 'Completed + active', color: 'text-success' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="border border-rule rounded-lg p-5 bg-paper-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <p className="label-mono text-[10px]">{stat.label}</p>
              </div>
              <p className="font-display text-3xl font-semibold text-ink num">{stat.value}</p>
              <p className="text-[11px] text-muted mt-1.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Two column: fleet status & recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="border border-rule rounded-lg p-5 bg-paper-2 space-y-4">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <CarIcon className="w-4 h-4 text-accent" />
            Fleet status
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(n => <div key={n} className="skeleton h-12" />)}
            </div>
          ) : cars.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">No vehicles in your fleet yet.</p>
          ) : (
            <div className="space-y-2">
              {cars.slice(0, 6).map(car => (
                <div key={car.id} className="flex items-center justify-between px-3 py-2.5 bg-paper border border-rule rounded-md text-xs">
                  <div>
                    <span className="font-medium text-ink">{car.make} {car.model}</span>
                    <span className="text-muted ml-2 font-mono text-[11px]">({car.year})</span>
                  </div>
                  <span className={`badge badge-${car.status}`}>{car.status}</span>
                </div>
              ))}
              {cars.length > 6 && (
                <button
                  onClick={() => router.push('/tenant/cars')}
                  className="link-arrow text-xs pt-1"
                >
                  View all {cars.length} vehicles →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border border-rule rounded-lg p-5 bg-paper-2 space-y-4">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Recent bookings
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(n => <div key={n} className="skeleton h-14" />)}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map(booking => (
                <div key={booking.id} className="px-3 py-2.5 bg-paper border border-rule rounded-md text-xs flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-medium text-ink">{booking.customerName}</span>
                    <span className="text-muted ml-2">{booking.carDetails.make} {booking.carDetails.model}</span>
                    <div className="text-[10px] text-muted font-mono mt-1">{booking.startDate} → {booking.endDate}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                    <p className="text-xs font-semibold text-ink num mt-1">${booking.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Business info */}
      {tenant && (
        <div className="border border-rule rounded-lg p-5 bg-paper-2">
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            Business information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-ink-2">
            <div>
              <span className="label-mono text-[10px] block">Business name</span>
              <span className="font-semibold text-ink mt-1 block">{tenant.name}</span>
            </div>
            <div>
              <span className="label-mono text-[10px] block">Location</span>
              <span className="font-semibold text-ink mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                {tenant.city}
              </span>
            </div>
            <div>
              <span className="label-mono text-[10px] block">Phone</span>
              <span className="font-semibold text-ink mt-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-accent" />
                {tenant.phone}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
