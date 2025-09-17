'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ChatWindowProps = {
  selfUserId: string;
  peerUserId: string;
  title?: string;
};

type Message = {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
};

export function ChatWindow({ selfUserId, peerUserId, title }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [since, setSince] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canChat = useMemo(() => selfUserId && peerUserId && selfUserId !== peerUserId, [selfUserId, peerUserId]);

  useEffect(() => {
    // reset state when participants change
    setMessages([]);
    setSince(0);
  }, [selfUserId, peerUserId]);

  useEffect(() => {
    if (!canChat) return;
    let cancelled = false;

    async function fetchOnce() {
      try {
        const url = `/api/messages?a=${encodeURIComponent(selfUserId)}&b=${encodeURIComponent(peerUserId)}${since ? `&since=${since}` : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const newMessages: Message[] = data.messages || [];
        if (cancelled) return;
        if (newMessages.length > 0) {
          setMessages(prev => {
            const merged = [...prev, ...newMessages];
            merged.sort((a, b) => a.createdAt - b.createdAt);
            return merged;
          });
          const latest = Math.max(...newMessages.map(m => m.createdAt));
          setSince(latest);
        }
      } catch {
        // ignore
      }
    }

    // initial fetch
    fetchOnce();
    // start polling
    pollRef.current = window.setInterval(fetchOnce, 1000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      cancelled = true;
    };
  }, [canChat, selfUserId, peerUserId, since]);

  useEffect(() => {
    // auto scroll to bottom on new messages
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const text = input;
    setInput('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: selfUserId, toUserId: peerUserId, body: text }),
      });
      if (!res.ok) {
        setInput(text);
      }
    } catch {
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur h-full">
      <CardHeader>
        <CardTitle>{title || 'Chat'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 p-2">
          {!canChat ? (
            <p className="text-gray-500 text-sm">Invalid participants.</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet. Say hello!</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.fromUserId === selfUserId ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-gray-100 text-gray-900'}`}>
                <div>{m.body}</div>
                <div className="text-[10px] opacity-70 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            disabled={!canChat || loading}
          />
          <Button onClick={send} disabled={!canChat || loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChatWindow;



