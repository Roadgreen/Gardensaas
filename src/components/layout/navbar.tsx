'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Menu, X, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/plants', label: 'Plants' },
  { href: '/garden/dashboard', label: 'My Garden' },
  { href: '/garden/3d', label: '3D View' },
  { href: '/pricing', label: 'Pricing' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1F17]/90 backdrop-blur-md border-b border-green-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Sprout className="w-7 h-7 text-green-400 group-hover:text-green-300 transition-colors" />
            <span className="text-lg font-bold text-green-50">GardenSaas</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-green-300 bg-green-900/40'
                      : 'text-green-300/60 hover:text-green-200 hover:bg-green-900/20'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA / User menu */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link href="/garden/settings">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {session.user?.name || 'Account'}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="gap-2 text-green-400/60 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Start Free</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-green-300 hover:text-green-100 transition-colors cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-green-900/30 bg-[#0D1F17]/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-green-300 bg-green-900/40'
                        : 'text-green-300/60 hover:text-green-200 hover:bg-green-900/20'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 flex gap-3">
                {session ? (
                  <>
                    <Link href="/garden/settings" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Account</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { signOut({ callbackUrl: '/' }); setIsOpen(false); }}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/auth/register" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="w-full">Start Free</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
