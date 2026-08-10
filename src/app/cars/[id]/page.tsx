'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Car, Tenant } from '@/types';
import { fetchCarById } from '@/lib/services/cars';
import { fetchTenantById } from '@/lib/services/tenants';
import { createBooking, calculateRentalDays, checkBookingOverlap } from '@/lib/services/bookings';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import {
  Car as CarIcon,
  Building2,
  MapPin,
  Calendar as CalendarIcon,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

export default function CarDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Default dates: tomorrow to +3 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStart = tomorrow.toISOString().split('T')[0];

  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 4);
  const defaultEnd = inThreeDays.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [checkingOverlap, setCheckingOverlap] = useState(false);
  const [overlapStatus, setOverlapStatus] = useState<{ hasOverlap: boolean; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadCarDetails();
  }, [id]);

  useEffect(() => {
    if (car && startDate && endDate) {
      verifyDates();
    }
  }, [startDate, endDate, car]);

  async function loadCarDetails() {
    setLoading(true);
    const fetchedCar = await fetchCarById(id);
    if (fetchedCar) {
      setCar(fetchedCar);
      const fetchedTenant = await fetchTenantById(fetchedCar.tenantId);
      setTenant(fetchedTenant);
    }
    setLoading(false);
  }

  async function verifyDates() {
    if (!car) return;
    setCheckingOverlap(true);
    const result = await checkBookingOverlap(car.id, startDate, endDate);
    if (result.hasOverlap) {
      setOverlapStatus({
        hasOverlap: true,
        message: `Selected dates conflict with an existing ${result.conflictingBooking?.status} booking (${result.conflictingBooking?.startDate} to ${result.conflictingBooking?.endDate}).`
      });
    } else {
      setOverlapStatus({
        hasOverlap: false,
        message: 'Dates are available!'
      });
    }
    setCheckingOverlap(false);
  }

  const rentalDays = calculateRentalDays(startDate, endDate);
  const totalPrice = car ? rentalDays * car.pricePerDay : 0;

  async function handleBookNow(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in as a customer to complete your booking.');
      router.push('/login');
      return;
    }

    if (!car) return;
    setSubmitting(true);

    const res = await createBooking({
      carId: car.id,
      customerId: user.uid,
      customerName: user.name,
      customerEmail: user.email,
      startDate,
      endDate,
    });

    if (res.success) {
      toast.success('Booking requested successfully!');
      router.push('/customer/bookings');
    } else {
      toast.error(res.error || 'Failed to create booking.');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-72 sm:h-96" />
        <div className="skeleton h-48" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <CarIcon className="w-12 h-12 text-neutral mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Vehicle not found</h1>
        <p className="text-sm text-muted">The requested car could not be located in our multi-tenant database.</p>
        <button
          onClick={() => router.push('/')}
          className="btn btn-primary mt-2"
        >
          Return to the fleet
        </button>
      </div>
    );
  }

  const specs = [
    { label: 'Year', value: String(car.year) },
    { label: 'Category', value: car.category },
    { label: 'Registration', value: car.registrationNo, mono: true },
    { label: 'Daily rate', value: `$${car.pricePerDay}`, accent: true },
    { label: 'Agency', value: tenant?.name || car.tenantName || 'Rental agency' },
    { label: 'Location', value: tenant ? `${tenant.city} — ${tenant.address}` : '—' },
    { label: 'Status', value: car.status, mono: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="link-arrow text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to the fleet
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT — vehicle */}
        <div className="lg:col-span-7 space-y-8">

          {/* Photograph */}
          <figure className="relative overflow-hidden rounded-lg border border-rule bg-paper-2">
            <div className="h-72 sm:h-96 w-full overflow-hidden bg-paper-3">
              <img
                src={car.imageUrl}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
            </div>
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="badge badge-info">{car.category}</span>
              <span className={`badge badge-${car.status === 'available' ? 'available' : car.status === 'rented' ? 'rented' : car.status === 'maintenance' ? 'maintenance' : 'inactive'}`}>
                {car.status}
              </span>
            </div>
            <figcaption className="px-5 py-3 flex items-center justify-between gap-3 border-t border-rule">
              <span className="label-mono">{car.year} model</span>
              <span className="label-mono">Reg: {car.registrationNo}</span>
            </figcaption>
          </figure>

          {/* Title */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink leading-tight">
              {car.make} {car.model}
            </h1>
            <p className="mt-3 text-base text-muted max-w-xl leading-relaxed">
              {car.year} {car.make} {car.model} from {tenant?.name || car.tenantName || 'a verified rental agency'}.
              Priced at ${car.pricePerDay} per day, available to book with live conflict detection.
            </p>
          </div>

          {/* Tenant banner */}
          <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-ink text-paper flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{tenant?.name || car.tenantName || 'Rental company'}</p>
                <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {tenant?.address}, {tenant?.city}
                </p>
              </div>
            </div>
            <span className={`badge ${tenant?.status === 'active' ? 'badge-available' : 'badge-suspended'}`}>
              {tenant?.status === 'active' ? 'Active partner' : 'Suspended'}
            </span>
          </div>

          {/* Spec sheet */}
          <div className="border border-rule rounded-lg overflow-hidden bg-paper-2">
            <p className="label-mono px-5 pt-4 pb-2">Specifications</p>
            <dl className="divide-y divide-rule border-t border-rule">
              {specs.map(spec => (
                <div key={spec.label} className="px-5 py-3 flex items-center justify-between gap-4">
                  <dt className="label-mono text-[10px]">{spec.label}</dt>
                  <dd className={`text-sm text-right ${spec.mono ? 'font-mono text-[13px] tracking-wide' : ''} ${spec.accent ? 'font-mono font-semibold text-accent num text-base' : 'text-ink font-medium'}`}>
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

        </div>

        {/* RIGHT — rate card / booking form */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32 border border-rule-2 rounded-lg bg-paper-2 p-6 space-y-6">

            <div className="flex items-center justify-between border-b border-rule pb-4">
              <div>
                <span className="font-mono text-3xl font-semibold text-accent num">${car.pricePerDay}</span>
                <span className="text-xs text-muted"> / day</span>
              </div>
              <span className="label-mono text-[10px]">Instant price calc</span>
            </div>

            <form onSubmit={handleBookNow} className="space-y-5">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pickup-date" className="label-mono text-[10px] mb-1.5 block flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                    Pickup date
                  </label>
                  <input
                    id="pickup-date"
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="return-date" className="label-mono text-[10px] mb-1.5 block flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                    Return date
                  </label>
                  <input
                    id="return-date"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="input"
                  />
                </div>
              </div>

              {/* Conflict status */}
              {overlapStatus && (
                <div className={`text-xs flex items-start gap-2.5 border rounded-md px-3 py-2.5 ${
                  overlapStatus.hasOverlap
                    ? 'bg-danger-soft text-danger border-danger'
                    : 'bg-success-soft text-success border-success'
                }`}>
                  {overlapStatus.hasOverlap ? (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{overlapStatus.message}</span>
                </div>
              )}

              {/* Price summary */}
              <div className="border border-rule rounded-md p-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Daily rate</span>
                  <span className="font-mono num">${car.pricePerDay}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Duration</span>
                  <span className="font-mono num">{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-rule">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="font-mono text-xl font-semibold text-accent num">${totalPrice}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || checkingOverlap || overlapStatus?.hasOverlap || tenant?.status === 'suspended'}
                className="btn btn-accent w-full py-3"
              >
                {submitting
                  ? 'Creating booking…'
                  : overlapStatus?.hasOverlap
                    ? 'Dates unavailable'
                    : 'Confirm & request booking'}
              </button>

            </form>

            <p className="pt-2 border-t border-rule text-[11px] text-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <span>Pricing is calculated from the vehicle record, not the browser. Confirmed and active bookings block overlapping dates.</span>
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}
