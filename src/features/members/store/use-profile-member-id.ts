import { useQueryState } from 'nuqs';

export const useProfileMemberId = () => {
  // クエリパラメータ指定 ?parentMessageId=<value>
  return useQueryState('profileMemberId');
}
