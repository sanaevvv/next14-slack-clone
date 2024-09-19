import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query, QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { paginationOptsValidator } from 'convex/server';

// メッセージIDに関連するスレッドの情報を集約し、スレッドの概要（メッセージ数、最後のメッセージの送信者の画像、最後のメッセージのタイムスタンプ）を返す
const populateThread = async (ctx: QueryCtx, messageId: Id<'messages'>) => {
  const messages = await ctx.db
    .query('messages')
    .withIndex('by_parent_message_id', (q) =>
      q.eq('parentMessageId', messageId),
    )
    .collect();

  if (messages.length === 0) {
    return {
      count: 0,
      image: undefined,
      timestamp: 0,
      name:'',
    };
  }

  const lastMessage = messages[messages.length - 1];
  const lastMessageMember = await populateMember(ctx, lastMessage.memberId);

  if (!lastMessageMember) {
    return {
      count: 0,
      image: undefined,
      timestamp: 0,
      name:''
    };
  }

  const lastMessageUser = await populateUser(ctx, lastMessageMember.userId);

  return {
    count: messages.length,
    image: lastMessageUser?.image,
    timestamp: lastMessage._creationTime,
    name:lastMessageUser?.name,
  };
};

const populateReactions = (ctx: QueryCtx, messageId: Id<'messages'>) => {
  return ctx.db
    .query('reactions')
    .withIndex('by_message_id', (q) => q.eq('messageId', messageId))
    .collect();
};

const populateUser = (ctx: QueryCtx, userId: Id<'users'>) => {
  return ctx.db.get(userId);
};

const populateMember = (ctx: QueryCtx, memberId: Id<'members'>) => {
  return ctx.db.get(memberId);
};

const getMember = async (
  ctx: QueryCtx,
  workspaceId: Id<'workspaces'>,
  userId: Id<'users'>,
) => {
  return ctx.db
    .query('members')
    .withIndex('by_workspace_id_user_id', (q) =>
      q.eq('workspaceId', workspaceId).eq('userId', userId),
    )
    .unique();
};

