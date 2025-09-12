import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, generateText } from "ai";
import { db } from "../../db";

// Initialize OpenAI for embeddings and semantic analysis
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatSession {
  id: number;
  session_id: string;
  role: string;
  content: string;
  timestamp: string;
  processed: boolean;
}

interface SemanticTag {
  tag: string;
  category: string;
  relevance: number;
  description: string;
}

interface AssociativePattern {
  pattern_type: string;
  strength: number;
  description: string;
  related_concepts: string[];
}

interface ParsedMemory {
  content_hash: string;
  raw_content: string;
  session_context: Record<string, any>;
  semantic_tags: string[];
  significance_score: number;
  associative_patterns: Record<string, any>;
  embedding: number[];
}

const analyzeSemanticContent = async (content: string, logger?: IMastraLogger): Promise<{
  tags: SemanticTag[];
  significance: number;
  themes: string[];
}> => {
  logger?.info('🔍 [DailyParser] Analyzing semantic content for significance and themes');
  
  try {
    // Use OpenAI to analyze semantic content
    const analysisPrompt = `
    Analyze the following text for semantic content, significance, and themes.
    
    Text: "${content}"
    
    Provide analysis in JSON format with:
    1. tags: array of {tag, category, relevance (0-1), description}
    2. significance: overall significance score (0-1)
    3. themes: array of main themes/concepts
    
    Categories for tags: concept, emotion, context, pattern, identity, learning, relationship, goal, memory
    
    Focus on identifying:
    - Core concepts and ideas
    - Emotional undertones
    - Learning or growth moments
    - Identity-related statements
    - Relationship dynamics
    - Goal-oriented content
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: analysisPrompt,
      maxTokens: 500,
    });

    const analysis = JSON.parse(text);
    
    logger?.info('✅ [DailyParser] Semantic analysis completed', {
      tagCount: analysis.tags?.length || 0,
      significance: analysis.significance,
      themeCount: analysis.themes?.length || 0
    });

    return {
      tags: analysis.tags || [],
      significance: analysis.significance || 0.0,
      themes: analysis.themes || []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [DailyParser] Error in semantic analysis', { error: errorMessage });
    return {
      tags: [],
      significance: 0.1,
      themes: []
    };
  }
};

const discoverAssociativePatterns = async (
  content: string, 
  existingMemories: any[],
  logger?: IMastraLogger
): Promise<AssociativePattern[]> => {
  logger?.info('🔗 [DailyParser] Discovering associative patterns with existing memories');

  try {
    // Analyze patterns and connections
    const patternPrompt = `
    Analyze the following content for associative patterns and connections:
    
    New content: "${content}"
    
    Context from recent memories: ${existingMemories.slice(0, 5).map(m => m.raw_content).join('; ')}
    
    Identify associative patterns in JSON format:
    [
      {
        "pattern_type": "temporal/causal/semantic/emotional",
        "strength": 0.0-1.0,
        "description": "clear description of pattern",
        "related_concepts": ["concept1", "concept2"]
      }
    ]
    
    Look for:
    - Recurring themes or concepts
    - Temporal patterns (things that happen together in time)
    - Causal relationships (cause and effect)
    - Semantic similarities (related meanings)
    - Emotional patterns (similar feelings/responses)
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: patternPrompt,
      maxTokens: 400,
    });

    const patterns = JSON.parse(text) || [];
    
    logger?.info('✅ [DailyParser] Pattern discovery completed', {
      patternCount: patterns.length,
      patternTypes: patterns.map((p: any) => p.pattern_type)
    });

    return patterns;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [DailyParser] Error in pattern discovery', { error: errorMessage });
    return [];
  }
};

