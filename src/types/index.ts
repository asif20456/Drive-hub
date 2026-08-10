export type UserRole = 'admin' | 'owner' | 'staff' | 'customer';

export type TenantStatus = 'active' | 'suspended';

export type CarCategory = 'Economy' | 'Sedan' | 'SUV' | 'Luxury' | 'Sports' | 'Van';

export type CarStatus = 'available' | 'rented' | 'maintenance' | 'inactive';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  status: TenantStatus;
  ownerId: string;
  createdAt: string;
}

export interface Car {
  id: string;
  tenantId: string;
  tenantName?: string;
  make: string;
  model: string;
  year: number;
  registrationNo: string;
  category: CarCategory;
  pricePerDay: number;
  imageUrl: string;
  status: CarStatus;
  createdAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  carId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  carDetails: {
    make: string;
    model: string;
    year: number;
    registrationNo: string;
    imageUrl: string;
    category: CarCategory;
  };
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}