export const update = mutation({
  args: {
    id: v.id('messages'),
    body: v.string(),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Unauthorized');

    const message = await ctx.db.get(args.id);

    if (!message) throw new Error('Message not found');

    const member = await getMember(ctx, message.workspaceId, userId);

    // 現在のユーザーがメッセージの作成者であるかを確認;
    if (!member || member._id !== message.memberId)
      throw new Error('Unauthorized');

    await ctx.db.patch(args.id, {
      body: args.body,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('messages'),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Unauthorized');

    const message = await ctx.db.get(args.id);

    if (!message) throw new Error('Message not found');

    const member = await getMember(ctx, message.workspaceId, userId);

    // 現在のユーザーがメッセージの作成者であるかを確認;
    if (!member || member._id !== message.memberId)
      throw new Error('Unauthorized');

    await ctx.db.delete(args.id);

    return args.id;
  },
});

export const getById = query({
  args: {
    id: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const message = await ctx.db.get(args.id);
    if (!message) return null;

    const currentMember = await getMember(ctx, message.workspaceId, userId);
    if (!currentMember) return null;

    const member = await populateMember(ctx, message.memberId);
    if (!member) return null;

    const user = await populateUser(ctx, member.userId);
    if (!user) return null;

    const reactions = await populateReactions(ctx, message._id);

    const reactionsWithCount = reactions.map((reaction) => {
      return {
        ...reaction,
        count: reactions.filter((r) => r.value === reaction.value).length,
      };
    });

    const reactionMap = reactionsWithCount.reduce(
      (acc, reaction) => {
        if (!acc[reaction.value]) {
          acc[reaction.value] = {
            ...reaction,
            count: 0,
            memberIds: new Set<Id<'members'>>(),
          };
        }
        acc[reaction.value].count++;
        acc[reaction.value].memberIds.add(reaction.memberId);
        return acc;
      },
      {} as Record<
        string,
        Doc<'reactions'> & {
          count: number;
          memberIds: Set<Id<'members'>>;
        }
      >,
    );

    const dedupeReactions = Object.values(reactionMap).map((reaction) => ({
      ...reaction,
      memberIds: Array.from(reaction.memberIds), // setObjを配列にする
    }));

    const reactionsWithoutMemberIdProperty = dedupeReactions.map(
      ({ memberId, ...rest }) => rest,
    );

    return {
      ...message,
      image: message.image
        ? await ctx.storage.getUrl(message.image)
        : undefined,
      user,
      member,
      reactions: reactionsWithoutMemberIdProperty,
    };
  },
});

export const get = query({
  args: {
    channelId: v.optional(v.id('channels')),
    conversationId: v.optional(v.id('conversations')),
    parentMessageId: v.optional(v.id('messages')),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Unauthorized');

    let _conversationId = args.conversationId;

    if (!args.conversationId && !args.channelId && args.parentMessageId) {
      const parentMessage = await ctx.db.get(args.parentMessageId);

      if (!parentMessage) throw new Error('Parent message not found');

      _conversationId = parentMessage.conversationId;
    }

    const results = await ctx.db
      .query('messages')
      .withIndex('by_channel_id_parent_message_id_conversation_id', (q) =>
        q
          .eq('channelId', args.channelId)
          .eq('parentMessageId', args.parentMessageId)
          .eq('conversationId', _conversationId),
      )
      .order('desc')
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: (
        await Promise.all(
          results.page.map(async (message) => {
            const member = await populateMember(ctx, message.memberId);
            const user = member ? await populateUser(ctx, member.userId) : null;

            if (!member || !user) {
              return null;
            }

            const thread = await populateThread(ctx, message._id);

            const image = message.image // => storageId
              ? await ctx.storage.getUrl(message.image)
              : undefined;

            const reactions = await populateReactions(ctx, message._id);

            // // 各リアクションに、そのリアクションタイプの総数（count）を追加
            // const reactionsWithCounts = reactions.map((reaction) => {
            //   return {
            //     ...reaction,
            //     count: reactions.filter((r) => r.value === reaction.value).length,
            //   };
            // });
            // const dedupeReactions = reactionsWithCounts.reduce(
            //   (acc, reaction) => {
            //     const existingReaction = acc.find(
            //       (r) => r.value === reaction.value,
            //     );
            //     if (existingReaction) {
            //       existingReaction.memberIds = Array.from(
            //         new Set([...existingReaction.memberIds, reaction.memberId]),
            //       );
            //     } else {
            //       acc.push({ ...reaction, memberIds: [reaction.memberId] });
            //     }
            //     return acc;
            //   },
            //   [] as (Doc<'reactions'> & {
            //     count: number;
            //     memberIds: Id<'members'>[];
            //   })[],
            // );
            // const reactionsWithoutMemberIdProperty = dedupeReactions.map(
            //   ({ memberId, ...rest }) => rest,
            // );
            //           {
            //   "👍": {
            //     value: "👍",
            //     memberId: "user1",  // 元のreactionオブジェクトからのプロパティ
            //     timestamp: 1634567890,  // 元のreactionオブジェクトからのプロパティ
            //     // ... その他の元のプロパティ ...
            //     count: 0,  // 新しく追加されたプロパティ
            //     memberIds: Set(0) {}  // 新しく追加されたプロパティ
            //   },
            //   "❤️": {
            //     value: "❤️",
            //     memberId: "user2",
            //     timestamp: 1634567891,
            //     // ... その他の元のプロパティ ...
            //     count: 0,
            //     memberIds: Set(0) {}
            //   },
            //   // 他のリアクション値...
            // }
            const reactionMap = reactions.reduce(
              (acc, reaction) => {
                if (!acc[reaction.value]) {
                  acc[reaction.value] = {
                    ...reaction,
                    count: 0,
                    memberIds: new Set<Id<'members'>>(),
                  };
                }
                acc[reaction.value].count++;
                acc[reaction.value].memberIds.add(reaction.memberId);
                return acc;
              },
              {} as Record<
                string,
                Doc<'reactions'> & {
                  count: number;
                  memberIds: Set<Id<'members'>>;
                }
              >,
            );

            const dedupeReactions = Object.values(reactionMap).map(
              (reaction) => ({
                ...reaction,
                memberIds: Array.from(reaction.memberIds), // setObjを配列にする
              }),
            );

            const reactionsWithoutMemberIdProperty = dedupeReactions.map(
              ({ memberId, ...rest }) => rest,
            );

            return {
              ...message,
              image,
              member,
              user,
              reactions: reactionsWithoutMemberIdProperty,
              threadCount: thread.count,
              threadImage: thread.image,
              threadName: thread.name,
              threadTimestamp: thread.timestamp,
            };
          }),
        )
      ).filter(
        (message): message is NonNullable<typeof message> => message !== null,
      ),
    };
  },
});

export const create = mutation({
  args: {
    body: v.string(),
    image: v.optional(v.id('_storage')),
    workspaceId: v.id('workspaces'),
    channelId: v.optional(v.id('channels')),
    conversationId: v.optional(v.id('conversations')),
    parentMessageId: v.optional(v.id('messages')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized');

    const member = await getMember(ctx, args.workspaceId, userId);

    if (!member) throw new Error('Unauthorized');

    // 初期化 => 2人のユーザー間の会話を識別するため conversationId が必要
    let _conversationId = args.conversationId;

    // 1対1の会話でスレッドに返信
    if (!args.conversationId && !args.channelId && args.parentMessageId) {
      // 親メッセージ取得
      const parentMessage = await ctx.db.get(args.parentMessageId);

      if (!parentMessage) throw new Error('Parent message not found');

      // 親メッセージの会話IDを _conversationId に設定
      _conversationId = parentMessage.conversationId;
    }
    const messageId = await ctx.db.insert('messages', {
      memberId: member._id,
      body: args.body,
      image: args.image,
      channelId: args.channelId,
      conversationId: _conversationId,
      workspaceId: args.workspaceId,
      parentMessageId: args.parentMessageId,
    });

    return messageId;
  },
});
