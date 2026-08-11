'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Booking } from '@/types';
import { fetchBookingById } from '@/lib/services/bookings';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle2,
  Calendar,
  Car,
  Clock,
  ArrowRight,
  LogIn,
  Inbox,
  ShieldCheck
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

export default function BookingConfirmationPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadBooking();
  }, [id]);

  async function loadBooking() {
    setLoading(true);
    const data = await fetchBookingById(id);
    setBooking(data);
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <LogIn className="w-12 h-12 text-neutral mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Sign in required</h1>
        <p className="text-sm text-muted">Please sign in to view this booking confirmation.</p>
        <button
          onClick={() => router.push('/login')}
          className="btn btn-primary mt-2"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="skeleton h-8 w-56 mx-auto" />
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <Inbox className="w-12 h-12 text-neutral mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Booking not found</h1>
        <p className="text-sm text-muted">We couldn&apos;t locate that booking reference.</p>
        <button
          onClick={() => router.push('/customer/bookings')}
          className="btn btn-primary mt-2"
        >
          View my bookings
        </button>
      </div>
    );
  }

  const isOwner = booking.customerId === user.uid;

  // Security: only the booking's owner (or a platform admin) may view it
  if (!isOwner && user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-neutral mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Booking not found</h1>
        <p className="text-sm text-muted">This booking reference doesn&apos;t belong to your account.</p>
        <button
          onClick={() => router.push('/customer/bookings')}
          className="btn btn-primary mt-2"
        >
          View my bookings
        </button>
      </div>
    );
  }

  // Human-friendly date format
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Confirmation header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-soft border border-success">
          <CheckCircle2 className="w-9 h-9 text-success" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
          Booking requested
        </h1>
        <p className="text-sm text-muted max-w-md mx-auto">
          Your request has been received and is pending confirmation from the rental company.
        </p>
      </div>

      {/* Reference strip */}
      <div className="border-y border-rule py-4 flex items-center justify-center gap-3 flex-wrap">
        <span className="label-mono text-[10px]">Reference</span>
        <span className="font-mono text-sm tracking-wider bg-paper-2 border border-rule px-3 py-1.5 rounded-md text-ink">
          {booking.id}
        </span>
        <span className={`badge badge-${booking.status}`}>{booking.status}</span>
      </div>

      {/* Summary card */}
      <div className="border border-rule-2 rounded-lg overflow-hidden bg-paper-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

          {/* Vehicle */}
          <div className="md:col-span-5">
            <div className="h-44 md:h-full w-full overflow-hidden bg-paper-3">
              <img
                src={booking.carDetails.imageUrl}
                alt={`${booking.carDetails.make} ${booking.carDetails.model}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-7 p-6 space-y-5">
            <div>
              <p className="label-mono text-[10px]">{booking.carDetails.year} · {booking.carDetails.category}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                {booking.carDetails.make} {booking.carDetails.model}
              </h2>
              <p className="font-mono text-[11px] text-muted mt-1">{booking.carDetails.registrationNo}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-2 bg-paper border border-rule px-3 py-2 rounded-md w-fit font-mono">
              <Calendar className="w-3.5 h-3.5 text-accent mr-1" />
              {fmt(booking.startDate)}
              <span className="mx-1 text-neutral">→</span>
              {fmt(booking.endDate)}
            </div>

            <div className="space-y-2 border-t border-rule pt-4 text-xs">
              <div className="flex justify-between text-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Requested
                </span>
                <span className="font-mono">
                  {new Date(booking.createdAt).toLocaleString(undefined, {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> Total price
                </span>
                <span className="font-mono text-xl font-semibold text-accent num">Rs {booking.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Next steps */}
      <div className="border border-rule rounded-lg p-5 bg-paper-2 space-y-3">
        <p className="label-mono text-[10px]">What happens next</p>
        <ol className="space-y-2.5 text-sm text-muted">
          <li className="flex items-start gap-3">
            <span className="font-mono text-[11px] text-accent font-semibold mt-0.5">01</span>
            <span>The rental company reviews your request and confirms availability.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-[11px] text-accent font-semibold mt-0.5">02</span>
            <span>You&apos;ll see the status change to <span className="text-ink font-medium">confirmed</span> in My bookings.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-[11px] text-accent font-semibold mt-0.5">03</span>
            <span>Collect the vehicle at pickup — have your booking reference ready.</span>
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push('/customer/bookings')}
          className="btn btn-primary flex-1 justify-center"
        >
          View my bookings
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push('/')}
          className="btn btn-secondary flex-1 justify-center"
        >
          Browse more cars
        </button>
      </div>

      <p className="text-center text-[11px] text-muted flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-accent" />
        A confirmation email is a premium feature — for now, keep this reference handy.
      </p>

    </div>
  );
}
