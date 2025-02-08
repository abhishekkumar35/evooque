import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionProps {
  reactions: Reaction[];
  currentUserId: string;
  onReact: (emoji: string) => void;
  className?: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function MessageReaction({
  reactions,
  currentUserId,
  onReact,
  className,
}: MessageReactionProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setShowPicker(false);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1">
        {reactions.map((reaction) => (
          <Button
            key={reaction.emoji}
            onClick={() => handleReact(reaction.emoji)}
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 gap-1 rounded-full px-2 text-xs',
              reaction.users.includes(currentUserId) &&
                'bg-primary-500/10 text-primary-500'
            )}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </Button>
        ))}
        <Button
          onClick={() => setShowPicker(!showPicker)}
          variant="ghost"
          size="icon"
          className="h-6 w-6"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </div>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-lg bg-dark-100 p-2">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="rounded p-1 text-lg hover:bg-dark-200"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 