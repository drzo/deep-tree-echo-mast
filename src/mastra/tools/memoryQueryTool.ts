import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { db } from "../../db";

// Initialize OpenAI for embeddings
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

interface MemorySearchResult {
  type: 'semantic' | 'episodic' | 'wisdom' | 'working';
  content: string;
  metadata: Record<string, any>;
  relevance_score: number;
  created_at?: string;
}

const searchSemanticMemories = async (
  query: string,
  embedding: number[],
  limit: number,
  logger?: IMastraLogger
): Promise<MemorySearchResult[]> => {
  logger?.info('🔍 [MemoryQuery] Searching semantic memories', { query, limit });
  
  try {
    // Search by text similarity and embedding similarity
    const result = await db.query(
      `SELECT 
        concept, 
        knowledge_content, 
        related_concepts,
        confidence_level,
        source_references,
        last_updated,
        1 - (embedding <=> $1::vector) as similarity
      FROM semantic_memory
      WHERE 
        (concept ILIKE $2 OR knowledge_content ILIKE $2)
        OR (1 - (embedding <=> $1::vector)) > 0.7
      ORDER BY similarity DESC, confidence_level DESC
      LIMIT $3`,
      [JSON.stringify(embedding), `%${query}%`, limit]
    );

    return result.rows.map(row => ({
      type: 'semantic' as const,
      content: `${row.concept}: ${row.knowledge_content}`,
      metadata: {
        related_concepts: row.related_concepts,
        confidence: row.confidence_level,
        source_references: row.source_references,
      },
      relevance_score: row.similarity || row.confidence_level,
      created_at: row.last_updated,
    }));
  } catch (error) {
    logger?.error('❌ [MemoryQuery] Error searching semantic memories', { error });
    return [];
  }
};

const searchEpisodicMemories = async (
  query: string,
  embedding: number[],
  limit: number,
  logger?: IMastraLogger
): Promise<MemorySearchResult[]> => {
  logger?.info('🔍 [MemoryQuery] Searching episodic memories', { query, limit });
  
  try {
    const result = await db.query(
      `SELECT 
        event_title,
        event_description,
        participants,
        emotional_context,
        significance_rating,
        lessons_learned,
        event_timestamp,
        memory_created_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM episodic_memory
      WHERE 
        (event_title ILIKE $2 OR event_description ILIKE $2 OR lessons_learned ILIKE $2)
        OR (1 - (embedding <=> $1::vector)) > 0.7
      ORDER BY similarity DESC, significance_rating DESC
      LIMIT $3`,
      [JSON.stringify(embedding), `%${query}%`, limit]
    );

    return result.rows.map(row => ({
      type: 'episodic' as const,
      content: `${row.event_title}: ${row.event_description}. Lessons: ${row.lessons_learned}`,
      metadata: {
        event_timestamp: row.event_timestamp,
        emotional_context: row.emotional_context,
        participants: row.participants,
        significance: row.significance_rating,
      },
      relevance_score: row.similarity || row.significance_rating,
      created_at: row.memory_created_at,
    }));
  } catch (error) {
    logger?.error('❌ [MemoryQuery] Error searching episodic memories', { error });
    return [];
  }
};

const searchWisdomInsights = async (
  query: string,
  embedding: number[],
  limit: number,
  logger?: IMastraLogger
): Promise<MemorySearchResult[]> => {
  logger?.info('🔍 [MemoryQuery] Searching wisdom repository', { query, limit });
  
  try {
    const result = await db.query(
      `SELECT 
        wisdom_title,
        wisdom_content,
        supporting_experiences,
        application_contexts,
        stability_score,
        created_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM wisdom_repository
      WHERE 
        (wisdom_title ILIKE $2 OR wisdom_content ILIKE $2)
        OR (1 - (embedding <=> $1::vector)) > 0.7
      ORDER BY similarity DESC, stability_score DESC
      LIMIT $3`,
      [JSON.stringify(embedding), `%${query}%`, limit]
    );

    return result.rows.map(row => ({
      type: 'wisdom' as const,
      content: `${row.wisdom_title}: ${row.wisdom_content}`,
      metadata: {
        supporting_experiences: row.supporting_experiences,
        application_contexts: row.application_contexts,
        stability: row.stability_score,
      },
      relevance_score: row.similarity || row.stability_score,
      created_at: row.created_at,
    }));
  } catch (error) {
    logger?.error('❌ [MemoryQuery] Error searching wisdom insights', { error });
    return [];
  }
};

