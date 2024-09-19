import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCallback, useMemo, useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import Error from 'next/error';

type RequestType = {
  body: string;
  workspaceId: Id<"workspaces">;
  image?:Id<"_storage">;
  channelId?: Id<"channels">;
  messageId?: Id<"messages">;
  conversationId?: Id<"conversations">;
};
type ResponseType = Id<'messages'> | null;

// ミューテーション実行時のオプション;
type Options = {
  onSuccess?: (data: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
};

export const useCreateMessage = () => {
  const [data, setData] = useState<ResponseType>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    'success' | 'error' | 'settled' | 'pending' | null
  >(null);

  const isPending = useMemo(() => status === 'pending', [status]);
  const isSuccess = useMemo(() => status === 'success', [status]);
  const isError = useMemo(() => status === 'error', [status]);
  const isSettled = useMemo(() => status === 'settled', [status]);

  const mutation = useMutation(api.messages.create);

  const mutate = useCallback(
    async (values: RequestType, options?: Options) => {
      try {
        setData(null);
        setError(null);
        setStatus('pending'); // Pending 状態を設定

        const response = await mutation(values);

        options?.onSuccess?.(response);
      } catch (error) {
        setStatus('error'); // Error 状態を設定
        options?.onError?.(error as Error);

        if (options?.throwError) {
          throw error;
        }
      } finally {
        setStatus('settled'); // Settled 状態を設定
        options?.onSettled?.();
      }
    },
    [mutation],
  );

  return {
    mutate,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    isSettled,
  };
};
