'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types';
import { fetchCustomerBookings, updateBookingStatus } from '@/lib/services/bookings';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import {
  Calendar,
  Car,
  XCircle,
  LogIn,
  Inbox
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=60';

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.role !== 'customer') {
      router.push('/');
      return;
    }
    loadBookings();
  }, [user]);

  async function loadBookings() {
    if (!user) return;
    setLoading(true);
    const data = await fetchCustomerBookings(user.uid);
    // Sort newest first
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(data);
    setLoading(false);
  }

  async function handleCancel(bookingId: string) {
    setCancelling(bookingId);
    const result = await updateBookingStatus(bookingId, 'cancelled', 'customer');
    if (result.success) {
      toast.success('Booking cancelled.');
      await loadBookings();
    } else {
      toast.error(result.error || 'Failed to cancel booking.');
    }
    setCancelling(null);
  }

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <LogIn className="w-12 h-12 text-neutral mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Sign in required</h1>
        <p className="text-sm text-muted">Please sign in as a customer to view your bookings.</p>
        <button
          onClick={() => router.push('/login')}
          className="btn btn-primary mt-2"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label-mono">Customer area</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink flex items-center gap-2">
            <Calendar className="w-6 h-6 text-accent" />
            My bookings
          </h1>
          <p className="text-sm text-muted mt-2">Manage your vehicle rental reservations</p>
        </div>
        <button onClick={() => router.push('/')} className="btn btn-primary">
          Browse cars
        </button>
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
            {status === 'all' ? `All (${bookings.length})` : status}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton h-40" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-rule rounded-lg py-16 text-center bg-paper-2 space-y-3">
          <Inbox className="w-10 h-10 text-neutral mx-auto mb-3" />
          <p className="font-display text-xl text-ink">
            {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
          </p>
          <p className="text-xs text-muted">
            {filterStatus === 'all' ? 'Browse the fleet and make your first booking.' : `You have no ${filterStatus} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="border border-rule rounded-lg p-5 bg-paper-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                {/* Car image */}
                <div className="md:col-span-3">
                  <div className="h-28 w-full rounded-md overflow-hidden bg-paper-3 border border-rule">
                    <img
                      src={booking.carDetails.imageUrl}
                      alt={`${booking.carDetails.make} ${booking.carDetails.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                </div>

                {/* Booking info */}
                <div className="md:col-span-6 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {booking.carDetails.year} {booking.carDetails.make} {booking.carDetails.model}
                    </h3>
                    <span className={`badge badge-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-neutral" />
                      {booking.carDetails.category}
                    </span>
                    <span className="font-mono text-[11px]">{booking.carDetails.registrationNo}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-ink-2 bg-paper border border-rule px-3 py-1.5 rounded-md w-fit font-mono">
                    <Calendar className="w-3.5 h-3.5 text-accent mr-1" />
                    {booking.startDate}
                    <span className="mx-1 text-neutral">→</span>
                    {booking.endDate}
                  </div>

                  <p className="text-[10px] text-neutral font-mono">
                    Booking: {booking.id}
                  </p>
                </div>

                {/* Price & actions */}
                <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end">
                  <div className="text-right">
                    <p className="font-mono text-2xl font-semibold text-accent num">${booking.totalPrice}</p>
                    <p className="label-mono text-[10px] mt-1">Total amount</p>
                  </div>

                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      disabled={cancelling === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="btn btn-danger mt-4 px-3 py-1.5 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {cancelling === booking.id ? 'Cancelling…' : 'Cancel booking'}
                    </button>
                  )}

                  {booking.status === 'active' && (
                    <div className="mt-4 px-3 py-1.5 bg-purple-soft text-purple border border-purple rounded-md text-xs">
                      Currently active — cannot cancel
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
