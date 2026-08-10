import { Car, CarCategory } from '@/types';
import { db, isFirebaseConfigured } from '../firebase';import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getLocalCars, saveLocalCar, deleteLocalCar, getLocalTenants } from '../storage';

const COLLECTION_CARS = 'cars';

export async function fetchPublicCars(filters?: {
  category?: CarCategory | 'All';
  tenantId?: string;
  city?: string;
}): Promise<Car[]> {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, COLLECTION_CARS), where('status', '==', 'available'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        let cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
        if (filters?.category && filters.category !== 'All') {
          cars = cars.filter(c => c.category === filters.category);
        }
        if (filters?.tenantId) {
          cars = cars.filter(c => c.tenantId === filters.tenantId);
        }
        return cars;
      }
    } catch (err) {
      console.warn("Using local storage fallback for cars", err);
    }
  }

  // Local storage fallback
  const tenants = getLocalTenants();
  const activeTenantIds = new Set(tenants.filter(t => t.status === 'active').map(t => t.id));
  
  let cars = getLocalCars().filter(c => c.status === 'available' && activeTenantIds.has(c.tenantId));

  if (filters?.category && filters.category !== 'All') {
    cars = cars.filter(c => c.category === filters.category);
  }
  if (filters?.tenantId) {
    cars = cars.filter(c => c.tenantId === filters.tenantId);
  }
  if (filters?.city) {
    const matchingTenantIds = new Set(
      tenants.filter(t => t.city.toLowerCase().includes(filters.city!.toLowerCase())).map(t => t.id)
    );
    cars = cars.filter(c => matchingTenantIds.has(c.tenantId));
  }

  return cars;
}

export async function fetchTenantCars(tenantId: string): Promise<Car[]> {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, COLLECTION_CARS), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
      }
    } catch (err) {
      console.warn("Firestore fetch tenant cars fallback:", err);
    }
  }

  return getLocalCars().filter(c => c.tenantId === tenantId);
}

export async function fetchCarById(carId: string): Promise<Car | null> {
  if (isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_CARS, carId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Car;
      }
    } catch (err) {
      console.warn("Firestore fetch car by id fallback:", err);
    }
  }

  const car = getLocalCars().find(c => c.id === carId);
  return car || null;
}

export async function createCar(carData: Omit<Car, 'id' | 'createdAt'>): Promise<Car> {
  const newCar: Car = {
    ...carData,
    id: `car_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_CARS, newCar.id), newCar);
    } catch (err) {
      console.warn("Firestore create car fallback:", err);
    }
  }

  saveLocalCar(newCar);
  return newCar;
}

export async function updateCar(carId: string, updates: Partial<Car>): Promise<void> {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, COLLECTION_CARS, carId), updates);
    } catch (err) {
      console.warn("Firestore update car fallback:", err);
    }
  }

  const existing = await fetchCarById(carId);
  if (existing) {
    saveLocalCar({ ...existing, ...updates });
  }
}

export async function archiveCar(carId: string): Promise<void> {
  await updateCar(carId, { status: 'inactive' });
}

// Fetch ALL cars across the platform (admin only — enforced by Firestore rules)
export async function fetchAllCars(): Promise<Car[]> {
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_CARS));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
      }
    } catch (err) {
      console.warn("Firestore fetch all cars fallback:", err);
    }
  }

  return getLocalCars();
}

// Hard-delete a car from the fleet (admin only)
export async function deleteCar(carId: string): Promise<void> {
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, COLLECTION_CARS, carId));
    } catch (err) {
      console.warn("Firestore delete car fallback:", err);
    }
  }

  deleteLocalCar(carId);
}
