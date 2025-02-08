import { Message } from '@/types';
import { cn, formatTime } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { MessageReaction } from './MessageReaction';
import { File } from 'lucide-react';
import { FileService } from '@/lib/file/file-service';

interface ChatMessageProps {
  message: Message;
  onReact: (messageId: string, emoji: string) => void;
}

export function ChatMessage({ message, onReact }: ChatMessageProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const isOwnMessage = currentUser?.id === message.sender.id;

  const handleFileDownload = async () => {
    if (message.type === 'file' && message.file) {
      await FileService.saveFile(
        message.file.data,
        message.file.name,
        message.file.type
      );
    }
  };

  return (
    <div
      className={cn(
        'flex w-full gap-2 px-4 py-2',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1 rounded-lg px-4 py-2',
          isOwnMessage
            ? 'bg-primary-600 text-white'
            : 'bg-dark-100 text-gray-200'
        )}
      >
        {!isOwnMessage && (
          <span className="text-sm font-medium text-gray-400">
            {message.sender.name}
          </span>
        )}

        {message.type === 'file' ? (
          <button
            onClick={handleFileDownload}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <File className="h-4 w-4" />
            <span className="text-sm">{message.file?.name}</span>
            <span className="text-xs text-gray-400">
              ({FileService.formatFileSize(message.file?.size || 0)})
            </span>
          </button>
        ) : (
          <p className="break-words">{message.content}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <MessageReaction
            reactions={message.reactions || []}
            currentUserId={currentUser?.id || ''}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
          <span className="text-right text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
} 