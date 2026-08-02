'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { MapPin, Plus } from 'lucide-react';

export default function AddressBookPage() {
  const [addresses] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <AnimatedHero title="Address Book" subtitle="Your saved addresses" fullBleed />

      <div className="px-4 md:px-6">
        <div className="flex justify-end mb-6">
          <Button variant="primary" className="!h-12 !px-5" disabled>
            <Plus size={18} />
            Add New
          </Button>
        </div>

        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <MapPin size={28} className="text-gray-400" />
            </div>
            <h2 className="font-display text-xl font-extrabold tracking-tight mb-2">No addresses saved</h2>
            <p className="text-gray-500 mb-5">Address book feature coming soon. You can set a default pickup address in your profile.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
