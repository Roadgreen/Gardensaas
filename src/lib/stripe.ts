import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Garden setup & configuration',
      'Plant encyclopedia (150+ plants)',
      'Basic garden planner',
      'Daily gardening tips',
      '1 garden, up to 5 plants',
    ],
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Everything in Free',
      'AI Garden Advisor (10 questions/day)',
      'Advanced 3D garden visualization',
      'Unlimited gardens & plants',
      'Companion planting alerts',
      'Export garden plans',
      'Priority support',
      'Detailed harvest predictions',
    ],
  },
} as const;
