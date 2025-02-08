"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useRoomStore } from "@/store/useRoomStore";
import { useUserStore } from "@/store/useUserStore";
import { useConnectionStore } from "@/store/useConnectionStore";
import { socketClient } from "@/lib/socket/socket-client";
import { RoomLayout } from "@/components/layout/RoomLayout";
import { VideoStream } from "@/components/video/VideoStream";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Loading } from "@/components/ui/loading";
import { VideoGrid } from '@/components/video/VideoGrid';
import { MediaControls } from '@/components/video/MediaControls';
import { FileMessage } from "@/types/index";
import { useToastStore } from '@/components/ui/toast';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const { currentUser, createGuestUser } = useUserStore();
  const { setCurrentRoom, addMessage, messages, setMessages, addReaction, removeReaction } = useRoomStore();
  const { connectionState, localStream, connections } = useConnectionStore();
  const addToast = useToastStore((state) => state.addToast);
  const { localStream: webRTCStream, error, peerService } = useWebRTC(roomId);

  useEffect(() => {
    if (!currentUser) {
      createGuestUser();
    }

    const socket = socketClient.connect();
    
    socket.on('message', ({ message }: { message: Message }) => {
      addMessage(message);
    });

    socket.on('reaction', ({ 
      messageId, 
      emoji, 
      userId, 
      count, 
      users 
    }: { 
      messageId: string; 
      emoji: string; 
      userId: string;
      count: number;
      users: string[];
    }) => {
      addReaction(messageId, { emoji, count, users });
    });

    socket.on('reaction-removed', ({ 
      messageId, 
      emoji, 
      userId 
    }: { 
      messageId: string; 
      emoji: string; 
      userId: string;
    }) => {
      removeReaction(messageId, emoji, userId);
    });

    setCurrentRoom({
      id: roomId,
      participants: [],
      messages: [],
      createdAt: new Date(),
      type: 'video'
    });

    return () => {
      socketClient.disconnect();
    };
  }, [roomId]);

  const handleSendMessage = (content: string) => {
    if (!currentUser) return;
    
    const message = {
      id: uuidv4(),
      content,
      sender: currentUser,
      timestamp: new Date(),
      type: 'text',
      reactions: []
    };

    addMessage(message);
    socketClient.getSocket()?.emit('message', { roomId, message });
  };

  const handleSendFile = async (file: FileMessage) => {
    if (!currentUser) return;

    try {
      const message = {
        id: uuidv4(),
        content: `Shared file: ${file.name}`,
        sender: currentUser,
        timestamp: new Date(),
        type: 'file',
        file,
        reactions: []
      };

      addMessage(message);
      socketClient.getSocket()?.emit('message', { roomId, message });
      handleSuccess('File sent successfully');
    } catch (error) {
      handleError(error as Error);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    socketClient.getSocket()?.emit('reaction', {
      roomId,
      messageId,
      emoji,
      userId: currentUser.id
    });

    // Optimistically update the UI
    setMessages(messages.map(msg => {
      if (msg.id !== messageId) return msg;

      const reactions = msg.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        if (existingReaction.users.includes(currentUser.id)) {
          // Remove user's reaction
          existingReaction.users = existingReaction.users.filter(id => id !== currentUser.id);
          existingReaction.count--;
          if (existingReaction.count === 0) {
            return {
              ...msg,
              reactions: reactions.filter(r => r.emoji !== emoji)
            };
          }
        } else {
          // Add user's reaction
          existingReaction.users.push(currentUser.id);
          existingReaction.count++;
        }
        return { ...msg, reactions };
      }

      // Add new reaction
      return {
        ...msg,
        reactions: [
          ...reactions,
          { emoji, count: 1, users: [currentUser.id] }
        ]
      };
    }));
  };

  const handleLeaveRoom = () => {
    router.push('/');
  };

  const handleScreenShare = async (stream: MediaStream | null) => {
    if (stream) {
      // Add screen share track to all peer connections
      connections.forEach((conn) => {
        const peer = peerService?.getPeer(conn.peerId);
        if (peer) {
          stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
          });
        }
      });

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        connections.forEach((conn) => {
          const peer = peerService?.getPeer(conn.peerId);
          if (peer) {
            stream.getTracks().forEach(track => {
              peer.removeTrack(track, stream);
            });
          }
        });
      };
    }
  };

  const handleError = (error: Error) => {
    addToast({
      type: 'error',
      message: error.message,
      duration: 5000,
    });
  };

  const handleSuccess = (message: string) => {
    addToast({
      type: 'success',
      message,
      duration: 3000,
    });
  };

  if (connectionState === 'connecting') {
    return <Loading className="h-screen" />;
  }

  return (
    <RoomLayout onLeaveRoom={handleLeaveRoom} stream={localStream}>
      <div className="flex flex-1 gap-4 p-4">
        <div className="flex flex-1 flex-col gap-4">
          <VideoGrid
            localStream={localStream}
            connections={connections}
            screenShare={webRTCStream}
            currentUser={currentUser!}
            className="flex-1"
          />
        </div>

        <div className="flex w-96 flex-col rounded-lg bg-dark-100">
          <div className="flex-1 overflow-y-auto">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                onReact={(emoji) => handleReaction(message.id, emoji)}
              />
            ))}
          </div>
          <ChatInput 
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
          />
        </div>
      </div>
      <MediaControls 
        onLeaveCall={handleLeaveRoom}
        onScreenShare={handleScreenShare}
        stream={localStream}
      />
    </RoomLayout>
  );
} 