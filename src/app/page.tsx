'use client';

import React, { useEffect, useState } from 'react';
import { Car, CarCategory, Tenant } from '@/types';
import { fetchPublicCars } from '@/lib/services/cars';
import { fetchAllTenants } from '@/lib/services/tenants';
import {
  Car as CarIcon,
  MapPin,
  Building2,
  Filter,
  ArrowRight
} from 'lucide-react';

const CATEGORIES: (CarCategory | 'All')[] = ['All', 'Economy', 'Sedan', 'SUV', 'Luxury', 'Sports', 'Van'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<CarCategory | 'All'>('All');
  const [selectedTenant, setSelectedTenant] = useState<string>('All');
  const [searchCity, setSearchCity] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [fetchedCars, fetchedTenants] = await Promise.all([
      fetchPublicCars(),
      fetchAllTenants()
    ]);
    setCars(fetchedCars);
    setTenants(fetchedTenants);
    setLoading(false);
  }

  // Filter cars
  const filteredCars = cars.filter(car => {
    if (selectedCategory !== 'All' && car.category !== selectedCategory) return false;
    if (selectedTenant !== 'All' && car.tenantId !== selectedTenant) return false;
    if (searchCity.trim() !== '') {
      const tenant = tenants.find(t => t.id === car.tenantId);
      if (!tenant || !tenant.city.toLowerCase().includes(searchCity.toLowerCase())) return false;
    }
    return true;
  });

  // Real, honest figures from the live dataset
  const partnerCount = new Set(cars.map(c => c.tenantId)).size;
  const cityCount = new Set(
    cars.map(c => tenants.find(t => t.id === c.tenantId)?.city).filter(Boolean)
  ).size;

  return (
    <div className="space-y-12 sm:space-y-14">

      {/* ---- Catalogue header (editorial) ---- */}
      <section className="pt-2 md:pt-6">
        <p className="label-mono">Drive Hub — verified rental fleets</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-ink leading-[1.04] max-w-2xl">
          Premium cars, ready to drive.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted max-w-xl leading-relaxed">
          Browse verified independent fleets in New York and Los Angeles. Compare live daily
          rates, check availability in real time, and book with confidence.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
          <div className="border-l-2 border-accent pl-4">
            <p className="font-display text-3xl sm:text-4xl font-semibold text-ink num">
              {loading ? '—' : partnerCount}
            </p>
            <p className="label-mono mt-1.5">Rental partners</p>
          </div>
          <div className="border-l border-rule pl-4">
            <p className="font-display text-3xl sm:text-4xl font-semibold text-ink num">
              {loading ? '—' : cars.length}
            </p>
            <p className="label-mono mt-1.5">Vehicles available</p>
          </div>
          <div className="border-l border-rule pl-4">
            <p className="font-display text-3xl sm:text-4xl font-semibold text-ink num">
              {loading ? '—' : cityCount}
            </p>
            <p className="label-mono mt-1.5">Cities served</p>
          </div>
        </div>
      </section>

      {/* ---- Filter strip (printed spec row) ---- */}
      <section className="border-y border-rule py-5">
        <div className="flex flex-col xl:flex-row xl:items-center gap-5">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-accent" />
            <span className="label-mono">Filter fleet</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`font-mono text-[11px] uppercase tracking-wider border-b-2 pb-0.5 transition-colors ${
                  selectedCategory === cat
                    ? 'text-accent border-accent font-semibold'
                    : 'text-muted border-transparent hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search city…"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="input pl-9 w-44"
              />
            </div>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="input w-auto"
            >
              <option value="All">All rental companies</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ---- Fleet catalogue ---- */}
      <section>
        <div className="flex items-baseline justify-between gap-4 mb-7">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">The fleet</h2>
          <span className="label-mono">
            {filteredCars.length} {filteredCars.length === 1 ? 'vehicle' : 'vehicles'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="skeleton h-[26rem]" />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="border border-rule rounded-lg py-20 text-center bg-paper-2">
            <CarIcon className="w-10 h-10 text-neutral mx-auto mb-4" />
            <p className="font-display text-xl text-ink">No cars match your filters</p>
            <p className="text-sm text-muted mt-1.5">Try a different category, city, or rental agency.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map(car => {
              const tenant = tenants.find(t => t.id === car.tenantId);
              return (
                <a
                  key={car.id}
                  href={`/cars/${car.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border border-rule rounded-lg overflow-hidden bg-paper-2 hover:border-rule-2 transition-colors duration-200"
                >
                  <div className="relative h-52 overflow-hidden bg-paper-3">
                    <img
                      src={car.imageUrl}
                      alt={`${car.make} ${car.model}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="badge badge-info">{car.category}</span>
                      <span className="badge badge-available">Available</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="label-mono text-[10px]">
                      {car.year} model · {car.registrationNo}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-ink leading-snug group-hover:text-accent transition-colors">
                      {car.make} {car.model}
                    </h3>
                    <p className="mt-2 text-xs text-muted flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-neutral" />
                      {tenant?.name || car.tenantName || 'Rental agency'}
                      <span className="text-neutral">·</span>
                      <MapPin className="w-3.5 h-3.5 text-neutral" />
                      {tenant?.city || '—'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-rule flex items-center justify-between gap-3">
                      <p className="text-xs text-muted">
                        <span className="font-mono text-xl font-semibold text-accent num">
                          ${car.pricePerDay}
                        </span>{' '}
                        / day
                      </p>
                      <span className="link-arrow text-xs">
                        View car
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
