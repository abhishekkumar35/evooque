import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from './FileUpload';
import { FileService } from '@/lib/file/file-service';
import { FileTransferButton } from './FileTransferButton';
import { FileTransferProgress } from './FileTransferProgress';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  peerId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  peerId,
  onSendMessage,
  disabled,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const buffer = await FileService.shareFile(file);
      onSendFile({
        name: file.name,
        size: file.size,
        type: file.type,
        data: buffer,
      });
    } catch (error) {
      console.error('Failed to share file:', error);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <FileTransferProgress peerId={peerId} />
      <div className="flex items-end gap-2 border-t border-dark-100 bg-dark-200 p-4">
        <FileTransferButton peerId={peerId} />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 resize-none rounded-lg bg-dark-100 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-[42px] w-[42px]"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
} 