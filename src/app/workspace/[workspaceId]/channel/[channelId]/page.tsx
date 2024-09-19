'use client';

import { useGetChannel } from '@/features/channels/use-get-channel';
import { useChannelId } from '@/hooks/use-channel-id';
import { Loader, TriangleAlert } from 'lucide-react';
import { Header } from './header';
import { ChatInput } from './chat-input';
import { useGetMessages } from '@/features/messages/use-get-messages';
import { MessageList } from '@/components/message-list';

const ChannelIdPage = () => {
  const channelId = useChannelId();

  const { results, status, loadMore } = useGetMessages({ channelId });
  console.log(results);

  const { data: channel, isLoading: channelLoading } = useGetChannel({
    id: channelId,
  });

  if (channelLoading || status === 'LoadingFirstPage') {
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!channel) {
    return (
      <div className="h-full flex-1 flex flex-col gap-y-2 items-center justify-center">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Channel not found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[90vh]">
      <Header title={channel.name} />
      <div className="flex-1">
        {JSON.stringify(results)}
        <MessageList
          channelName={channel.name}
          channelCreationTime={channel._creationTime}
          data={results}
          loadMore={loadMore} // 追加のデータの読み込み
          isLoadingMore={status === 'LoadingMore'} // 追加ページを読み込んでいる
          canLoadMore={status === 'CanLoadMore'} // 現在のページのデータが正常に読み込まれ、さらにページがある
        />
      </div>
      <ChatInput placeholder={`Message # ${channel.name}`} />
    </div>
  );
};

export default ChannelIdPage;