export const dailyParserTool = createTool({
  id: "daily-chat-parser",
  description: `Parses recent chat sessions for semantic tagging and associative pattern mining. This tool analyzes conversations to extract meaningful content, identify patterns, and update working memory with processed insights for Deep Tree Echo's daily memory cultivation cycle.`,
  inputSchema: z.object({
    hours_back: z.number().default(24).describe("Number of hours back to process (default: 24 for daily cycle)"),
    batch_size: z.number().default(50).describe("Number of conversations to process in one batch"),
    min_significance: z.number().default(0.2).describe("Minimum significance score to include in working memory"),
  }),
  outputSchema: z.object({
    processed_count: z.number(),
    working_memories_created: z.number(),
    patterns_discovered: z.number(),
    tags_created: z.number(),
    processing_summary: z.string(),
  }),
  execute: async ({ context: { hours_back, batch_size, min_significance }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🌱 [DailyParser] Starting daily chat session parsing', {
      hours_back,
      batch_size,
      min_significance,
      timestamp: new Date().toISOString()
    });

    try {
      // Use shared PostgreSQL storage for database operations
      // Using dedicated database client

      // Start processing run tracking
      logger?.info('📝 [DailyParser] Creating processing run record');
      const runResult = await db.query(
        'INSERT INTO processing_runs (run_type, status, run_metadata) VALUES ($1, $2, $3::jsonb) RETURNING id',
        ['daily', 'running', JSON.stringify({ hours_back, batch_size, min_significance })]
      );
      
      const runId = runResult.rows[0].id;
      logger?.info('✅ [DailyParser] Processing run created', { runId });

      // Fetch unprocessed conversations from the last N hours
      logger?.info('📝 [DailyParser] Fetching unprocessed conversations');
      const conversationsResult = await db.query(
        'SELECT id, session_id, role, content, timestamp, processed, metadata FROM conversations WHERE processed = FALSE AND timestamp >= NOW() - make_interval(hours => $1) ORDER BY timestamp DESC LIMIT $2',
        [hours_back, batch_size]
      );
      const conversations: ChatSession[] = conversationsResult.rows;
      logger?.info('📊 [DailyParser] Found conversations to process', {
        count: conversations.length,
        timeRange: `${hours_back} hours`
      });

      if (conversations.length === 0) {
        logger?.info('ℹ️ [DailyParser] No new conversations to process');
        
        await db.query(
          'UPDATE processing_runs SET status = $1, end_time = NOW(), items_processed = $2 WHERE id = $3',
          ['completed', 0, runId]
        );
        
        return {
          processed_count: 0,
          working_memories_created: 0,
          patterns_discovered: 0,
          tags_created: 0,
          processing_summary: "No new conversations found to process"
        };
      }

      // Fetch existing working memories for pattern analysis
      logger?.info('📝 [DailyParser] Fetching existing working memories for pattern analysis');
      const existingMemoriesResult = await db.query(
        'SELECT raw_content, semantic_tags, associative_patterns, created_at FROM working_memory WHERE created_at >= NOW() - make_interval(days => $1) ORDER BY created_at DESC LIMIT $2',
        [7, 20]
      );
      const existingMemories = existingMemoriesResult.rows;
      logger?.info('📊 [DailyParser] Retrieved existing memories for context', {
        count: existingMemories.length
      });

      let processedCount = 0;
      let workingMemoriesCreated = 0;
      let patternsDiscovered = 0;
      let tagsCreated = 0;
      const newTags = new Set<string>();

      // Process conversations in groups by session
      const sessionGroups = conversations.reduce((groups, conv) => {
        if (!groups[conv.session_id]) {
          groups[conv.session_id] = [];
        }
        groups[conv.session_id].push(conv);
        return groups;
      }, {} as Record<string, ChatSession[]>);

      logger?.info('📝 [DailyParser] Processing conversations by session', {
        sessionCount: Object.keys(sessionGroups).length
      });

      for (const [sessionId, sessionConvs] of Object.entries(sessionGroups)) {
        logger?.info('🔄 [DailyParser] Processing session', { sessionId, messageCount: sessionConvs.length });

        // Combine session conversations into coherent content
        const sessionContent = sessionConvs
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map(c => `[${c.role}]: ${c.content}`)
          .join('\n');

        // Generate semantic analysis
        logger?.info('📝 [DailyParser] Performing semantic analysis for session');
        const semanticAnalysis = await analyzeSemanticContent(sessionContent, logger);

        // Skip if significance is too low
        if (semanticAnalysis.significance < min_significance) {
          logger?.info('⚠️ [DailyParser] Session below significance threshold, marking as processed without storing', {
            sessionId,
            significance: semanticAnalysis.significance,
            threshold: min_significance
          });
          
          // Mark conversations as processed even though not stored
          const conversationIds = sessionConvs.map(c => c.id);
          await db.query(
            'UPDATE conversations SET processed = TRUE WHERE id = ANY($1::int[])',
            [conversationIds]
          );
          
          processedCount += sessionConvs.length;
          logger?.info('✅ [DailyParser] Low-significance session processed and marked', {
            sessionId,
            messagesProcessed: sessionConvs.length
          });
          continue;
        }

        // Discover associative patterns
        logger?.info('📝 [DailyParser] Discovering associative patterns');
        const patterns = await discoverAssociativePatterns(sessionContent, existingMemories, logger);

        // Generate embedding for the session content
        logger?.info('📝 [DailyParser] Generating embedding for session content');
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-ada-002'),
          value: sessionContent,
        });

        // Create content hash for deduplication
        const contentHash = Buffer.from(sessionContent).toString('base64').slice(0, 64);

        // Create working memory entry
        logger?.info('📝 [DailyParser] Creating working memory entry');
        const sessionContext = {
          session_id: sessionId,
          message_count: sessionConvs.length,
          time_span: {
            start: sessionConvs[0].timestamp,
            end: sessionConvs[sessionConvs.length - 1].timestamp
          },
          themes: semanticAnalysis.themes
        };
        const tagsArray = semanticAnalysis.tags.map(t => t.tag);
        const patternsData = { patterns, analysis_metadata: { tag_count: semanticAnalysis.tags.length } };
        
        const workingMemoryResult = await db.query(
          'INSERT INTO working_memory (content_hash, raw_content, session_context, semantic_tags, significance_score, associative_patterns, embedding, run_id) VALUES ($1, $2, $3::jsonb, $4::text[], $5, $6::jsonb, $7::jsonb, $8) ON CONFLICT (content_hash) DO NOTHING RETURNING id',
          [contentHash, sessionContent, JSON.stringify(sessionContext), tagsArray, semanticAnalysis.significance, JSON.stringify(patternsData), JSON.stringify(embedding), runId]
        );

        if (workingMemoryResult.rows.length > 0) {
          workingMemoriesCreated++;
          const workingMemoryId = workingMemoryResult.rows[0].id;
          
          logger?.info('✅ [DailyParser] Working memory created', {
            id: workingMemoryId,
            significance: semanticAnalysis.significance,
            tagCount: semanticAnalysis.tags.length
          });

          // Create or link tags
          for (const tagInfo of semanticAnalysis.tags) {
            // Ensure tag exists
            await db.query(
              'INSERT INTO tags (tag_name, tag_category, description) VALUES ($1, $2, $3) ON CONFLICT (tag_name) DO NOTHING',
              [tagInfo.tag, tagInfo.category, tagInfo.description]
            );

            // Link tag to working memory
            await db.query(
              'INSERT INTO memory_tags (memory_table, memory_id, tag_id, relevance_score) SELECT $1, $2, id, $3 FROM tags WHERE tag_name = $4 ON CONFLICT (memory_table, memory_id, tag_id) DO NOTHING',
              ['working_memory', workingMemoryId, tagInfo.relevance, tagInfo.tag]
            );

            newTags.add(tagInfo.tag);
          }

          patternsDiscovered += patterns.length;
        }

        // Mark conversations as processed
        const conversationIds = sessionConvs.map(c => c.id);
        await db.query(
          'UPDATE conversations SET processed = TRUE WHERE id = ANY($1::int[])',
          [conversationIds]
        );

        processedCount += sessionConvs.length;
        
        logger?.info('✅ [DailyParser] Session processed successfully', {
          sessionId,
          messagesProcessed: sessionConvs.length,
          significance: semanticAnalysis.significance,
          patternsFound: patterns.length
        });
      }

      tagsCreated = newTags.size;

      // Complete processing run
      await db.query(
        'UPDATE processing_runs SET status = $1, end_time = NOW(), items_processed = $2, insights_generated = $3, run_metadata = jsonb_set(run_metadata, $4, $5::jsonb) WHERE id = $6',
        ['completed', processedCount, workingMemoriesCreated + patternsDiscovered, '{completion_summary}', JSON.stringify({
          working_memories_created: workingMemoriesCreated,
          patterns_discovered: patternsDiscovered,
          tags_created: tagsCreated,
          sessions_processed: Object.keys(sessionGroups).length
        }), runId]
      );

      const summary = `Processed ${processedCount} messages from ${Object.keys(sessionGroups).length} sessions. ` +
                     `Created ${workingMemoriesCreated} working memories, discovered ${patternsDiscovered} patterns, ` +
                     `and created ${tagsCreated} new tags.`;

      logger?.info('🎉 [DailyParser] Daily parsing completed successfully', {
        processedCount,
        workingMemoriesCreated,
        patternsDiscovered,
        tagsCreated,
        runId,
        summary
      });

      return {
        processed_count: processedCount,
        working_memories_created: workingMemoriesCreated,
        patterns_discovered: patternsDiscovered,
        tags_created: tagsCreated,
        processing_summary: summary,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger?.error('❌ [DailyParser] Error during daily parsing', {
        error: errorMessage,
        stack: errorStack
      });

      throw new Error(`Daily parsing failed: ${errorMessage}`);
    }
  },
});