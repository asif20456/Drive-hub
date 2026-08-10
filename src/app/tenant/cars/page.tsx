'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchTenantCars, createCar, updateCar, archiveCar } from '@/lib/services/cars';
import { fetchTenantById } from '@/lib/services/tenants';
import { Car, CarCategory, CarStatus, Tenant } from '@/types';
import toast from 'react-hot-toast';
import {
  Car as CarIcon,
  Plus,
  Edit2,
  Archive,
  X,
  ShieldAlert,
  AlertTriangle,
  Save
} from 'lucide-react';

const CAR_CATEGORIES: CarCategory[] = ['Economy', 'Sedan', 'SUV', 'Luxury', 'Sports', 'Van'];
const CAR_STATUSES: CarStatus[] = ['available', 'rented', 'maintenance', 'inactive'];

const DEFAULT_FORM = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  registrationNo: '',
  category: 'Sedan' as CarCategory,
  pricePerDay: 60,
  imageUrl: '',
  status: 'available' as CarStatus,
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=60';

export default function TenantCarsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role !== 'owner' && user.role !== 'staff') { router.push('/'); return; }
    if (!user.tenantId) { setLoading(false); return; }
    loadData();
  }, [user]);

  async function loadData() {
    if (!user?.tenantId) return;
    setLoading(true);
    const [fetchedCars, fetchedTenant] = await Promise.all([
      fetchTenantCars(user.tenantId),
      fetchTenantById(user.tenantId)
    ]);
    setCars(fetchedCars);
    setTenant(fetchedTenant);
    setLoading(false);
  }

  function openAddForm() {
    setEditingCar(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEditForm(car: Car) {
    setEditingCar(car);
    setForm({
      make: car.make,
      model: car.model,
      year: car.year,
      registrationNo: car.registrationNo,
      category: car.category,
      pricePerDay: car.pricePerDay,
      imageUrl: car.imageUrl,
      status: car.status,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    if (tenant?.status === 'suspended') {
      toast.error('Your account is suspended. You cannot add or edit cars.');
      return;
    }

    setSaving(true);
    if (editingCar) {
      await updateCar(editingCar.id, form);
      toast.success('Vehicle updated successfully!');
    } else {
      await createCar({ ...form, tenantId: user.tenantId, tenantName: tenant?.name || '' });
      toast.success('Vehicle added to fleet!');
    }
    setShowForm(false);
    await loadData();
    setSaving(false);
  }

  async function handleArchive(car: Car) {
    if (tenant?.status === 'suspended') {
      toast.error('Account suspended. Cannot archive vehicles.');
      return;
    }
    await archiveCar(car.id);
    toast.success(`${car.make} ${car.model} archived.`);
    await loadData();
  }

  if (!user || (user.role !== 'owner' && user.role !== 'staff')) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-danger mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Access restricted</h1>
      </div>
    );
  }

  const isSuspended = tenant?.status === 'suspended';

  return (
    <div className="space-y-10">

      {/* Suspension warning */}
      {isSuspended && (
        <div className="p-4 rounded-md bg-danger-soft border border-danger flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger">Account suspended</p>
            <p className="text-xs text-danger mt-0.5">Your business is suspended. Fleet management is disabled.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label-mono">Fleet workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink flex items-center gap-2">
            <CarIcon className="w-6 h-6 text-accent" />
            Fleet manager
          </h1>
          <p className="text-sm text-muted mt-2">{tenant?.name} — {cars.length} vehicles total</p>
        </div>
        {!isSuspended && (
          <button onClick={openAddForm} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add vehicle
          </button>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4">
          <div className="bg-paper border border-rule-2 rounded-lg w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                {editingCar ? 'Edit vehicle' : 'Add new vehicle'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Make</label>
                  <input type="text" required value={form.make} onChange={e => setForm({...form, make: e.target.value})} placeholder="e.g. BMW" className="input" />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Model</label>
                  <input type="text" required value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. 3 Series" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Year</label>
                  <input type="number" required min={2000} max={2030} value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="input" />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Registration no.</label>
                  <input type="text" required value={form.registrationNo} onChange={e => setForm({...form, registrationNo: e.target.value})} placeholder="e.g. NY-ABC-101" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value as CarCategory})} className="input">
                    {CAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Price / day ($)</label>
                  <input type="number" required min={10} value={form.pricePerDay} onChange={e => setForm({...form, pricePerDay: parseFloat(e.target.value)})} className="input" />
                </div>
              </div>

              <div>
                <label className="label-mono text-[10px] block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as CarStatus})} className="input">
                  {CAR_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>

              <div>
                <label className="label-mono text-[10px] block mb-1.5">Image URL</label>
                <input type="url" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://images.unsplash.com/photo-…" className="input" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1 justify-center">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : editingCar ? 'Update vehicle' : 'Add to fleet'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 justify-center">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cars grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map(n => <div key={n} className="skeleton h-72" />)}
        </div>
      ) : cars.length === 0 ? (
        <div className="border border-rule rounded-lg py-16 text-center bg-paper-2 space-y-3">
          <CarIcon className="w-10 h-10 text-neutral mx-auto mb-3" />
          <p className="font-display text-xl text-ink">No vehicles in your fleet yet</p>
          {!isSuspended && (
            <button onClick={openAddForm} className="btn btn-primary mt-2">
              Add your first vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cars.map(car => (
            <div key={car.id} className="border border-rule rounded-lg overflow-hidden bg-paper-2 flex flex-col">
              <div className="relative h-40 bg-paper-3 overflow-hidden">
                <img
                  src={car.imageUrl || FALLBACK_IMAGE}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
                <div className="absolute top-3 right-3">
                  <span className={`badge badge-${car.status}`}>{car.status}</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="label-mono text-[10px]">{car.year} · {car.category} · {car.registrationNo}</p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">{car.make} {car.model}</h3>
                  <p className="text-sm mt-1">
                    <span className="font-mono text-base font-semibold text-accent num">${car.pricePerDay}</span>
                    <span className="text-xs text-muted">/day</span>
                  </p>
                </div>

                <div className="flex gap-2 pt-3 border-t border-rule">
                  <button
                    onClick={() => openEditForm(car)}
                    disabled={isSuspended}
                    className="btn btn-secondary flex-1 py-2 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {car.status !== 'inactive' && (
                    <button
                      onClick={() => handleArchive(car)}
                      disabled={isSuspended}
                      className="btn btn-danger flex-1 py-2 text-xs"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
