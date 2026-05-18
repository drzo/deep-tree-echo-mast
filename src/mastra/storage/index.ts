import { LibSQLStore } from "@mastra/libsql";

export const sharedStorage = new LibSQLStore({
  id: "deep-tree-echo-store",
  url: process.env.LIBSQL_URL || "file:local.db",
});
