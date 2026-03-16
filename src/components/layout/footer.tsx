'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sprout, Send, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="border-t py-16 px-6 transition-colors duration-200" style={{ background: 'var(--surface)', borderColor: 'var(--card-border)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand + newsletter */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-green-50">GardenSaas</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-green-300/50 mb-6 max-w-sm">
              Votre compagnon de jardinage intelligent. Planifiez, cultivez et recoltez en toute confiance.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Newsletter du jardinier</h4>
              <p className="text-xs text-gray-400 dark:text-green-500/50 mb-3">
                Recevez chaque semaine des conseils de saison et des astuces de jardinage.
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 min-w-0 rounded-xl bg-white dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40 px-4 py-2.5 text-sm text-gray-900 dark:text-green-50 placeholder-gray-400 dark:placeholder-green-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
                <Button type="submit" size="sm" className="gap-1 px-4">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
              {subscribed && (
                <p className="text-xs text-green-500 mt-2">Merci ! Vous recevrez bientot nos conseils.</p>
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
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-green-900/30 border border-gray-200 dark:border-green-800/30 flex items-center justify-center text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 hover:border-green-300 dark:hover:border-green-600/50 hover:bg-green-50 dark:hover:bg-green-900/50 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Produit</h4>
            <div className="space-y-2.5">
              <Link href="/plants" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Encyclopedie des plantes</Link>
              <Link href="/garden/setup" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Planificateur</Link>
              <Link href="/garden/3d" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Vue 3D</Link>
              <Link href="/garden/advisor" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Conseiller IA</Link>
              <Link href="/pricing" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Tarifs</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Ressources</h4>
            <div className="space-y-2.5">
              <Link href="/plants" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Guides de culture</Link>
              <Link href="/garden/planner" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Grille du jardin</Link>
              <Link href="/garden/dashboard" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Tableau de bord</Link>
              <Link href="/garden/tips" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Conseils jardinage</Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-green-200 mb-3">Compte</h4>
            <div className="space-y-2.5">
              <Link href="/auth/login" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Connexion</Link>
              <Link href="/auth/register" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Inscription</Link>
              <Link href="/garden/settings" className="block text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors">Facturation</Link>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-xs text-gray-400 dark:text-green-500/40">
            &copy; {new Date().getFullYear()} GardenSaas. Tous droits reserves.
          </p>
          <div className="flex gap-6 text-xs text-gray-400 dark:text-green-500/40">
            <a href="#" className="hover:text-green-600 dark:hover:text-green-300 transition-colors">Politique de confidentialite</a>
            <a href="#" className="hover:text-green-600 dark:hover:text-green-300 transition-colors">CGU</a>
            <a href="#" className="hover:text-green-600 dark:hover:text-green-300 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
