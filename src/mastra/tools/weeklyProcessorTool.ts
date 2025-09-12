import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, generateText } from "ai";
import { db } from "../../db";

// Initialize OpenAI for semantic analysis and embeddings
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

interface WorkingMemory {
  id: number;
  content_hash: string;
  raw_content: string;
  session_context: Record<string, any>;
  semantic_tags: string[];
  significance_score: number;
  associative_patterns: Record<string, any>;
  embedding: number[];
  created_at: string;
}

interface SemanticFact {
  concept: string;
  fact_text: string;
  relationships: Record<string, any>;
  confidence_score: number;
  context: string;
  tags: string[];
}

interface EpisodicEvent {
  event_type: string;
  event_description: string;
  temporal_context: Record<string, any>;
  emotional_valence: number;
  participants: string[];
  outcome: string;
  significance: number;
}

interface ProceduralRoutine {
  pattern_name: string;
  description: string;
  triggers: string[];
  steps: string[];
  expected_outcomes: string[];
  success_rate: number;
  context: string;
}

interface MemoryAnalysis {
  category: 'semantic' | 'episodic' | 'procedural' | 'mixed';
  confidence: number;
  semanticFacts?: SemanticFact[];
  episodicEvents?: EpisodicEvent[];
  proceduralRoutines?: ProceduralRoutine[];
  rationale: string;
}

