import { Booking, BookingStatus } from '@/types';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { getLocalBookings, saveLocalBooking, getLocalTenants } from '../storage';
import { fetchCarById, updateCar } from './cars';

const COLLECTION_BOOKINGS = 'bookings';

// Helper: Calculate rental days
export function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Fetch the confirmed/active bookings that block availability for the given cars.
 *
 * Note: booking docs contain customer PII (name/email), so Firestore rules do not
 * expose them to anonymous readers. Every write in this app also mirrors to
 * localStorage, so the local fallback keeps availability honest in the demo —
 * and the Firestore path is still used whenever the current user can read.
 */
async function fetchBlockingBookings(carIds: string[]): Promise<Booking[]> {
  if (carIds.length === 0) return [];

  if (isFirebaseConfigured()) {
    try {
      const q = query(
        collection(db, COLLECTION_BOOKINGS),
        where('status', 'in', ['confirmed', 'active'])
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        return bookings.filter(b => carIds.includes(b.carId));
      }
    } catch (err) {
      console.warn("Firestore fetch blocking bookings fallback:", err);
    }
  }

  return getLocalBookings().filter(
    b => carIds.includes(b.carId) && (b.status === 'confirmed' || b.status === 'active')
  );
}

/**
 * For each car, the next confirmed/active booking that still blocks the calendar
 * (end date >= today). A null entry means the car is freely available.
 */
export async function fetchUpcomingBookedRanges(
  carIds: string[]
): Promise<Record<string, { startDate: string; endDate: string } | null>> {
  const ranges: Record<string, { startDate: string; endDate: string } | null> = {};
  for (const carId of carIds) ranges[carId] = null;

  const today = new Date().toISOString().split('T')[0];
  const bookings = await fetchBlockingBookings(carIds);

  for (const b of bookings) {
    if (b.endDate < today) continue; // booking already finished
    const current = ranges[b.carId];
    if (!current || b.startDate < current.startDate) {
      ranges[b.carId] = { startDate: b.startDate, endDate: b.endDate };
    }
  }
  return ranges;
}

/**
 * Keep a car's operational status in step with its bookings: a car with an
 * active rental is "rented", otherwise it returns to "available". Cars set to
 * inactive/maintenance by staff are left untouched.
 */
async function syncCarStatusFromBookings(carId: string): Promise<void> {
  const car = await fetchCarById(carId);
  if (!car || car.status === 'inactive' || car.status === 'maintenance') return;

  const blocking = await fetchBlockingBookings([carId]);
  const targetStatus: 'available' | 'rented' = blocking.some(b => b.status === 'active')
    ? 'rented'
    : 'available';

  if (car.status !== targetStatus) {
    await updateCar(carId, { status: targetStatus });
  }
}