const searchWorkingMemories = async (
  query: string,
  embedding: number[],
  limit: number,
  recencyDays: number,
  logger?: IMastraLogger
): Promise<MemorySearchResult[]> => {
  logger?.info('🔍 [MemoryQuery] Searching recent working memories', { query, limit, recencyDays });
  
  try {
    const result = await db.query(
      `SELECT 
        raw_content,
        session_context,
        semantic_tags,
        significance_score,
        associative_patterns,
        created_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM working_memory
      WHERE 
        created_at >= NOW() - make_interval(days => $4)
        AND (
          raw_content ILIKE $2
          OR (1 - (embedding <=> $1::vector)) > 0.6
        )
      ORDER BY similarity DESC, created_at DESC
      LIMIT $3`,
      [JSON.stringify(embedding), `%${query}%`, limit, recencyDays]
    );

    return result.rows.map(row => ({
      type: 'working' as const,
      content: row.raw_content,
      metadata: {
        session_context: row.session_context,
        tags: row.semantic_tags,
        significance: row.significance_score,
        patterns: row.associative_patterns,
      },
      relevance_score: row.similarity || row.significance_score,
      created_at: row.created_at,
    }));
  } catch (error) {
    logger?.error('❌ [MemoryQuery] Error searching working memories', { error });
    return [];
  }
};

export const memoryQueryTool = createTool({
  id: "query-memories",
  description: `Queries the Deep Tree Echo memory system to retrieve relevant semantic facts, episodic events, wisdom insights, and recent working memories. Uses both text search and semantic similarity to find the most relevant memories for providing context to the agent.`,
  inputSchema: z.object({
    query: z.string().describe("The search query or topic to find relevant memories about"),
    memory_types: z.array(z.enum(["semantic", "episodic", "wisdom", "working"]))
      .default(["semantic", "episodic", "wisdom"])
      .describe("Types of memories to search"),
    limit_per_type: z.number().default(5).describe("Maximum results per memory type"),
    include_recent_working: z.boolean().default(true).describe("Include recent working memories from last 7 days"),
  }),
  outputSchema: z.object({
    memories: z.array(z.object({
      type: z.enum(["semantic", "episodic", "wisdom", "working"]),
      content: z.string(),
      metadata: z.record(z.any()),
      relevance_score: z.number(),
      created_at: z.string().optional(),
    })),
    total_found: z.number(),
    search_summary: z.string(),
  }),
  execute: async ({ context: { query, memory_types, limit_per_type, include_recent_working }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🧠 [MemoryQuery] Starting memory search', {
      query,
      memory_types,
      limit_per_type,
      include_recent_working,
      timestamp: new Date().toISOString()
    });

    try {
      // Generate embedding for the query
      logger?.info('🔧 [MemoryQuery] Generating embedding for query');
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: query,
      });

      const allMemories: MemorySearchResult[] = [];

      // Search each requested memory type
      if (memory_types.includes("semantic")) {
        logger?.info('📚 [MemoryQuery] Searching semantic memories');
        const semanticResults = await searchSemanticMemories(query, embedding, limit_per_type, logger);
        allMemories.push(...semanticResults);
        logger?.info('✅ [MemoryQuery] Found semantic memories', { count: semanticResults.length });
      }

      if (memory_types.includes("episodic")) {
        logger?.info('🎬 [MemoryQuery] Searching episodic memories');
        const episodicResults = await searchEpisodicMemories(query, embedding, limit_per_type, logger);
        allMemories.push(...episodicResults);
        logger?.info('✅ [MemoryQuery] Found episodic memories', { count: episodicResults.length });
      }

      if (memory_types.includes("wisdom")) {
        logger?.info('💎 [MemoryQuery] Searching wisdom insights');
        const wisdomResults = await searchWisdomInsights(query, embedding, limit_per_type, logger);
        allMemories.push(...wisdomResults);
        logger?.info('✅ [MemoryQuery] Found wisdom insights', { count: wisdomResults.length });
      }

      if (memory_types.includes("working") || include_recent_working) {
        logger?.info('💭 [MemoryQuery] Searching recent working memories');
        const workingResults = await searchWorkingMemories(query, embedding, Math.floor(limit_per_type / 2), 7, logger);
        allMemories.push(...workingResults);
        logger?.info('✅ [MemoryQuery] Found working memories', { count: workingResults.length });
      }

      // Sort all memories by relevance
      allMemories.sort((a, b) => b.relevance_score - a.relevance_score);

      // Create summary
      const memoryCounts = memory_types.reduce((acc, type) => {
        acc[type] = allMemories.filter(m => m.type === type).length;
        return acc;
      }, {} as Record<string, number>);

      const summary = `Found ${allMemories.length} relevant memories for "${query}": ` +
        Object.entries(memoryCounts)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => `${count} ${type}`)
          .join(', ');

      logger?.info('🎉 [MemoryQuery] Memory search completed', {
        totalFound: allMemories.length,
        breakdown: memoryCounts,
        query
      });

      return {
        memories: allMemories,
        total_found: allMemories.length,
        search_summary: summary,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger?.error('❌ [MemoryQuery] Error during memory search', {
        error: errorMessage,
        query
      });

      return {
        memories: [],
        total_found: 0,
        search_summary: `Search failed: ${errorMessage}`,
      };
    }
  },
});