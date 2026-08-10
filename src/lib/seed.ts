import { SEED_USERS, SEED_TENANTS, SEED_CARS, SEED_BOOKINGS } from './seed-data';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function seedFirestoreDatabase() {
  console.log('Seeding Firestore Database...');

  // Seed Users
  for (const user of SEED_USERS) {
    await setDoc(doc(db, 'users', user.uid), user, { merge: true });
  }

  // Seed Tenants
  for (const tenant of SEED_TENANTS) {
    await setDoc(doc(db, 'tenants', tenant.id), tenant, { merge: true });
  }

  // Seed Cars
  for (const car of SEED_CARS) {
    await setDoc(doc(db, 'cars', car.id), car, { merge: true });
  }

  // Seed Bookings
  for (const booking of SEED_BOOKINGS) {
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  }

  console.log('Firestore Database Seeded Successfully!');
}
