import { SEED_USERS, SEED_TENANTS, SEED_CARS, SEED_BOOKINGS } from './seed-data';
import { db, isFirebaseConfigured } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function seedFirestoreDatabase() {
  // Safety gate: never hammer the unconfigured demo placeholder with setDoc calls
  // (those hang on network timeouts). Require a real Firebase project id.
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firestore seeding aborted: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set to a real project. ' +
      'Copy .env.example to .env.local and fill in a real Firebase project, then run: npm run seed:firestore'
    );
  }

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

// Run directly: node --env-file=.env.local -e "import('./src/lib/seed.ts').then(m => m.seedFirestoreDatabase())"
// or use the npm script: npm run seed:firestore
