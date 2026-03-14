'use client';

import Link from 'next/link';
import { Sprout } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#091510] border-t border-green-900/30 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="w-6 h-6 text-green-400" />
              <span className="text-lg font-bold text-green-50">GardenSaas</span>
            </div>
            <p className="text-sm text-green-300/50">
              Your smart gardening companion. Plan, grow, and harvest with confidence.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-200 mb-3">Product</h4>
            <div className="space-y-2">
              <Link href="/plants" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Plant Encyclopedia</Link>
              <Link href="/garden/setup" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Garden Planner</Link>
              <Link href="/garden/3d" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">3D View</Link>
              <Link href="/garden/advisor" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">AI Advisor</Link>
              <Link href="/pricing" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-200 mb-3">Resources</h4>
            <div className="space-y-2">
              <Link href="/plants" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Growing Guides</Link>
              <Link href="/garden/planner" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Garden Grid</Link>
              <Link href="/garden/dashboard" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-200 mb-3">Account</h4>
            <div className="space-y-2">
              <Link href="/auth/login" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Sign In</Link>
              <Link href="/auth/register" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Sign Up</Link>
              <Link href="/garden/settings" className="block text-sm text-green-400/60 hover:text-green-300 transition-colors">Billing</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-green-900/30 pt-6 text-center">
          <p className="text-xs text-green-500/40">
            &copy; {new Date().getFullYear()} GardenSaas. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
