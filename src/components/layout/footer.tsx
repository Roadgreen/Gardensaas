'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sprout, Send, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const t = useTranslations('footer');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="py-16 px-6 transition-colors duration-200" style={{ background: 'var(--surface-container-low)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand + newsletter */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #23422a, #3a5a40)' }}>
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>GardenSaas</span>
            </div>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--outline-variant)' }}>
              {t('tagline')}
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>{t('newsletter')}</h4>
              <p className="text-xs mb-3" style={{ color: 'var(--outline-variant)' }}>
                {t('newsletterDesc')}
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                  style={{
                    background: 'var(--surface-container-lowest)',
                    border: '1px solid rgba(194, 200, 191, 0.2)',
                    color: 'var(--on-surface)',
                  }}
                  required
                />
                <Button type="submit" size="sm" className="gap-1 px-4">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
              {subscribed && (
                <p className="text-xs mt-2" style={{ color: 'var(--primary)' }}>{t('subscribed')}</p>
              )}
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Youtube, href: '#', label: 'YouTube' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'var(--surface-container)',
                    color: 'var(--outline-variant)',
                  }}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>{t('product')}</h4>
            <div className="space-y-2.5">
              {[
                { href: '/plants', label: t('plantEncyclopedia') },
                { href: '/garden/setup', label: t('planner') },
                { href: '/garden/3d', label: t('3dView') },
                { href: '/garden/advisor', label: t('aiAdvisor') },
                { href: '/pricing', label: t('pricingLink') },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm transition-colors" style={{ color: 'var(--outline-variant)' }}>{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>{t('resources')}</h4>
            <div className="space-y-2.5">
              {[
                { href: '/plants', label: t('growingGuides') },
                { href: '/garden/planner', label: t('gardenGrid') },
                { href: '/garden/dashboard', label: t('dashboard') },
                { href: '/garden/tips', label: t('gardenTips') },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm transition-colors" style={{ color: 'var(--outline-variant)' }}>{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>{t('accountSection')}</h4>
            <div className="space-y-2.5">
              {[
                { href: '/auth/login', label: t('login') },
                { href: '/auth/register', label: t('register') },
                { href: '/garden/settings', label: t('billing') },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm transition-colors" style={{ color: 'var(--outline-variant)' }}>{link.label}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--surface-container-high)' }}>
          <p className="text-xs" style={{ color: 'var(--outline-variant)' }}>
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6 text-xs" style={{ color: 'var(--outline-variant)' }}>
            <a href="#" className="transition-colors hover:opacity-80">{t('privacy')}</a>
            <a href="#" className="transition-colors hover:opacity-80">{t('terms')}</a>
            <a href="#" className="transition-colors hover:opacity-80">{t('contact')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
