import { Button } from '@/components/ui/button';
import { FaChevronDown } from 'react-icons/fa';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useChannelId } from '@/hooks/use-channel-id';
import { useUpdateChannel } from '@/features/channels/use-update-channel';
import { toast } from 'sonner';
import { useRemoveChannel } from '@/features/channels/use-remove-channel';
import { useConfirm } from '@/hooks/use-confirm';
import { useRouter } from 'next/navigation';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { useCurrentMember } from '@/features/members/use-current-member';
import { Avatar } from '@radix-ui/react-avatar';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Props = {
  memberName?: string;
  memberImage?: string;
  onClick?: () => void;
};

export const Header = ({
  memberName = 'Member',
  memberImage,
  onClick,
}: Props) => {
  const avatarFallback = memberName.charAt(0).toUpperCase();

  return (
    <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden w-full">
      <Button
        variant={'ghost'}
        className="text-lg font-semibold px-2 overflow-hidden w-auto"
        size="sm"
        onClick={onClick}
      >
        <Avatar className="size-6 mr-2">
          <AvatarImage src={memberImage} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <span className="truncate">{memberName}</span>
        <FaChevronDown className="size-2.5 ml-2"/>
      </Button>
    </div>
  );
};
