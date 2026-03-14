'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sophie M.',
    role: 'Urban Gardener',
    avatar: 'S',
    color: 'bg-pink-500',
    text: 'This app turned my tiny balcony into a vegetable paradise! The 3D view is adorable and Sprout always knows what to plant next.',
    stars: 5,
  },
  {
    name: 'Thomas K.',
    role: 'Hobby Farmer',
    avatar: 'T',
    color: 'bg-blue-500',
    text: 'The companion planting feature saved my tomatoes. I had no idea marigolds were such good neighbors! My harvest doubled.',
    stars: 5,
  },
  {
    name: 'Emma L.',
    role: 'First-time Gardener',
    avatar: 'E',
    color: 'bg-amber-500',
    text: 'I was scared to start gardening but Sprout made it feel like a game. Setting up my garden was as fun as playing Animal Crossing!',
    stars: 5,
  },
  {
    name: 'Marcus D.',
    role: 'Community Garden Leader',
    avatar: 'M',
    color: 'bg-emerald-500',
    text: 'We use GardenSaas to plan our community plots. The AI advisor is like having a master gardener on speed dial. Worth every cent.',
    stars: 5,
  },
  {
    name: 'Jade P.',
    role: 'Permaculture Enthusiast',
    avatar: 'J',
    color: 'bg-purple-500',
    text: 'Finally an app that understands soil types! The planting calendar adjusted perfectly to my Mediterranean climate. Total game changer.',
    stars: 5,
  },
  {
    name: 'Oliver W.',
    role: 'Allotment Owner',
    avatar: 'O',
    color: 'bg-cyan-500',
    text: 'The daily quests keep me motivated. I logged in every day for 3 months straight. My plants have never looked healthier!',
    stars: 5,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#0D1F17] to-[#0a1a10]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-900/40 border border-green-800/30 text-green-400 text-sm font-medium mb-4">
            Gardener Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-4">
            Loved by 10,000+ Gardeners
          </h2>
          <p className="text-green-200/60 text-lg max-w-2xl mx-auto">
            Join a growing community of gardeners who plan smarter and harvest more.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={itemVariants}>
              <div className="rounded-2xl bg-[#142A1E] border border-green-900/40 p-6 h-full transition-all duration-300 hover:border-green-700/60 hover:shadow-lg hover:shadow-green-900/20 hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-green-50 font-medium text-sm">{t.name}</div>
                    <div className="text-green-500/50 text-xs">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-green-200/70 text-sm leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
