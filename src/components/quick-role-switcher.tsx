'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldAlert,
  Building2,
  UserCheck,
  RefreshCw,
  ChevronDown,
  Check,
  KeyRound
} from 'lucide-react';

export function QuickRoleSwitcher() {
  const { user, switchDemoUser, resetDemoData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const testAccounts = [
    {
      name: 'Platform Admin',
      email: 'admin@carhub.com',
      role: 'Platform Admin',
      badgeClass: 'bg-danger-soft text-danger border-danger',
      icon: ShieldAlert,
      desc: 'Global control: suspend/reactivate tenants, view all data'
    },
    {
      name: 'Alex Apex',
      email: 'owner@apexrentals.com',
      role: 'Tenant A Staff (Apex NY)',
      badgeClass: 'bg-info-soft text-info border-info',
      icon: Building2,
      desc: 'Manages Apex fleet & bookings ONLY. Cannot see Metro data.'
    },
    {
      name: 'Maria Metro',
      email: 'owner@metrohire.com',
      role: 'Tenant B Staff (Metro LA)',
      badgeClass: 'bg-warn-soft text-warn border-warn',
      icon: Building2,
      desc: 'Manages Metro fleet & bookings ONLY. Cannot see Apex data.'
    },
    {
      name: 'John Doe',
      email: 'john.customer@gmail.com',
      role: 'Customer 1',
      badgeClass: 'bg-success-soft text-success border-success',
      icon: UserCheck,
      desc: 'Browse cars, book dates, manage personal bookings.'
    },
    {
      name: 'Sarah Smith',
      email: 'sarah.customer@gmail.com',
      role: 'Customer 2',
      badgeClass: 'bg-purple-soft text-purple border-purple',
      icon: UserCheck,
      desc: 'Second customer account to verify customer isolation.'
    },
  ];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider"
        title="Evaluator Quick Role Switcher"
        aria-expanded={isOpen}
      >
        <KeyRound className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline">Role:</span>
        <span className="font-semibold normal-case tracking-normal font-sans text-accent">
          {user ? user.name.split(' ')[0] : 'Guest'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-xl bg-paper border border-rule-2 z-50 p-2">
          <div className="px-3 py-2 border-b border-rule flex items-center justify-between">
            <span className="label-mono">
              Evaluator test persona
            </span>
            <button
              onClick={() => {
                resetDemoData();
                setIsOpen(false);
              }}
              className="flex items-center gap-1 text-[10px] text-muted hover:text-accent font-medium transition-colors"
              title="Reset sample database to default state"
            >
              <RefreshCw className="w-3 h-3" />
              Reset seed data
            </button>
          </div>

          <div className="py-1 space-y-1 max-h-96 overflow-y-auto">
            {testAccounts.map((account) => {
              const Icon = account.icon;
              const isSelected = user?.email.toLowerCase() === account.email.toLowerCase();
              return (
                <button
                  key={account.email}
                  onClick={() => {
                    switchDemoUser(account.email);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-md flex items-start justify-between transition-colors ${
                    isSelected ? 'bg-accent-soft border border-accent' : 'hover:bg-paper-3 border border-transparent'
                  }`}
                >
                  <div className="flex gap-2.5">
                    <Icon className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-ink">{account.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wide ${account.badgeClass}`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 leading-tight">{account.desc}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent flex-shrink-0 ml-1 mt-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-rule mt-1 bg-paper-2 rounded-b-md">
            <p className="text-[10px] text-muted text-center">
              Click any role to test tenant isolation and RBAC.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
