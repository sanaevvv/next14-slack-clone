import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

type Props = {
  children: React.ReactNode;
  hint?: string;
  onEmojiSelect: (value: string) => void;
};

export const EmojiPopover = ({
  children,
  hint = 'Emoji',
  onEmojiSelect,
}: Props) => {
  const [_, setPopoverOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const onSelect = (value: EmojiClickData) => {
    onEmojiSelect(value.emoji); // 絵文字を選択
    setPopoverOpen(false); // 選択後自動で閉じる

    setTimeout(() => {
      setTooltipOpen(false);
    }, 500);
  };

  return (
    <TooltipProvider>
      <Popover onOpenChange={setPopoverOpen}>
        <Tooltip onOpenChange={setTooltipOpen} delayDuration={50}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent className="bg-black text-white border border-white/5">
            <p className="font-medium text-xs">{hint}</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="p-0 w-full border-none shadow-none">
          <EmojiPicker onEmojiClick={onSelect} />
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
