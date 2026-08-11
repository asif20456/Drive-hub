'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchTenantBookings, updateBookingStatus } from '@/lib/services/bookings';
import { fetchTenantById } from '@/lib/services/tenants';
import { Booking, BookingStatus, Tenant } from '@/types';
import toast from 'react-hot-toast';
import {
  Calendar,
  Car as CarIcon,
  User,
  AlertTriangle,
  ShieldAlert,
  Inbox
} from 'lucide-react';

const STATUS_FLOW: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TenantBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role !== 'owner' && user.role !== 'staff') { router.push('/'); return; }
    if (!user.tenantId) { setLoading(false); return; }
    loadData();
  }, [user]);

  async function loadData() {
    if (!user?.tenantId) return;
    setLoading(true);
    const [fetchedBookings, fetchedTenant] = await Promise.all([
      fetchTenantBookings(user.tenantId),
      fetchTenantById(user.tenantId)
    ]);
    fetchedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(fetchedBookings);
    setTenant(fetchedTenant);
    setLoading(false);
  }

  async function handleStatusUpdate(booking: Booking, newStatus: BookingStatus) {
    if (tenant?.status === 'suspended') {
      toast.error('Account suspended. Cannot update booking status.');
      return;
    }
    setUpdating(booking.id);
    const result = await updateBookingStatus(booking.id, newStatus, 'staff');
    if (result.success) {
      toast.success(`Booking status updated to "${newStatus}"`);
      await loadData();
    } else {
      toast.error(result.error || 'Failed to update status.');
    }
    setUpdating(null);
  }

  if (!user || (user.role !== 'owner' && user.role !== 'staff')) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-danger mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Access restricted</h1>
      </div>
    );
  }

  const filteredBookings = filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus);
  const isSuspended = tenant?.status === 'suspended';

  return (
    <div className="space-y-10">

      {/* Suspension warning */}
      {isSuspended && (
        <div className="p-4 rounded-md bg-danger-soft border border-danger flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger">Account suspended — status updates disabled</p>
            <p className="text-xs text-danger mt-0.5">Your business is suspended. Contact the platform admin to reactivate.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="label-mono">Tenant workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink flex items-center gap-2">
          <Calendar className="w-6 h-6 text-accent" />
          Booking manager
        </h1>
        <p className="text-sm text-muted mt-2">{tenant?.name} — {bookings.length} total bookings</p>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-x-7 gap-y-3 flex-wrap border-y border-rule py-4">
        {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`font-mono text-[11px] uppercase tracking-wider border-b-2 pb-0.5 transition-colors ${
              filterStatus === status
                ? 'text-accent border-accent font-semibold'
                : 'text-muted border-transparent hover:text-ink'
            }`}
          >
            {status === 'all' ? `All (${bookings.length})` : `${status} (${bookings.filter(b => b.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Bookings */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(n => <div key={n} className="skeleton h-32" />)}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-rule rounded-lg py-16 text-center bg-paper-2 space-y-3">
          <Inbox className="w-10 h-10 text-neutral mx-auto mb-3" />
          <p className="font-display text-xl text-ink">
            No {filterStatus !== 'all' ? filterStatus : ''} bookings found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => {
            const nextStatuses = STATUS_FLOW[booking.status];
            return (
              <div key={booking.id} className="border border-rule rounded-lg p-5 bg-paper-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

                  <div className="md:col-span-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CarIcon className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="font-display text-base font-semibold text-ink">
                        {booking.carDetails.year} {booking.carDetails.make} {booking.carDetails.model}
                      </span>
                    </div>
                    <div className="label-mono text-[10px] ml-6">{booking.carDetails.registrationNo}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted ml-6 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-neutral" />
                      {booking.startDate} <span className="text-neutral">→</span> {booking.endDate}
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral flex-shrink-0" />
                      <span className="text-sm font-medium text-ink">{booking.customerName}</span>
                    </div>
                    <div className="text-[11px] text-muted ml-6">{booking.customerEmail}</div>
                    <div className="text-sm font-semibold text-ink ml-6">
                      <span className="font-mono text-accent num">Rs {booking.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col items-start md:items-end gap-3">
                    <span className={`badge badge-${booking.status}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>

                    {!isSuspended && nextStatuses.length > 0 && (
                      <div className="flex gap-2 flex-wrap justify-end">
                        {nextStatuses.map(ns => (
                          <button
                            key={ns}
                            disabled={updating === booking.id}
                            onClick={() => handleStatusUpdate(booking, ns)}
                            className={ns === 'cancelled' ? 'btn btn-danger px-3 py-1.5 text-xs' : 'btn btn-secondary px-3 py-1.5 text-xs'}
                          >
                            {updating === booking.id ? '…' : `→ ${STATUS_LABELS[ns]}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
