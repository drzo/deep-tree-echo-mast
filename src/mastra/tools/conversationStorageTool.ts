import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { db } from "../../db";

export const conversationStorageTool = createTool({
  id: "store-conversation",
  description: `Stores a conversation exchange between user and assistant in the Deep Tree Echo memory system. This tool captures chat interactions for future memory processing and wisdom cultivation.`,
  inputSchema: z.object({
    session_id: z.string().describe("Unique identifier for the conversation session"),
    role: z.enum(["user", "assistant"]).describe("Role of the message sender"),
    content: z.string().describe("The message content"),
    metadata: z.object({}).passthrough().optional().describe("Additional context or metadata for the message"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    conversation_id: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context: { session_id, role, content, metadata }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('💬 [ConversationStorage] Storing conversation message', {
      session_id,
      role,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Store the conversation in the database
      logger?.info('📝 [ConversationStorage] Inserting conversation into database');
      const result = await db.query(
        `INSERT INTO conversations (session_id, role, content, timestamp, processed, metadata) 
         VALUES ($1, $2, $3, NOW(), FALSE, $4::jsonb) 
         RETURNING id`,
        [session_id, role, content, JSON.stringify(metadata || {})]
      );

      if (result.rows.length > 0) {
        const conversationId = result.rows[0].id;
        logger?.info('✅ [ConversationStorage] Conversation stored successfully', {
          id: conversationId,
          session_id,
          role
        });

        return {
          success: true,
          conversation_id: conversationId,
        };
      }

      logger?.warn('⚠️ [ConversationStorage] No conversation ID returned from insert');
      return {
        success: false,
        error: "Failed to store conversation - no ID returned",
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger?.error('❌ [ConversationStorage] Error storing conversation', {
        error: errorMessage,
        session_id,
        role
      });

      return {
        success: false,
        error: `Failed to store conversation: ${errorMessage}`,
      };
    }
  },
});