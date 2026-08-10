'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchAllTenants, updateTenantStatus } from '@/lib/services/tenants';
import { fetchTenantCars, fetchAllCars, createCar, deleteCar } from '@/lib/services/cars';
import { fetchTenantBookings, fetchAllBookings } from '@/lib/services/bookings';
import { Tenant, Car, CarCategory, CarStatus, Booking, BookingStatus } from '@/types';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Building2,
  Car as CarIcon,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Ban,
  Shield,
  MapPin,
  Phone,
  Plus,
  Trash2,
  X,
  Save,
  User,
  Inbox,
  AlertTriangle
} from 'lucide-react';

interface TenantStats {
  totalCars: number;
  totalBookings: number;
  activeBookings: number;
}

const CAR_CATEGORIES: CarCategory[] = ['Economy', 'Sedan', 'SUV', 'Luxury', 'Sports', 'Van'];
const CAR_STATUSES: CarStatus[] = ['available', 'rented', 'maintenance', 'inactive'];
const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'] as const;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=60';

const DEFAULT_CAR_FORM = {
  tenantId: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  registrationNo: '',
  category: 'Sedan' as CarCategory,
  pricePerDay: 60,
  imageUrl: '',
  status: 'available' as CarStatus,
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantStats, setTenantStats] = useState<Record<string, TenantStats>>({});
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Orders filter
  const [orderFilter, setOrderFilter] = useState<BookingStatus | 'all'>('all');

  // Add vehicle modal
  const [showCarForm, setShowCarForm] = useState(false);
  const [savingCar, setSavingCar] = useState(false);
  const [carForm, setCarForm] = useState(DEFAULT_CAR_FORM);

  // Two-step remove confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const fetchedTenants = await fetchAllTenants();
    setTenants(fetchedTenants);

    // Load stats for each tenant
    const stats: Record<string, TenantStats> = {};
    await Promise.all(
      fetchedTenants.map(async (tenant) => {
        const [cars, bookings] = await Promise.all([
          fetchTenantCars(tenant.id),
          fetchTenantBookings(tenant.id)
        ]);
        stats[tenant.id] = {
          totalCars: cars.length,
          totalBookings: bookings.length,
          activeBookings: bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length,
        };
      })
    );
    setTenantStats(stats);

    // Global orders + fleet registry
    const [bookings, cars] = await Promise.all([fetchAllBookings(), fetchAllCars()]);
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setAllBookings(bookings);
    setAllCars(cars);

    setLoading(false);
  }

  async function handleToggleStatus(tenant: Tenant) {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    setToggling(tenant.id);
    await updateTenantStatus(tenant.id, newStatus);
    toast.success(`"${tenant.name}" has been ${newStatus === 'active' ? 'reactivated' : 'suspended'}.`);
    await loadData();
    setToggling(null);
  }

  function openAddCarForm() {
    setCarForm({ ...DEFAULT_CAR_FORM, tenantId: tenants[0]?.id || '' });
    setShowCarForm(true);
  }

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault();
    if (!carForm.tenantId) {
      toast.error('Select a rental company for this vehicle.');
      return;
    }
    setSavingCar(true);
    const tenant = tenants.find(t => t.id === carForm.tenantId);
    await createCar({ ...carForm, tenantId: carForm.tenantId, tenantName: tenant?.name || '' });
    toast.success('Vehicle added to the fleet!');
    setShowCarForm(false);
    await loadData();
    setSavingCar(false);
  }

  function handleRemoveClick(carId: string) {
    if (confirmDeleteId === carId) {
      confirmDeleteCar(carId);
    } else {
      setConfirmDeleteId(carId);
      setTimeout(() => {
        setConfirmDeleteId(prev => (prev === carId ? null : prev));
      }, 3200);
    }
  }

  async function confirmDeleteCar(carId: string) {
    const car = allCars.find(c => c.id === carId);
    await deleteCar(carId);
    toast.success(`${car?.make || 'Vehicle'} ${car?.model || ''} removed from the fleet.`);
    setConfirmDeleteId(null);
    await loadData();
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Shield className="w-12 h-12 text-danger mx-auto" />
        <h1 className="font-display text-2xl font-semibold text-ink">Platform admin access only</h1>
        <p className="text-sm text-muted">This page requires Platform Admin privileges.</p>
      </div>
    );
  }

  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;

  const filteredOrders = orderFilter === 'all'
    ? allBookings
    : allBookings.filter(b => b.status === orderFilter);

  const tenantName = (tenantId: string) =>
    tenants.find(t => t.id === tenantId)?.name || '—';

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label-mono">Platform console</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent" />
            Admin dashboard
          </h1>
          <p className="text-sm text-muted mt-2">Orders, the global fleet, and every rental business on Drive Hub</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Rental businesses', value: tenants.length, color: 'text-info' },
          { icon: CheckCircle2, label: 'Active tenants', value: activeTenants, color: 'text-success' },
          { icon: CarIcon, label: 'Total vehicles', value: allCars.length, color: 'text-warn' },
          { icon: Calendar, label: 'Total orders', value: allBookings.length, color: 'text-purple' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="border border-rule rounded-lg p-5 bg-paper-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <p className="label-mono text-[10px]">{stat.label}</p>
              </div>
              <p className="font-display text-3xl font-semibold text-ink num">{loading ? '—' : stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* ---------------- ORDERS ---------------- */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            All orders
          </h2>
          <span className="label-mono">{allBookings.length} total</span>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-x-6 gap-y-2 flex-wrap border-y border-rule py-3.5 mb-6">
          {ORDER_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setOrderFilter(status)}
              className={`font-mono text-[11px] uppercase tracking-wider border-b-2 pb-0.5 transition-colors ${
                orderFilter === status
                  ? 'text-accent border-accent font-semibold'
                  : 'text-muted border-transparent hover:text-ink'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => <div key={n} className="skeleton h-32" />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="border border-rule rounded-lg py-14 text-center bg-paper-2">
            <Inbox className="w-10 h-10 text-neutral mx-auto mb-3" />
            <p className="font-display text-xl text-ink">
              No {orderFilter !== 'all' ? orderFilter : ''} orders found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(booking => (
              <div key={booking.id} className="border border-rule rounded-lg p-5 bg-paper-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

                  {/* Customer */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral flex-shrink-0" />
                      <span className="text-sm font-medium text-ink">{booking.customerName}</span>
                    </div>
                    <div className="text-[11px] text-muted ml-6">{booking.customerEmail}</div>
                    <div className="label-mono text-[9px] ml-6">{booking.id}</div>
                  </div>

                  {/* Vehicle + dates */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <CarIcon className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="font-display text-base font-semibold text-ink">
                        {booking.carDetails.year} {booking.carDetails.make} {booking.carDetails.model}
                      </span>
                    </div>
                    <div className="label-mono text-[10px] ml-6">{booking.carDetails.registrationNo} · {tenantName(booking.tenantId)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted ml-6 font-mono">
                      <Calendar className="w-3 h-3 text-neutral" />
                      {booking.startDate} <span className="text-neutral">→</span> {booking.endDate}
                    </div>
                  </div>

                  {/* Status + total */}
                  <div className="md:col-span-4 flex flex-col items-start md:items-end gap-2">
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                    <p className="font-mono text-xl font-semibold text-accent num">${booking.totalPrice}</p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- FLEET REGISTRY ---------------- */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
            <CarIcon className="w-5 h-5 text-accent" />
            Fleet registry
          </h2>
          <button onClick={openAddCarForm} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add vehicle
          </button>
        </div>

        {/* Add vehicle modal */}
        {showCarForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4">
            <div role="dialog" aria-modal="true" aria-label="Add vehicle to the fleet" className="bg-paper border border-rule-2 rounded-lg w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold text-ink">Add vehicle to the fleet</h2>
                <button onClick={() => setShowCarForm(false)} className="text-muted hover:text-ink transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCar} className="space-y-4">
                <div>
                  <label htmlFor="admin-car-tenant" className="label-mono text-[10px] block mb-1.5">Rental company</label>
                  <select
                    id="admin-car-tenant"
                    required
                    value={carForm.tenantId}
                    onChange={e => setCarForm({ ...carForm, tenantId: e.target.value })}
                    className="input"
                  >
                    <option value="" disabled>Select a company…</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="admin-car-make" className="label-mono text-[10px] block mb-1.5">Make</label>
                    <input
                      id="admin-car-make"
                      type="text" required value={carForm.make}
                      onChange={e => setCarForm({ ...carForm, make: e.target.value })}
                      placeholder="e.g. BMW" className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-car-model" className="label-mono text-[10px] block mb-1.5">Model</label>
                    <input
                      id="admin-car-model"
                      type="text" required value={carForm.model}
                      onChange={e => setCarForm({ ...carForm, model: e.target.value })}
                      placeholder="e.g. 3 Series" className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="admin-car-year" className="label-mono text-[10px] block mb-1.5">Year</label>
                    <input
                      id="admin-car-year"
                      type="number" required min={2000} max={2030} value={carForm.year}
                      onChange={e => setCarForm({ ...carForm, year: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-car-reg" className="label-mono text-[10px] block mb-1.5">Registration no.</label>
                    <input
                      id="admin-car-reg"
                      type="text" required value={carForm.registrationNo}
                      onChange={e => setCarForm({ ...carForm, registrationNo: e.target.value })}
                      placeholder="e.g. NY-ABC-101" className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="admin-car-category" className="label-mono text-[10px] block mb-1.5">Category</label>
                    <select
                      id="admin-car-category"
                      value={carForm.category}
                      onChange={e => setCarForm({ ...carForm, category: e.target.value as CarCategory })}
                      className="input"
                    >
                      {CAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-car-price" className="label-mono text-[10px] block mb-1.5">Price / day ($)</label>
                    <input
                      id="admin-car-price"
                      type="number" required min={10} value={carForm.pricePerDay}
                      onChange={e => setCarForm({ ...carForm, pricePerDay: parseFloat(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-car-status" className="label-mono text-[10px] block mb-1.5">Status</label>
                  <select
                    id="admin-car-status"
                    value={carForm.status}
                    onChange={e => setCarForm({ ...carForm, status: e.target.value as CarStatus })}
                    className="input"
                  >
                    {CAR_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-car-image" className="label-mono text-[10px] block mb-1.5">Image URL</label>
                  <input
                    id="admin-car-image"
                    type="url" value={carForm.imageUrl}
                    onChange={e => setCarForm({ ...carForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-…" className="input"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={savingCar} className="btn btn-primary flex-1 justify-center">
                    <Save className="w-4 h-4" />
                    {savingCar ? 'Adding…' : 'Add to fleet'}
                  </button>
                  <button type="button" onClick={() => setShowCarForm(false)} className="btn btn-secondary flex-1 justify-center">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4].map(n => <div key={n} className="skeleton h-20" />)}
          </div>
        ) : allCars.length === 0 ? (
          <div className="border border-rule rounded-lg py-14 text-center bg-paper-2">
            <CarIcon className="w-10 h-10 text-neutral mx-auto mb-3" />
            <p className="font-display text-xl text-ink">No vehicles in the fleet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {allCars.map(car => (
              <div key={car.id} className="flex items-center gap-4 border border-rule rounded-lg p-3 bg-paper-2">
                <div className="w-16 h-12 rounded overflow-hidden border border-rule bg-paper-3 shrink-0">
                  <img
                    src={car.imageUrl || FALLBACK_IMAGE}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-display text-base font-semibold text-ink truncate">
                      {car.make} {car.model}
                    </p>
                    <span className={`badge badge-${car.status}`}>{car.status}</span>
                  </div>
                  <p className="label-mono text-[10px] mt-1 truncate">
                    {tenantName(car.tenantId)} · {car.category} · {car.registrationNo}
                  </p>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <p className="font-mono text-lg font-semibold text-accent num">${car.pricePerDay}</p>
                  <p className="label-mono text-[9px]">/ day</p>
                </div>

                <button
                  onClick={() => handleRemoveClick(car.id)}
                  className={confirmDeleteId === car.id ? 'btn btn-danger px-3 py-1.5 text-xs shrink-0' : 'btn btn-secondary px-3 py-1.5 text-xs shrink-0'}
                  title={confirmDeleteId === car.id ? 'Click again to confirm removal' : 'Remove vehicle'}
                >
                  {confirmDeleteId === car.id ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Confirm
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- RENTAL BUSINESSES ---------------- */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            Rental businesses
          </h2>
          {suspendedTenants > 0 && (
            <span className="badge badge-suspended">{suspendedTenants} suspended</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => <div key={n} className="skeleton h-32" />)}
          </div>
        ) : tenants.length === 0 ? (
          <div className="border border-rule rounded-lg py-16 text-center bg-paper-2">
            <Building2 className="w-10 h-10 text-neutral mx-auto mb-3" />
            <p className="font-display text-xl text-ink">No rental businesses registered yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tenants.map(tenant => {
              const stats = tenantStats[tenant.id] || { totalCars: 0, totalBookings: 0, activeBookings: 0 };
              const isActive = tenant.status === 'active';

              return (
                <div key={tenant.id} className={`border rounded-lg p-5 bg-paper-2 ${isActive ? 'border-rule' : 'border-danger'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

                    <div className="md:col-span-5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-ink">{tenant.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted mt-1.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral" />
                              {tenant.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-neutral" />
                              {tenant.phone}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral mt-1">{tenant.address}</p>
                        </div>

                        <span className={`badge ${isActive ? 'badge-available' : 'badge-suspended'}`}>
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-4 grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-paper border border-rule rounded-md">
                        <CarIcon className="w-4 h-4 text-info mx-auto mb-1" />
                        <p className="font-display text-lg font-semibold text-ink num">{stats.totalCars}</p>
                        <p className="label-mono text-[9px]">Vehicles</p>
                      </div>
                      <div className="text-center p-3 bg-paper border border-rule rounded-md">
                        <Calendar className="w-4 h-4 text-warn mx-auto mb-1" />
                        <p className="font-display text-lg font-semibold text-ink num">{stats.totalBookings}</p>
                        <p className="label-mono text-[9px]">Orders</p>
                      </div>
                      <div className="text-center p-3 bg-paper border border-rule rounded-md">
                        <CheckCircle2 className="w-4 h-4 text-success mx-auto mb-1" />
                        <p className="font-display text-lg font-semibold text-ink num">{stats.activeBookings}</p>
                        <p className="label-mono text-[9px]">Active</p>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex items-center md:justify-end">
                      <button
                        disabled={toggling === tenant.id}
                        onClick={() => handleToggleStatus(tenant)}
                        className={`btn ${isActive ? 'btn-danger' : 'btn-secondary'} px-4 py-2 text-xs`}
                      >
                        {toggling === tenant.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isActive ? (
                          <Ban className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {toggling === tenant.id ? 'Updating…' : isActive ? 'Suspend tenant' : 'Reactivate tenant'}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Security note */}
      <div className="border border-rule rounded-lg p-5 bg-paper-2 flex items-start gap-3">
        <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted leading-relaxed">
          <span className="text-ink font-semibold">Security note:</span> Tenant suspension is enforced at both the UI layer and Firestore security rules. Suspended tenants cannot create or modify listings or bookings — even by bypassing the UI. Only a Platform Admin can delete vehicles or view every order in the system.
        </div>
      </div>

    </div>
  );
}
