'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  UserPlus,
  Building2,
  UserCheck,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  Home
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUpCustomer, signUpOwner } = useAuth();

  const [roleType, setRoleType] = useState<'customer' | 'owner'>('customer');
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Tenant Fields
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (roleType === 'customer') {
        await signUpCustomer(name, email, password);
        router.push('/customer/bookings');
      } else {
        await signUpOwner(name, email, password, companyName, city, address, phone);
        router.push('/tenant/dashboard');
      }
    } catch (err) {
      // toast in context
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto py-6 space-y-8">
      <div className="text-center space-y-2">
        <p className="label-mono">Register</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Join Drive Hub.
        </h1>
        <p className="text-sm text-muted">As a customer, or register your rental company</p>
      </div>

      {/* Role tabs */}
      <div className="grid grid-cols-2 gap-1.5 border border-rule rounded-lg p-1.5 bg-paper-2">
        <button
          type="button"
          onClick={() => setRoleType('customer')}
          className={`btn justify-center py-2.5 text-xs ${roleType === 'customer' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <UserCheck className="w-4 h-4" />
          Customer
        </button>
        <button
          type="button"
          onClick={() => setRoleType('owner')}
          className={`btn justify-center py-2.5 text-xs ${roleType === 'owner' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Building2 className="w-4 h-4" />
          Rental company owner
        </button>
      </div>

      {/* Form */}
      <div className="border border-rule-2 rounded-lg p-6 space-y-5 bg-paper-2">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label htmlFor="reg-name" className="label-mono text-[10px] block mb-1.5">Full name</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="input pl-9"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="label-mono text-[10px] block mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="input pl-9"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="label-mono text-[10px] block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-9"
              />
            </div>
          </div>

          {/* Tenant-specific fields */}
          {roleType === 'owner' && (
            <div className="space-y-4 pt-4 border-t border-rule">
              <p className="label-mono flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-accent" />
                Rental business profile
              </p>

              <div>                  <label htmlFor="reg-company" className="label-mono text-[10px] block mb-1.5">Business / fleet name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-company"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Rentals Inc."
                      className="input pl-9"
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-city" className="label-mono text-[10px] block mb-1.5">City location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chicago"
                      className="input pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-phone" className="label-mono text-[10px] block mb-1.5">Contact phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="input pl-9"
                    />
                  </div>
                </div>
              </div>

              <div>                  <label htmlFor="reg-address" className="label-mono text-[10px] block mb-1.5">Street address</label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St, Suite 100"
                      className="input pl-9"
                    />
                  </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            <UserPlus className="w-4 h-4" />
            {loading
              ? 'Creating account…'
              : roleType === 'customer'
                ? 'Register customer account'
                : 'Register rental business'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-rule text-xs text-muted">
          Already have an account?{' '}
          <Link href="/login" className="link-arrow text-xs">
            Sign in here
          </Link>
        </div>
      </div>

    </div>
  );
}