const analyzeMemoryCategory = async (
  memory: WorkingMemory,
  logger?: IMastraLogger
): Promise<MemoryAnalysis> => {
  logger?.info('🔍 [WeeklyProcessor] Analyzing memory for categorization', {
    memoryId: memory.id,
    significance: memory.significance_score
  });

  try {
    const analysisPrompt = `
    Analyze the following memory content and categorize it into semantic facts, episodic events, and/or procedural routines.
    
    Memory content: "${memory.raw_content}"
    
    Context: ${JSON.stringify(memory.session_context)}
    Tags: ${memory.semantic_tags.join(', ')}
    
    Provide a detailed analysis in JSON format:
    {
      "category": "semantic|episodic|procedural|mixed",
      "confidence": 0.0-1.0,
      "semanticFacts": [
        {
          "concept": "main concept or entity",
          "fact_text": "the actual fact or knowledge",
          "relationships": {"related_to": ["concepts"], "type": "relationship_type"},
          "confidence_score": 0.0-1.0,
          "context": "domain or context",
          "tags": ["relevant", "tags"]
        }
      ],
      "episodicEvents": [
        {
          "event_type": "conversation|learning|decision|interaction",
          "event_description": "what happened",
          "temporal_context": {"time": "when", "duration": "how long", "sequence": "order"},
          "emotional_valence": -1.0 to 1.0,
          "participants": ["who was involved"],
          "outcome": "what resulted",
          "significance": 0.0-1.0
        }
      ],
      "proceduralRoutines": [
        {
          "pattern_name": "name of the procedure",
          "description": "what the procedure does",
          "triggers": ["what initiates it"],
          "steps": ["step1", "step2"],
          "expected_outcomes": ["what should result"],
          "success_rate": 0.0-1.0,
          "context": "when to apply"
        }
      ],
      "rationale": "explanation of the categorization"
    }
    
    Focus on:
    - Semantic facts: Timeless knowledge, concepts, relationships, definitions
    - Episodic events: Specific events with temporal context, what happened when
    - Procedural routines: How-to knowledge, repeated patterns, methods, procedures
    
    A memory can belong to multiple categories. Extract all relevant information.
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: analysisPrompt,
      maxTokens: 1500,
    });

    const analysis = JSON.parse(text);
    
    logger?.info('✅ [WeeklyProcessor] Memory categorization completed', {
      memoryId: memory.id,
      category: analysis.category,
      confidence: analysis.confidence,
      semanticFactsCount: analysis.semanticFacts?.length || 0,
      episodicEventsCount: analysis.episodicEvents?.length || 0,
      proceduralRoutinesCount: analysis.proceduralRoutines?.length || 0
    });

    return analysis;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [WeeklyProcessor] Error in memory categorization', {
      memoryId: memory.id,
      error: errorMessage
    });
    
    return {
      category: 'mixed',
      confidence: 0.1,
      rationale: `Error during analysis: ${errorMessage}`
    };
  }
};

const processSemanticFacts = async (
  facts: SemanticFact[],
  workingMemoryId: number,
  runId: number,
  logger?: IMastraLogger
): Promise<number> => {
  logger?.info('📝 [WeeklyProcessor] Processing semantic facts', {
    factCount: facts.length,
    workingMemoryId
  });

  let factsCreated = 0;

  for (const fact of facts) {
    try {
      // Generate embedding for the fact
      logger?.info('🔧 [WeeklyProcessor] Generating embedding for semantic fact', {
        concept: fact.concept
      });
      
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: `${fact.concept}: ${fact.fact_text}`,
      });

      // Create content hash for deduplication
      const contentHash = Buffer.from(`${fact.concept}:${fact.fact_text}`).toString('base64').slice(0, 64);

      // Store semantic fact
      logger?.info('💾 [WeeklyProcessor] Storing semantic fact', {
        concept: fact.concept,
        confidence: fact.confidence_score
      });
      
      const result = await db.query(
        `INSERT INTO semantic_memory (
          content_hash, concept, fact_text, relationships, 
          confidence_score, context, tags, embedding, 
          source_memory_id, run_id
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::text[], $8::jsonb, $9, $10)
        ON CONFLICT (content_hash) DO NOTHING
        RETURNING id`,
        [
          contentHash,
          fact.concept,
          fact.fact_text,
          JSON.stringify(fact.relationships),
          fact.confidence_score,
          fact.context,
          fact.tags,
          JSON.stringify(embedding),
          workingMemoryId,
          runId
        ]
      );

      if (result.rows.length > 0) {
        factsCreated++;
        const semanticMemoryId = result.rows[0].id;
        
        logger?.info('✅ [WeeklyProcessor] Semantic fact stored', {
          id: semanticMemoryId,
          concept: fact.concept
        });

        // Update provenance
        await db.query(
          `INSERT INTO provenance (
            source_table, source_id, target_table, target_id, 
            transformation_type, transformation_metadata
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [
            'working_memory',
            workingMemoryId,
            'semantic_memory',
            semanticMemoryId,
            'semantic_extraction',
            JSON.stringify({
              concept: fact.concept,
              confidence: fact.confidence_score,
              extraction_timestamp: new Date().toISOString()
            })
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger?.error('❌ [WeeklyProcessor] Error storing semantic fact', {
        concept: fact.concept,
        error: errorMessage
      });
    }
  }

  logger?.info('📊 [WeeklyProcessor] Semantic facts processing completed', {
    factsCreated,
    totalFacts: facts.length
  });

  return factsCreated;
};

const processEpisodicEvents = async (
  events: EpisodicEvent[],
  workingMemoryId: number,
  runId: number,
  logger?: IMastraLogger
): Promise<number> => {
  logger?.info('📝 [WeeklyProcessor] Processing episodic events', {
    eventCount: events.length,
    workingMemoryId
  });

  let eventsCreated = 0;

  for (const event of events) {
    try {
      // Generate embedding for the event
      logger?.info('🔧 [WeeklyProcessor] Generating embedding for episodic event', {
        eventType: event.event_type
      });
      
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: event.event_description,
      });

      // Create content hash for deduplication
      const contentHash = Buffer.from(event.event_description).toString('base64').slice(0, 64);

      // Store episodic event
      logger?.info('💾 [WeeklyProcessor] Storing episodic event', {
        eventType: event.event_type,
        significance: event.significance
      });
      
      const result = await db.query(
        `INSERT INTO episodic_memory (
          content_hash, event_type, event_description, 
          temporal_context, emotional_valence, participants, 
          outcome, significance_score, embedding, 
          source_memory_id, run_id
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $6::text[], $7, $8, $9::jsonb, $10, $11)
        ON CONFLICT (content_hash) DO NOTHING
        RETURNING id`,
        [
          contentHash,
          event.event_type,
          event.event_description,
          JSON.stringify(event.temporal_context),
          event.emotional_valence,
          event.participants,
          event.outcome,
          event.significance,
          JSON.stringify(embedding),
          workingMemoryId,
          runId
        ]
      );

      if (result.rows.length > 0) {
        eventsCreated++;
        const episodicMemoryId = result.rows[0].id;
        
        logger?.info('✅ [WeeklyProcessor] Episodic event stored', {
          id: episodicMemoryId,
          eventType: event.event_type
        });

        // Update provenance
        await db.query(
          `INSERT INTO provenance (
            source_table, source_id, target_table, target_id, 
            transformation_type, transformation_metadata
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [
            'working_memory',
            workingMemoryId,
            'episodic_memory',
            episodicMemoryId,
            'episodic_extraction',
            JSON.stringify({
              event_type: event.event_type,
              emotional_valence: event.emotional_valence,
              significance: event.significance,
              extraction_timestamp: new Date().toISOString()
            })
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger?.error('❌ [WeeklyProcessor] Error storing episodic event', {
        eventType: event.event_type,
        error: errorMessage
      });
    }
  }

  logger?.info('📊 [WeeklyProcessor] Episodic events processing completed', {
    eventsCreated,
    totalEvents: events.length
  });

  return eventsCreated;
};

const processProceduralRoutines = async (
  routines: ProceduralRoutine[],
  workingMemoryId: number,
  runId: number,
  logger?: IMastraLogger
): Promise<number> => {
  logger?.info('📝 [WeeklyProcessor] Processing procedural routines', {
    routineCount: routines.length,
    workingMemoryId
  });

  let routinesCreated = 0;

  for (const routine of routines) {
    try {
      // Generate embedding for the routine
      logger?.info('🔧 [WeeklyProcessor] Generating embedding for procedural routine', {
        patternName: routine.pattern_name
      });
      
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: `${routine.pattern_name}: ${routine.description}`,
      });

      // Create content hash for deduplication
      const contentHash = Buffer.from(`${routine.pattern_name}:${routine.description}`).toString('base64').slice(0, 64);

      // Store procedural routine
      logger?.info('💾 [WeeklyProcessor] Storing procedural routine', {
        patternName: routine.pattern_name,
        successRate: routine.success_rate
      });
      
      const result = await db.query(
        `INSERT INTO procedural_memory (
          content_hash, pattern_name, description, 
          trigger_conditions, execution_steps, expected_outcomes, 
          success_metrics, context_requirements, embedding, 
          source_memory_id, run_id
        ) VALUES ($1, $2, $3, $4::text[], $5::text[], $6::text[], $7::jsonb, $8, $9::jsonb, $10, $11)
        ON CONFLICT (content_hash) DO NOTHING
        RETURNING id`,
        [
          contentHash,
          routine.pattern_name,
          routine.description,
          routine.triggers,
          routine.steps,
          routine.expected_outcomes,
          JSON.stringify({ success_rate: routine.success_rate }),
          routine.context,
          JSON.stringify(embedding),
          workingMemoryId,
          runId
        ]
      );

      if (result.rows.length > 0) {
        routinesCreated++;
        const proceduralMemoryId = result.rows[0].id;
        
        logger?.info('✅ [WeeklyProcessor] Procedural routine stored', {
          id: proceduralMemoryId,
          patternName: routine.pattern_name
        });

        // Update provenance
        await db.query(
          `INSERT INTO provenance (
            source_table, source_id, target_table, target_id, 
            transformation_type, transformation_metadata
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [
            'working_memory',
            workingMemoryId,
            'procedural_memory',
            proceduralMemoryId,
            'procedural_extraction',
            JSON.stringify({
              pattern_name: routine.pattern_name,
              success_rate: routine.success_rate,
              trigger_count: routine.triggers.length,
              step_count: routine.steps.length,
              extraction_timestamp: new Date().toISOString()
            })
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger?.error('❌ [WeeklyProcessor] Error storing procedural routine', {
        patternName: routine.pattern_name,
        error: errorMessage
      });
    }
  }

  logger?.info('📊 [WeeklyProcessor] Procedural routines processing completed', {
    routinesCreated,
    totalRoutines: routines.length
  });

  return routinesCreated;
};

export const weeklyProcessorTool = createTool({
  id: "weekly-memory-processor",
  description: `Processes working memories from the past 7 days for Deep Tree Echo's weekly consolidation cycle. Analyzes memories using OpenAI to categorize them into semantic facts, episodic events, and procedural routines, then stores them in appropriate memory tables with provenance tracking.`,
  inputSchema: z.object({
    days_back: z.number().default(7).describe("Number of days back to process (default: 7 for weekly cycle)"),
    batch_size: z.number().default(100).describe("Maximum number of working memories to process"),
    min_confidence: z.number().default(0.3).describe("Minimum confidence score for memory extraction"),
  }),
  outputSchema: z.object({
    memories_processed: z.number(),
    semantic_facts_created: z.number(),
    episodic_events_created: z.number(),
    procedural_routines_created: z.number(),
    total_extractions: z.number(),
    processing_summary: z.string(),
  }),
  execute: async ({ context: { days_back, batch_size, min_confidence }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🌳 [WeeklyProcessor] Starting weekly memory processing cycle', {
      days_back,
      batch_size,
      min_confidence,
      timestamp: new Date().toISOString()
    });

    try {
      // Create processing run record
      logger?.info('📝 [WeeklyProcessor] Creating processing run record');
      const runResult = await db.query(
        'INSERT INTO processing_runs (run_type, status, run_metadata) VALUES ($1, $2, $3::jsonb) RETURNING id',
        ['weekly', 'running', JSON.stringify({ days_back, batch_size, min_confidence })]
      );
      
      const runId = runResult.rows[0].id;
      logger?.info('✅ [WeeklyProcessor] Processing run created', { runId });

      // Fetch working memories from the past N days
      logger?.info('📝 [WeeklyProcessor] Fetching working memories for processing');
      const memoriesResult = await db.query(
        `SELECT id, content_hash, raw_content, session_context, semantic_tags, 
                significance_score, associative_patterns, embedding, created_at
         FROM working_memory 
         WHERE created_at >= NOW() - make_interval(days => $1) 
           AND significance_score >= $2
         ORDER BY significance_score DESC 
         LIMIT $3`,
        [days_back, min_confidence, batch_size]
      );
      
      const workingMemories: WorkingMemory[] = memoriesResult.rows;
      logger?.info('📊 [WeeklyProcessor] Found working memories to process', {
        count: workingMemories.length,
        timeRange: `${days_back} days`
      });

      if (workingMemories.length === 0) {
        logger?.info('ℹ️ [WeeklyProcessor] No working memories found to process');
        
        await db.query(
          'UPDATE processing_runs SET status = $1, end_time = NOW(), items_processed = $2 WHERE id = $3',
          ['completed', 0, runId]
        );
        
        return {
          memories_processed: 0,
          semantic_facts_created: 0,
          episodic_events_created: 0,
          procedural_routines_created: 0,
          total_extractions: 0,
          processing_summary: "No working memories found to process"
        };
      }

      let memoriesProcessed = 0;
      let totalSemanticFacts = 0;
      let totalEpisodicEvents = 0;
      let totalProceduralRoutines = 0;

      // Process each working memory
      for (const memory of workingMemories) {
        logger?.info('🔄 [WeeklyProcessor] Processing working memory', {
          memoryId: memory.id,
          significance: memory.significance_score,
          tagCount: memory.semantic_tags.length
        });

        // Analyze and categorize the memory
        const analysis = await analyzeMemoryCategory(memory, logger);

        // Skip if confidence is too low
        if (analysis.confidence < min_confidence) {
          logger?.info('⚠️ [WeeklyProcessor] Memory confidence below threshold, skipping', {
            memoryId: memory.id,
            confidence: analysis.confidence,
            threshold: min_confidence
          });
          continue;
        }

        // Process semantic facts
        if (analysis.semanticFacts && analysis.semanticFacts.length > 0) {
          const factsCreated = await processSemanticFacts(
            analysis.semanticFacts,
            memory.id,
            runId,
            logger
          );
          totalSemanticFacts += factsCreated;
        }

        // Process episodic events
        if (analysis.episodicEvents && analysis.episodicEvents.length > 0) {
          const eventsCreated = await processEpisodicEvents(
            analysis.episodicEvents,
            memory.id,
            runId,
            logger
          );
          totalEpisodicEvents += eventsCreated;
        }

        // Process procedural routines
        if (analysis.proceduralRoutines && analysis.proceduralRoutines.length > 0) {
          const routinesCreated = await processProceduralRoutines(
            analysis.proceduralRoutines,
            memory.id,
            runId,
            logger
          );
          totalProceduralRoutines += routinesCreated;
        }

        memoriesProcessed++;
        
        logger?.info('✅ [WeeklyProcessor] Working memory processed successfully', {
          memoryId: memory.id,
          category: analysis.category,
          semanticFacts: analysis.semanticFacts?.length || 0,
          episodicEvents: analysis.episodicEvents?.length || 0,
          proceduralRoutines: analysis.proceduralRoutines?.length || 0
        });
      }

      const totalExtractions = totalSemanticFacts + totalEpisodicEvents + totalProceduralRoutines;

      // Complete processing run
      await db.query(
        `UPDATE processing_runs 
         SET status = $1, end_time = NOW(), items_processed = $2, 
             insights_generated = $3, run_metadata = jsonb_set(run_metadata, $4, $5::jsonb) 
         WHERE id = $6`,
        [
          'completed',
          memoriesProcessed,
          totalExtractions,
          '{completion_summary}',
          JSON.stringify({
            semantic_facts_created: totalSemanticFacts,
            episodic_events_created: totalEpisodicEvents,
            procedural_routines_created: totalProceduralRoutines,
            total_extractions: totalExtractions,
            memories_analyzed: memoriesProcessed
          }),
          runId
        ]
      );

      const summary = `Processed ${memoriesProcessed} working memories from the past ${days_back} days. ` +
                     `Extracted ${totalSemanticFacts} semantic facts, ${totalEpisodicEvents} episodic events, ` +
                     `and ${totalProceduralRoutines} procedural routines (${totalExtractions} total extractions).`;

      logger?.info('🎉 [WeeklyProcessor] Weekly processing completed successfully', {
        memoriesProcessed,
        totalSemanticFacts,
        totalEpisodicEvents,
        totalProceduralRoutines,
        totalExtractions,
        runId,
        summary
      });

      return {
        memories_processed: memoriesProcessed,
        semantic_facts_created: totalSemanticFacts,
        episodic_events_created: totalEpisodicEvents,
        procedural_routines_created: totalProceduralRoutines,
        total_extractions: totalExtractions,
        processing_summary: summary,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger?.error('❌ [WeeklyProcessor] Error during weekly processing', {
        error: errorMessage,
        stack: errorStack
      });

      throw new Error(`Weekly processing failed: ${errorMessage}`);
    }
  },
});