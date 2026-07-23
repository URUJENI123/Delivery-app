'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/signin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-xl bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] mx-auto" />
        <div className="h-4 w-32 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
        <div className="h-3 w-48 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
