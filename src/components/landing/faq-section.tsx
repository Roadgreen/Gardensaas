'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Quand est-ce que je devrais commencer mon potager ?',
    answer:
      'Le meilleur moment pour commencer depend de votre zone climatique. En general, vous pouvez commencer les semis en interieur des fevrier-mars, et planter en exterieur apres les dernieres gelees (avril-mai en climat tempere). Notre calendrier de plantation adapte automatiquement les dates a votre region.',
  },
  {
    question: 'Combien de temps faut-il consacrer au jardinage chaque jour ?',
    answer:
      "Pour un petit potager (10-20 m2), comptez environ 15-30 minutes par jour pour l'arrosage, le desherbage et l'entretien. GardenSaas optimise votre temps en vous donnant les taches prioritaires chaque jour.",
  },
  {
    question: "Est-ce que l'application fonctionne pour les balcons et petits espaces ?",
    answer:
      'Absolument ! GardenSaas supporte les jardins de toute taille, y compris les balcons et terrasses. Nous recommandons les plantes les plus adaptees a votre espace disponible, avec des varietes naines et des herbes aromatiques ideales pour la culture en pot.',
  },
  {
    question: 'Comment fonctionne la vue 3D du jardin ?',
    answer:
      "La vue 3D vous permet de visualiser votre jardin comme dans un jeu video. Vous pouvez deplacer votre personnage jardinier, voir vos plantes en 3D, et planifier l'agencement de votre potager de maniere ludique et intuitive.",
  },
  {
    question: 'Quelles plantes sont les plus faciles pour un debutant ?',
    answer:
      "Nous recommandons de commencer par des tomates cerises, du basilic, de la laitue, des radis et des courgettes. Ces plantes sont robustes, poussent rapidement et pardonnent les erreurs de debutant. Notre filtre 'difficulte facile' vous aidera a les trouver.",
  },
  {
    question: "Le conseiller IA remplace-t-il un vrai jardinier ?",
    answer:
      "Notre IA est un excellent complement, pas un remplacement ! Elle analyse votre sol, votre climat et vos plantes pour donner des conseils personnalises 24h/24. Pour les cas complexes, elle vous orientera vers des ressources specialisees.",
  },
  {
    question: 'Puis-je utiliser GardenSaas sans connexion internet ?',
    answer:
      "L'encyclopedie des plantes et votre plan de jardin sont accessibles hors ligne une fois charges. Les fonctionnalites comme la meteo en temps reel et le conseiller IA necessitent une connexion internet.",
  },
  {
    question: "Qu'est-ce que le compagnonnage des plantes ?",
    answer:
      "Le compagnonnage est l'art de planter certaines especes cote a cote pour qu'elles s'entraident. Par exemple, le basilic protege les tomates des pucerons, et les carottes repoussent la mouche de l'oignon. GardenSaas vous montre automatiquement les bonnes et mauvaises associations.",
  },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-5 rounded-2xl border border-gray-100 dark:border-green-900/40 bg-white dark:bg-[#142A1E] hover:border-green-200 dark:hover:border-green-700/60 transition-all duration-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-base font-medium text-gray-900 dark:text-green-50 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
            {question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-green-500/60" />
          </motion.div>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-gray-500 dark:text-green-200/60 text-sm leading-relaxed mt-4 pt-4 border-t border-gray-100 dark:border-green-900/30">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0a1a10] dark:to-[#0D1F17]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Questions frequentes
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            Tout ce que vous devez savoir pour bien demarrer votre jardin.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
