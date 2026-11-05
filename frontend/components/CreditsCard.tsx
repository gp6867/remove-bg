'use client';

import { useAuth } from '@/lib/AuthContext';

export default function CreditsCard() {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl px-4 py-2 text-white">
      <p className="text-xs opacity-80">Available Credits</p>
      <p className="text-2xl font-bold">{user?.credits || 0}</p>
    </div>
  );
}
