import { usePaginatedQuery } from 'convex/react';
import { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';

const BATCH_SIZE = 20;

type Props = {
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
};

// api.messages.get関数が返すオブジェクトのpageプロパティの型;
export type GetMessagesReturnType =
  (typeof api.messages.get._returnType)['page'];

export const useGetMessages = ({
  channelId,
  conversationId,
  parentMessageId,
}: Props) => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.get,
    {
      channelId,
      conversationId,
      parentMessageId,
    },
    { initialNumItems: BATCH_SIZE },
  );
  return {
    results,
    status,
    loadMore: () => loadMore(BATCH_SIZE),
  };
};