// Check booking overlap for a specific car
export async function checkBookingOverlap(
  carId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<{ hasOverlap: boolean; conflictingBooking?: Booking }> {
  // Only 'confirmed' or 'active' bookings block dates (pending/cancelled do not)
  const activeOrConfirmed = (await fetchBlockingBookings([carId])).filter(
    b => b.id !== excludeBookingId
  );

  const reqStart = new Date(startDate).getTime();
  const reqEnd = new Date(endDate).getTime();

  for (const b of activeOrConfirmed) {
    const bStart = new Date(b.startDate).getTime();
    const bEnd = new Date(b.endDate).getTime();

    // Overlap condition: reqStart <= bEnd AND reqEnd >= bStart
    if (reqStart <= bEnd && reqEnd >= bStart) {
      return { hasOverlap: true, conflictingBooking: b };
    }
  }

  return { hasOverlap: false };
}

// Create a new booking
export async function createBooking(params: {
  carId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  // Fetch car details to verify tenant and price per day
  const car = await fetchCarById(params.carId);
  if (!car) {
    return { success: false, error: 'Vehicle not found.' };
  }

  if (car.status !== 'available') {
    return { success: false, error: 'This vehicle is currently not available for rent.' };
  }

  // Verify tenant status is active
  const tenants = getLocalTenants();
  const tenant = tenants.find(t => t.id === car.tenantId);
  if (tenant && tenant.status === 'suspended') {
    return { success: false, error: 'Rental business is currently suspended.' };
  }

  // Verify date range validity
  if (new Date(params.startDate) > new Date(params.endDate)) {
    return { success: false, error: 'Return date must be after or equal to pickup date.' };
  }

  // Overlap check
  const overlapResult = await checkBookingOverlap(params.carId, params.startDate, params.endDate);
  if (overlapResult.hasOverlap) {
    return { 
      success: false, 
      error: `Dates overlap with an existing ${overlapResult.conflictingBooking?.status} booking (${overlapResult.conflictingBooking?.startDate} to ${overlapResult.conflictingBooking?.endDate}).` 
    };
  }

  // Calculate price securely from Firestore/Server Car object
  const rentalDays = calculateRentalDays(params.startDate, params.endDate);
  const totalPrice = rentalDays * car.pricePerDay;

  const newBooking: Booking = {
    id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: car.tenantId,
    carId: car.id,
    customerId: params.customerId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    carDetails: {
      make: car.make,
      model: car.model,
      year: car.year,
      registrationNo: car.registrationNo,
      imageUrl: car.imageUrl,
      category: car.category,
    },
    startDate: params.startDate,
    endDate: params.endDate,
    totalPrice,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_BOOKINGS, newBooking.id), newBooking);
    } catch (err) {
      console.warn("Firestore create booking fallback:", err);
    }
  }

  saveLocalBooking(newBooking);
  return { success: true, booking: newBooking };
}

// Fetch ALL bookings across the platform (admin only — enforced by Firestore rules)
export async function fetchAllBookings(): Promise<Booking[]> {
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_BOOKINGS));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      }
    } catch (err) {
      console.warn("Firestore fetch all bookings fallback:", err);
    }
  }

  return getLocalBookings();
}

// Fetch a single booking by id
export async function fetchBookingById(bookingId: string): Promise<Booking | null> {
  if (isFirebaseConfigured()) {
    try {
      const snap = await getDoc(doc(db, COLLECTION_BOOKINGS, bookingId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Booking;
      }
    } catch (err) {
      console.warn("Firestore fetch booking fallback:", err);
    }
  }
  return getLocalBookings().find(b => b.id === bookingId) || null;
}

// Fetch bookings by tenant
export async function fetchTenantBookings(tenantId: string): Promise<Booking[]> {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, COLLECTION_BOOKINGS), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      }
    } catch (err) {
      console.warn("Firestore fetch tenant bookings fallback:", err);
    }
  }

  return getLocalBookings().filter(b => b.tenantId === tenantId);
}

// Fetch customer's own bookings
export async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, COLLECTION_BOOKINGS), where('customerId', '==', customerId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      }
    } catch (err) {
      console.warn("Firestore fetch customer bookings fallback:", err);
    }
  }

  return getLocalBookings().filter(b => b.customerId === customerId);
}

// Update booking status
export async function updateBookingStatus(
  bookingId: string, 
  newStatus: BookingStatus,
  requestorRole: 'staff' | 'customer' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  const bookings = getLocalBookings();
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found.' };
  }

  // Customer constraints: Customers can only cancel pending or confirmed bookings
  if (requestorRole === 'customer') {
    if (newStatus !== 'cancelled') {
      return { success: false, error: 'Customers can only cancel bookings.' };
    }
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return { success: false, error: 'Cannot cancel an active or completed booking.' };
    }
  }

  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, COLLECTION_BOOKINGS, bookingId), { status: newStatus });
    } catch (err) {
      console.warn("Firestore update booking status fallback:", err);
    }
  }

  booking.status = newStatus;
  saveLocalBooking(booking);

  // Reflect the new state on the vehicle itself (rented while active, else available)
  await syncCarStatusFromBookings(booking.carId);

  return { success: true };
}
