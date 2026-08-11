'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LogIn,
  Mail,
  Lock,
  ShieldAlert,
  Building2,
  UserCheck,
  KeyRound
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, switchDemoUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const testAccounts = [
    { name: 'Platform Admin', email: 'admin@carhub.com', role: 'admin', icon: ShieldAlert },
    { name: 'Imran Sheikh (RideKarachi)', email: 'owner@ridekarachi.com', role: 'owner', icon: Building2 },
    { name: 'Ayesha Malik (Lahore Auto Hire)', email: 'owner@lahoreautohire.com', role: 'owner', icon: Building2 },
    { name: 'Bilal Ahmed (Capital Wheels)', email: 'owner@capitalwheels.pk', role: 'owner', icon: Building2 },
    { name: 'Ali Raza (Customer)', email: 'ali.raza@gmail.com', role: 'customer', icon: UserCheck },
    { name: 'Ayesha Khan (Customer)', email: 'ayesha.khan@gmail.com', role: 'customer', icon: UserCheck },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
    } catch (err) {
      // toast shown in context
    }
    setLoading(false);
  }

  function handleQuickLogin(accountEmail: string, role: string) {
    switchDemoUser(accountEmail);
    if (role === 'admin') router.push('/admin');
    else if (role === 'owner') router.push('/tenant/dashboard');
    else if (role === 'customer') router.push('/customer/bookings');
    else router.push('/');
  }

  return (
    <div className="max-w-md mx-auto py-6 space-y-8">
      <div className="text-center space-y-2">
        <p className="label-mono">Sign in</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Welcome back.
        </h1>
        <p className="text-sm text-muted">Multi-tenant fleet &amp; booking access</p>
      </div>

      {/* Quick evaluator logins */}
      <div className="border border-rule rounded-lg p-5 space-y-3 bg-paper-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-accent" />
          <span className="label-mono">One-click test logins</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {testAccounts.map(acc => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.email}
                onClick={() => handleQuickLogin(acc.email, acc.role)}
                className="w-full px-3 py-2.5 bg-paper hover:bg-paper-3 border border-rule rounded-md text-xs font-medium text-ink flex items-center justify-between transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="truncate">{acc.name}</span>
                </div>
                <span className="text-[10px] text-muted group-hover:text-accent font-mono uppercase tracking-wider shrink-0 ml-2">
                  {acc.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Standard form */}
      <div className="border border-rule-2 rounded-lg p-6 space-y-5 bg-paper-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="label-mono text-[10px] block mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input pl-9"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="label-mono text-[10px] block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-rule text-xs text-muted">
          No account yet?{' '}
          <Link href="/register" className="link-arrow text-xs">
            Register here
          </Link>
        </div>
      </div>

    </div>
  );
}
