import {
  MessageSquare,
  Pencil,
  Smile,
  Trash,
} from 'lucide-react';
import { Button } from './ui/button';
import { Hint } from './hint';
import { EmojiPopover } from './emoji-popover';

type Props = {
  isAuthor: boolean;
  isPending: boolean;
  handleEdit: () => void;
  handleThread: () => void;
  handleDelete: () => void;
  handleReaction: (value: string) => void;
  hideThreadButton?: boolean;
};

export const Toolbar = ({
  isAuthor,
  isPending,
  handleEdit,
  handleThread,
  handleDelete,
  handleReaction,
  hideThreadButton,
}: Props) => {
  return (
    <div className="absolute top-0 right-5">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity border bg-white rounded-md shadow-sm">
        <EmojiPopover
          hint="Add reaction"
          onEmojiSelect={(emoji) => handleReaction(emoji)}
        >
          <Button variant={'ghost'} size={'iconSm'} disabled={isPending}>
            <Smile className="size-4" />
          </Button>
        </EmojiPopover>

        {!hideThreadButton && (
          <Hint label="Reply in thread">
            <Button variant={'ghost'} size={'iconSm'} disabled={isPending}>
              <MessageSquare onClick={handleThread} className="size-4" />
            </Button>
          </Hint>
        )}

        {isAuthor && (
          <>
            <Hint label="Edit message">
              <Button
                onClick={handleEdit}
                variant={'ghost'}
                size={'iconSm'}
                disabled={isPending}
              >
                <Pencil className="size-4" />
              </Button>
            </Hint>
            <Hint label="Delete message">
              <Button
                onClick={handleDelete}
                variant={'ghost'}
                size={'iconSm'}
                disabled={isPending}
              >
                <Trash className="size-4" />
              </Button>
            </Hint>
          </>
        )}
      </div>
    </div>
  );
};
