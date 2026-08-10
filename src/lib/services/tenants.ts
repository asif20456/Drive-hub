import { Tenant, TenantStatus } from '@/types';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getLocalTenants, saveLocalTenant } from '../storage';

const COLLECTION_TENANTS = 'tenants';

export async function fetchAllTenants(): Promise<Tenant[]> {
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_TENANTS));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
      }
    } catch (err) {
      console.warn("Firestore fetch all tenants fallback:", err);
    }
  }

  return getLocalTenants();
}

export async function fetchTenantById(tenantId: string): Promise<Tenant | null> {
  const tenants = await fetchAllTenants();
  return tenants.find(t => t.id === tenantId) || null;
}

export async function createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'status'>): Promise<Tenant> {
  const newTenant: Tenant = {
    ...tenantData,
    id: `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_TENANTS, newTenant.id), newTenant);
    } catch (err) {
      console.warn("Firestore create tenant fallback:", err);
    }
  }

  saveLocalTenant(newTenant);
  return newTenant;
}

export async function updateTenantStatus(tenantId: string, status: TenantStatus): Promise<void> {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, COLLECTION_TENANTS, tenantId), { status });
    } catch (err) {
      console.warn("Firestore update tenant status fallback:", err);
    }
  }

  const tenants = getLocalTenants();
  const tenant = tenants.find(t => t.id === tenantId);
  if (tenant) {
    tenant.status = status;
    saveLocalTenant(tenant);
  }
}
