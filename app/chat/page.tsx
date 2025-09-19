'use client';

import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const peer = params.get('peer') || '';
  const selfOverride = params.get('self') || '';
  const bookingId = params.get('bookingId') || '';
  const title = params.get('title') || 'Chat';

  const [banner, setBanner] = useState<{ garageName?: string | null; startTime?: number | null } | null>(null);
  const [ownerGarageId, setOwnerGarageId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!bookingId) return;
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        const bk = j.booking;
        if (!bk) return;
        if (!cancelled) {
          setBanner({ garageName: bk.garage?.name || null, startTime: bk.startTime ? new Date(bk.startTime).getTime() : null });
          // Enable image upload when the viewer is the owner of this garage
          if (user?.id && bk.garage?.ownerId === user.id) {
            setOwnerGarageId(bk.garageId);
          }
        }
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [bookingId, user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <ChatWindow selfUserId={selfOverride || user?.id || ''} peerUserId={peer} title={title} banner={banner} ownerGarageId={ownerGarageId} />
        </div>
      </div>
    </div>
  );
}



