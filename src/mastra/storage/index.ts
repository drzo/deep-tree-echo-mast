import { LibSQLStore } from "@mastra/libsql";

export const sharedStorage = new LibSQLStore({
  url: ":memory:",
});
