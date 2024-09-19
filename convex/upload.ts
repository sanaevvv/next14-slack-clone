import { mutation } from './_generated/server';

export const generateUploadUrl = mutation(async (ctx) => {
  // ファイルをアップロードするための一時的なURLを生成;
  return await ctx.storage.generateUploadUrl();
});
