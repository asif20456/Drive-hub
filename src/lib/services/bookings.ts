import { Booking, BookingStatus } from '@/types';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { getLocalBookings, saveLocalBooking, getLocalTenants } from '../storage';
import { fetchCarById } from './cars';

const COLLECTION_BOOKINGS = 'bookings';

// Helper: Calculate rental days
export function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

// Check booking overlap for a specific car
export async function checkBookingOverlap(
  carId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<{ hasOverlap: boolean; conflictingBooking?: Booking }> {
  let existingBookings: Booking[] = [];

  if (isFirebaseConfigured()) {
    try {
      const q = query(
        collection(db, COLLECTION_BOOKINGS),
        where('carId', '==', carId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        existingBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      } else {
        existingBookings = getLocalBookings().filter(b => b.carId === carId);
      }
    } catch (err) {
      console.warn("Firestore check overlap fallback:", err);
      existingBookings = getLocalBookings().filter(b => b.carId === carId);
    }
  } else {
    existingBookings = getLocalBookings().filter(b => b.carId === carId);
  }

  // Filter only 'confirmed' or 'active' bookings (pending or cancelled do not block dates)
  const activeOrConfirmed = existingBookings.filter(b => 
    (b.status === 'confirmed' || b.status === 'active') &&
    b.id !== excludeBookingId
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

  return { success: true };
}
