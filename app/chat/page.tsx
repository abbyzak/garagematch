'use client';

import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const peer = params.get('peer') || '';
  const title = params.get('title') || 'Chat';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <ChatWindow selfUserId={user?.id || ''} peerUserId={peer} title={title} />
        </div>
      </div>
    </div>
  );
}



