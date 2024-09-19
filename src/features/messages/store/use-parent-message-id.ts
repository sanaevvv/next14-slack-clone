import { useQueryState } from 'nuqs';

export const useParentMessageId = () => {
  // 引数にURLクエリパラメータ指定 ?parentMessageId=<value>
  return useQueryState('parentMessageId');
}
