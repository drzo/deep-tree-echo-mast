import { LibSQLStore } from "@mastra/libsql";

export const sharedStorage = new LibSQLStore({
  url: "file:.mastra/mastra.db",
});
