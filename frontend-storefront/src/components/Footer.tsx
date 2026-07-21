'use client';

import { useState } from 'react';
import Link from 'next/link';

const FOOTER_LINKS = {
  policy: [
    { label: 'Warranty Policy', href: '/' },
    { label: 'Return Policy', href: '/' },
    { label: 'Shipping Policy', href: '/' },
    { label: 'Privacy Policy', href: '/' },
    { label: 'Terms of Service', href: '/' },
  ],
  about: [
    { label: 'About Us', href: '/' },
    { label: 'Development Team', href: '/' },
    { label: 'Careers', href: '/' },
    { label: 'Blog & News', href: '/' },
    { label: 'Register as Seller', href: '/' },
  ],
  contact: [
    { icon: '📍', text: '123 Nguyen Hue, D.1, HCMC' },
    { icon: '📞', text: '1800 0000 (Free)' },
    { icon: '📧', text: 'support@marketplace.com' },
    { icon: '⏰', text: 'Mon – Sun: 8:00 – 22:00' },
  ],
};

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: '/',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '/',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: '/',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: '/',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="overflow-hidden rounded-2xl bg-gray-900 text-gray-300">
      {/* Top CTA band */}
      <div className="bg-primary px-6 py-6 text-center sm:px-10">
        <p className="text-sm font-bold uppercase tracking-widest text-white/80">
          Join our smart shopping community
        </p>
        <h3 className="mt-1 text-2xl font-black text-white sm:text-3xl">
          Get Exclusive Weekly Offers!
        </h3>
      </div>

      {/* Main footer */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-6 py-12 sm:px-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand column */}
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <div>
            <p className="text-xl font-extrabold text-white">🛍️ Marketplace</p>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              A trusted e-commerce platform connecting buyers and sellers nationwide.
            </p>
          </div>
          {/* Social icons */}
          <div className="flex gap-3 mt-2">
            {SOCIAL_LINKS.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                aria-label={social.name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-gray-300 transition-all duration-200 hover:bg-primary hover:text-white"
              >
                {social.icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Policy links */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">
            Policies
          </h4>
          <ul className="flex flex-col gap-2">
            {FOOTER_LINKS.policy.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-400 transition-colors duration-200 hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* About Us */}
        <div className="col-span-1">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">
            About Us
          </h4>
          <ul className="flex flex-col gap-2 mb-6">
            {FOOTER_LINKS.about.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-400 transition-colors duration-200 hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-1 lg:col-span-1">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-widest text-white">
            Subscribe for Offers
          </h4>
          <p className="mb-4 text-sm text-gray-400">
            Enter your email to receive discount codes and early Flash Sale alerts.
          </p>
          {subscribed ? (
            <div className="rounded-xl bg-green-900/40 px-4 py-4 text-center border border-green-700">
              <p className="text-green-400 font-semibold text-sm">✅ Subscribed successfully!</p>
              <p className="mt-1 text-xs text-gray-400">Thank you for joining us.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <input
                type="email"
                id="newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full rounded-xl bg-gray-800 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 ring-1 ring-gray-700 transition-all focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                Subscribe Now
              </button>
            </form>
          )}

          {/* App badges placeholder */}
          <div className="mt-5 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-xs hover:border-gray-500 cursor-pointer transition-colors">
              <span className="text-xl">🍎</span>
              <div>
                <p className="text-gray-500 text-[10px]">Download on</p>
                <p className="font-bold text-white text-xs">App Store</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-xs hover:border-gray-500 cursor-pointer transition-colors">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-gray-500 text-[10px]">Get it on</p>
                <p className="font-bold text-white text-xs">Google Play</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section - Horizontal */}
      <div className="border-t border-gray-800 px-6 py-6 sm:px-10">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {FOOTER_LINKS.contact.map((item) => (
            <div key={item.icon} className="flex items-center gap-2 text-sm text-gray-400">
              <span className="text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-800 px-6 py-5 text-xs text-gray-500 sm:flex-row sm:px-10">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Marketplace TMN. All rights reserved.</p>
        <p>Built with ❤️ using Next.js & NestJS</p>
      </div>
    </footer>
  );
}
