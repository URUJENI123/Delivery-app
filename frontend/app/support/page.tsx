'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { HelpCircle, MessageSquare, Phone, Mail, ChevronDown, ChevronUp, Search, ExternalLink } from 'lucide-react';

const faqs = [
  {
    q: 'How do I create a delivery?',
    a: 'Go to the Send page, enter pickup and drop-off addresses, select the package details, and choose a courier. Confirm the payment to place your order.',
  },
  {
    q: 'How do I track my package?',
    a: 'Enter your tracking code on the Tracking page or tap any active delivery from your Dashboard to see real-time location updates.',
  },
  {
    q: 'How do I cancel a delivery?',
    a: 'You can cancel a delivery before a courier accepts it. Once accepted, contact the courier or support to arrange cancellation.',
  },
  {
    q: 'How does OTP verification work?',
    a: 'When your package is delivered, share the 6-digit OTP with the courier so they can complete the delivery. Never share your OTP before the package is in hand.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept MTN Mobile Money, Airtel Money, and major credit/debit cards. All payments are processed securely.',
  },
  {
    q: 'How do I become a courier?',
    a: 'Download the Delivery Courier app, complete the registration process, verify your documents, and you can start accepting deliveries.',
  },
];

const channels = [
  { icon: MessageSquare, label: 'Live Chat', description: 'Chat with our support team', action: 'Start Chat', href: '#' },
  { icon: Phone, label: 'Call Us', description: 'Mon-Fri 8AM-6PM', action: 'Contact support', href: '#' },
  { icon: Mail, label: 'Email', description: 'We respond within 24 hours', action: 'Contact support', href: '#' },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (q: string) => {
    setOpenFaq(openFaq === q ? null : q);
  };

  const filteredFaqs = faqs.filter(
    (faq) => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <AnimatedHero title="Help & Support" subtitle="Find answers or get in touch with us" fullBleed />

      <div className="max-w-3xl mx-auto px-4 md:px-6">

      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-body-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
        />
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Frequently Asked Questions</h2>
        {filteredFaqs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <HelpCircle size={28} className="text-gray-400 mx-auto mb-3" />
              <p className="font-display text-lg font-bold text-gray-950 mb-1">No results found</p>
              <p className="text-gray-500 text-body-sm">Try a different search term.</p>
            </div>
          </Card>
        ) : (
          <Card className="divide-y divide-gray-150">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.q;
              return (
                <div key={faq.q}>
                  <button
                    onClick={() => toggleFaq(faq.q)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors min-h-[56px]"
                  >
                    <span className="text-body-sm font-semibold text-gray-950 pr-4">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <p className="text-body-sm text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Contact Us</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {channels.map((ch) => {
            const ChIcon = ch.icon;
            return (
              <Card key={ch.label} className="p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <ChIcon size={22} className="text-red-600" />
                </div>
                <h3 className="font-display text-h4 font-bold text-gray-950 mb-1">{ch.label}</h3>
                <p className="text-tiny text-gray-500 mb-3">{ch.description}</p>
                <a
                  href={ch.href}
                  className="inline-flex items-center gap-1 text-btn-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                >
                  {ch.action}
                  <ExternalLink size={14} />
                </a>
              </Card>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
