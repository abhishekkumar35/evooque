"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Copy, Video, MessageSquare } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  const createRoom = (type: 'video' | 'chat') => {
    const id = uuidv4();
    setRoomId(id);
    router.push(`/room/${id}?type=${type}`);
  };

  const copyLink = async () => {
    if (!roomId) return;
    
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-dark-200 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-dark-100 p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Private Chat App</h1>
          <p className="text-gray-400">Create a private room for secure communication</p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => createRoom('video')}
            className="flex items-center justify-center gap-2"
          >
            <Video className="h-5 w-5" />
            Create Video Room
          </Button>

          <Button
            onClick={() => createRoom('chat')}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Create Chat Room
          </Button>
        </div>

        {roomId && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-400">Share this link with others:</p>
            <div className="flex items-center gap-2 rounded-lg bg-dark-200 p-2">
              <code className="flex-1 text-left text-sm text-primary-400">
                {`${window.location.origin}/room/${roomId}`}
              </code>
              <Button
                onClick={copyLink}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-primary-500">Link copied to clipboard!</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
