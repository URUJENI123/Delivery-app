'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { AnimatedHero } from '@/components/ui/AnimatedHero';

export default function TrackPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleTrack = () => {
    const trimmed = code.trim();
    if (trimmed) router.push(`/tracking/${trimmed}`);
  };

  return (
    <div>
      <AnimatedHero title="Track Package" subtitle="Enter your tracking code to see real-time updates" />

      <div className="max-w-md mx-auto px-4 pb-8 space-y-6 -mt-8 relative z-10">

      <div className="space-y-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter tracking code"
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          className="w-full h-[52px] border border-gray-200 rounded-lg px-4 bg-white text-body-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
        />
        <Button fullWidth size="lg" disabled={!code.trim()} onClick={handleTrack}>
          Track
        </Button>
      </div>
      </div>
    </div>
  );
}
