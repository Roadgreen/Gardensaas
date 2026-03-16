'use client';

import Link from 'next/link';
import { Sprout } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t py-12 px-6 transition-colors duration-200" style={{ background: 'var(--surface)', borderColor: 'var(--card-border)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-green-50">GardenSaas</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-green-300/50">
              Your smart gardening companion. Plan, grow, and harvest with confidence.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Product</h4>
            <div className="space-y-2.5">
              <Link href="/plants" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Plant Encyclopedia</Link>
              <Link href="/garden/setup" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Garden Planner</Link>
              <Link href="/garden/3d" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">3D View</Link>
              <Link href="/garden/advisor" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">AI Advisor</Link>
              <Link href="/pricing" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Resources</h4>
            <div className="space-y-2.5">
              <Link href="/plants" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Growing Guides</Link>
              <Link href="/garden/planner" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Garden Grid</Link>
              <Link href="/garden/dashboard" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Account</h4>
            <div className="space-y-2.5">
              <Link href="/auth/login" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Sign In</Link>
              <Link href="/auth/register" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Sign Up</Link>
              <Link href="/garden/settings" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Billing</Link>
            </div>
          </div>
        </div>
        <div className="border-t pt-6 text-center" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-xs text-gray-400 dark:text-green-500/40">
            &copy; {new Date().getFullYear()} GardenSaas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
