import { UserProfile, Tenant, Car, Booking } from '@/types';
import { SEED_USERS, SEED_TENANTS, SEED_CARS, SEED_BOOKINGS } from './seed-data';

const STORAGE_KEYS = {
  USERS: 'carhub_users',
  TENANTS: 'carhub_tenants',
  CARS: 'carhub_cars',
  BOOKINGS: 'carhub_bookings',
  CURRENT_USER: 'carhub_current_user',
  SEEDED: 'carhub_is_seeded',
};

// Bump this whenever SEED_* data changes so browsers refresh the demo dataset.
// Note: re-seeding intentionally resets the demo dataset (same as the "Reset seed data" button).
const SEED_VERSION = 'v6';

// Initialize seed data if empty (or the seed dataset version changed)
export function initStorageSeed(force = false) {
  if (typeof window === 'undefined') return;

  const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
  if (!isSeeded || isSeeded !== SEED_VERSION || force) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(SEED_TENANTS));
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(SEED_CARS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.SEEDED, SEED_VERSION);
  }
}

// User Profile Storage
export function getLocalUsers(): UserProfile[] {
  if (typeof window === 'undefined') return SEED_USERS;
  initStorageSeed();
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : SEED_USERS;
}

export function saveLocalUser(user: UserProfile) {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.uid === user.uid);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Tenant Storage
export function getLocalTenants(): Tenant[] {
  if (typeof window === 'undefined') return SEED_TENANTS;
  initStorageSeed();
  const data = localStorage.getItem(STORAGE_KEYS.TENANTS);
  return data ? JSON.parse(data) : SEED_TENANTS;
}

export function saveLocalTenant(tenant: Tenant) {
  const tenants = getLocalTenants();
  const index = tenants.findIndex(t => t.id === tenant.id);
  if (index >= 0) {
    tenants[index] = tenant;
  } else {
    tenants.push(tenant);
  }
  localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
}

// Car Storage
export function getLocalCars(): Car[] {
  if (typeof window === 'undefined') return SEED_CARS;
  initStorageSeed();
  const data = localStorage.getItem(STORAGE_KEYS.CARS);
  return data ? JSON.parse(data) : SEED_CARS;
}

export function saveLocalCar(car: Car) {
  const cars = getLocalCars();
  const index = cars.findIndex(c => c.id === car.id);
  if (index >= 0) {
    cars[index] = car;
  } else {
    cars.push(car);
  }
  localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
}

export function deleteLocalCar(carId: string) {
  const cars = getLocalCars().filter(c => c.id !== carId);
  localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
}

// Booking Storage
export function getLocalBookings(): Booking[] {
  if (typeof window === 'undefined') return SEED_BOOKINGS;
  initStorageSeed();
  const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  return data ? JSON.parse(data) : SEED_BOOKINGS;
}

export function saveLocalBooking(booking: Booking) {
  const bookings = getLocalBookings();
  const index = bookings.findIndex(b => b.id === booking.id);
  if (index >= 0) {
    bookings[index] = booking;
  } else {
    bookings.push(booking);
  }
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}
