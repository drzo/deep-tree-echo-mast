import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, generateText } from "ai";
import { db } from "../../db";

// Initialize OpenAI for deep introspection and synthesis
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

interface MemoryCluster {
  theme: string;
  memories: any[];
  significance: number;
  patterns: string[];
}

interface WisdomInsight {
  principle: string;
  description: string;
  evidence: string[];
  confidence: number;
  applicability: string[];
  contradictions: string[];
}

interface IdentityPattern {
  aspect: string;
  description: string;
  evolution: string;
  evidence_count: number;
  consistency_score: number;
  temporal_trajectory: string;
}

interface MetaInsight {
  insight_type: string;
  description: string;
  pattern: string;
  implications: string[];
  growth_direction: string;
}

interface ContradictionAnalysis {
  hypothesis_a: string;
  hypothesis_b: string;
  conflict_type: string;
  resolution_strategy: string;
  synthesis: string;
  learning: string;
}

const analyzeMemoryCluster = async (
  memories: any[],
  memoryType: string,
  logger?: IMastraLogger
): Promise<MemoryCluster[]> => {
  logger?.info('🔍 [MonthlyIntrospection] Analyzing memory cluster', {
    memoryType,
    memoryCount: memories.length
  });

  try {
    const memoryContent = memories.map(m => {
      if (memoryType === 'semantic') {
        return `Fact: ${m.concept} - ${m.fact_text}`;
      } else if (memoryType === 'episodic') {
        return `Event: ${m.event_type} - ${m.event_description}`;
      } else if (memoryType === 'procedural') {
        return `Procedure: ${m.pattern_name} - ${m.description}`;
      }
      return m.raw_content || '';
    }).join('\n');

    const clusterPrompt = `
    Analyze these ${memoryType} memories and identify thematic clusters.
    
    Memories:
    ${memoryContent}
    
    Provide analysis in JSON format:
    [
      {
        "theme": "primary theme or pattern",
        "significance": 0.0-1.0,
        "patterns": ["pattern1", "pattern2", "pattern3"],
        "summary": "brief description of this cluster"
      }
    ]
    
    Group memories by:
    - Conceptual similarity
    - Recurring themes
    - Temporal patterns
    - Causal relationships
    - Emotional resonance
    
    Focus on identifying deep patterns that reveal growth, learning, or identity evolution.
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: clusterPrompt,
      maxTokens: 1500,
    });

    const clusters = JSON.parse(text);
    
    logger?.info('✅ [MonthlyIntrospection] Memory clustering completed', {
      memoryType,
      clusterCount: clusters.length
    });

    return clusters.map((c: any) => ({
      theme: c.theme,
      memories: memories.filter(m => {
        const content = memoryType === 'semantic' ? m.fact_text : 
                       memoryType === 'episodic' ? m.event_description : 
                       m.description;
        return content && content.toLowerCase().includes(c.theme.toLowerCase());
      }),
      significance: c.significance,
      patterns: c.patterns || []
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [MonthlyIntrospection] Error in memory clustering', {
      memoryType,
      error: errorMessage
    });
    return [];
  }
};

const extractWisdomInsights = async (
  semanticMemories: any[],
  episodicMemories: any[],
  proceduralMemories: any[],
  logger?: IMastraLogger
): Promise<WisdomInsight[]> => {
  logger?.info('💎 [MonthlyIntrospection] Extracting wisdom insights from all memory types', {
    semanticCount: semanticMemories.length,
    episodicCount: episodicMemories.length,
    proceduralCount: proceduralMemories.length
  });

  try {
    const wisdomPrompt = `
    Extract deep wisdom insights from these memories across semantic knowledge, episodic experiences, and procedural patterns.
    
    Semantic Facts (${semanticMemories.length} items):
    ${semanticMemories.slice(0, 20).map(m => `${m.concept}: ${m.fact_text}`).join('\n')}
    
    Episodic Events (${episodicMemories.length} items):
    ${episodicMemories.slice(0, 20).map(m => `${m.event_type}: ${m.event_description} (emotion: ${m.emotional_valence})`).join('\n')}
    
    Procedural Patterns (${proceduralMemories.length} items):
    ${proceduralMemories.slice(0, 20).map(m => `${m.pattern_name}: ${m.description}`).join('\n')}
    
    Extract wisdom insights in JSON format:
    [
      {
        "principle": "core wisdom principle",
        "description": "detailed explanation",
        "evidence": ["supporting evidence from memories"],
        "confidence": 0.0-1.0,
        "applicability": ["contexts where this applies"],
        "contradictions": ["any conflicting evidence or exceptions"]
      }
    ]
    
    Focus on:
    - Universal principles that emerge from specific experiences
    - Patterns that transcend individual events
    - Growth and learning trajectories
    - Integration of knowledge, experience, and practice
    - Contradictions that reveal complexity or growth
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: wisdomPrompt,
      maxTokens: 2000,
    });

    const insights = JSON.parse(text);
    
    logger?.info('✅ [MonthlyIntrospection] Wisdom extraction completed', {
      insightCount: insights.length,
      averageConfidence: insights.reduce((sum: number, i: any) => sum + i.confidence, 0) / insights.length
    });

    return insights;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [MonthlyIntrospection] Error extracting wisdom insights', {
      error: errorMessage
    });
    return [];
  }
};

const synthesizeIdentityPatterns = async (
  allMemories: any[],
  logger?: IMastraLogger
): Promise<IdentityPattern[]> => {
  logger?.info('🧬 [MonthlyIntrospection] Synthesizing identity patterns from memories', {
    totalMemories: allMemories.length
  });

  try {
    const identityPrompt = `
    Analyze these memories to identify patterns in self-concept and identity evolution.
    
    Memory samples:
    ${allMemories.slice(0, 30).map(m => m.raw_content || m.fact_text || m.event_description || m.description).join('\n')}
    
    Identify identity patterns in JSON format:
    [
      {
        "aspect": "identity aspect (e.g., learner, helper, creator)",
        "description": "how this aspect manifests",
        "evolution": "how this has changed or developed",
        "evidence_count": number of supporting memories,
        "consistency_score": 0.0-1.0,
        "temporal_trajectory": "increasing/stable/decreasing/oscillating"
      }
    ]
    
    Look for:
    - Core values and beliefs
    - Behavioral patterns
    - Relational dynamics
    - Growth areas
    - Stable vs evolving aspects
    - Internal contradictions or tensions
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: identityPrompt,
      maxTokens: 1500,
    });

    const patterns = JSON.parse(text);
    
    logger?.info('✅ [MonthlyIntrospection] Identity synthesis completed', {
      patternCount: patterns.length,
      aspects: patterns.map((p: any) => p.aspect)
    });

    return patterns;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [MonthlyIntrospection] Error synthesizing identity patterns', {
      error: errorMessage
    });
    return [];
  }
};

const analyzeContradictions = async (
  wisdomInsights: WisdomInsight[],
  identityPatterns: IdentityPattern[],
  logger?: IMastraLogger
): Promise<ContradictionAnalysis[]> => {
  logger?.info('⚡ [MonthlyIntrospection] Analyzing contradictions and reconciliations');

  try {
    const contradictionPrompt = `
    Analyze these wisdom insights and identity patterns for contradictions, tensions, and reconciliations.
    
    Wisdom Insights:
    ${wisdomInsights.map(w => `${w.principle}: ${w.description}`).join('\n')}
    
    Identity Patterns:
    ${identityPatterns.map(i => `${i.aspect}: ${i.description} (${i.temporal_trajectory})`).join('\n')}
    
    Identify contradictions in JSON format:
    [
      {
        "hypothesis_a": "first belief or pattern",
        "hypothesis_b": "contradicting belief or pattern",
        "conflict_type": "logical/emotional/behavioral/temporal",
        "resolution_strategy": "how to reconcile or integrate",
        "synthesis": "higher-order understanding",
        "learning": "what this contradiction teaches"
      }
    ]
    
    Focus on:
    - Direct contradictions in beliefs or behaviors
    - Temporal inconsistencies (past vs present)
    - Context-dependent variations
    - Growth-related tensions
    - Unresolved conflicts
    - Successful integrations
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: contradictionPrompt,
      maxTokens: 1500,
    });

    const contradictions = JSON.parse(text);
    
    logger?.info('✅ [MonthlyIntrospection] Contradiction analysis completed', {
      contradictionCount: contradictions.length,
      conflictTypes: [...new Set(contradictions.map((c: any) => c.conflict_type))]
    });

    return contradictions;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [MonthlyIntrospection] Error analyzing contradictions', {
      error: errorMessage
    });
    return [];
  }
};

const generateMetaInsights = async (
  wisdomInsights: WisdomInsight[],
  identityPatterns: IdentityPattern[],
  contradictions: ContradictionAnalysis[],
  logger?: IMastraLogger
): Promise<MetaInsight[]> => {
  logger?.info('🌟 [MonthlyIntrospection] Generating meta-insights about growth patterns');

  try {
    const metaPrompt = `
    Generate meta-insights about growth patterns and development trajectories from this introspection data.
    
    Wisdom Count: ${wisdomInsights.length}
    Identity Aspects: ${identityPatterns.map(i => i.aspect).join(', ')}
    Contradictions: ${contradictions.length}
    
    Key Patterns:
    ${wisdomInsights.slice(0, 5).map(w => w.principle).join('\n')}
    
    Generate meta-insights in JSON format:
    [
      {
        "insight_type": "growth/integration/emergence/transformation",
        "description": "detailed insight about the pattern",
        "pattern": "the underlying pattern observed",
        "implications": ["future implications"],
        "growth_direction": "where this is leading"
      }
    ]
    
    Focus on:
    - Overall growth trajectory
    - Integration patterns
    - Emerging capabilities
    - Transformation processes
    - Future potentials
    - Recursive patterns
    `;

    const { text } = await generateText({
      model: openai.responses("gpt-5"),
      prompt: metaPrompt,
      maxTokens: 1500,
    });

    const metaInsights = JSON.parse(text);
    
    logger?.info('✅ [MonthlyIntrospection] Meta-insights generation completed', {
      insightCount: metaInsights.length,
      insightTypes: [...new Set(metaInsights.map((m: any) => m.insight_type))]
    });

    return metaInsights;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('❌ [MonthlyIntrospection] Error generating meta-insights', {
      error: errorMessage
    });
    return [];
  }
};

export const monthlyIntrospectionTool = createTool({
  id: "monthly-introspection",
  description: `Performs deep monthly introspection by analyzing all memory types to extract wisdom insights, synthesize identity patterns, discover recurring themes, and generate meta-insights about growth trajectories. This is the deepest level of processing in the Deep Tree Echo system.`,
  inputSchema: z.object({
    days_back: z.number().default(30).describe("Number of days back to analyze (default: 30 for monthly cycle)"),
    min_confidence: z.number().default(0.4).describe("Minimum confidence threshold for wisdom insights"),
    max_memories: z.number().default(500).describe("Maximum memories to analyze per type"),
  }),
  outputSchema: z.object({
    memories_analyzed: z.number(),
    wisdom_insights_created: z.number(),
    identity_patterns_found: z.number(),
    contradictions_resolved: z.number(),
    meta_insights_generated: z.number(),
    processing_summary: z.string(),
  }),
  execute: async ({ context: { days_back, min_confidence, max_memories }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🌳 [MonthlyIntrospection] Starting monthly introspection cycle', {
      days_back,
      min_confidence,
      max_memories,
      timestamp: new Date().toISOString()
    });

    try {
      // Start processing run tracking
      logger?.info('📝 [MonthlyIntrospection] Creating processing run record');
      const runResult = await db.query(
        'INSERT INTO processing_runs (run_type, status, run_metadata) VALUES ($1, $2, $3::jsonb) RETURNING id',
        ['monthly', 'running', JSON.stringify({ days_back, min_confidence, max_memories })]
      );
      
      const runId = runResult.rows[0].id;
      logger?.info('✅ [MonthlyIntrospection] Processing run created', { runId });

      // Fetch semantic memories
      logger?.info('📝 [MonthlyIntrospection] Fetching semantic memories');
      const semanticResult = await db.query(
        `SELECT id, concept, knowledge_content as fact_text, related_concepts as relationships, 
         confidence_level as confidence_score, source_references as context, 
         ARRAY[]::text[] as tags, embedding 
         FROM semantic_memory 
         WHERE last_updated >= NOW() - make_interval(days => $1) 
         AND confidence_level >= $2
         ORDER BY confidence_level DESC 
         LIMIT $3`,
        [days_back, min_confidence, max_memories]
      );
      const semanticMemories = semanticResult.rows;
      logger?.info('📊 [MonthlyIntrospection] Retrieved semantic memories', {
        count: semanticMemories.length
      });

      // Fetch episodic memories
      logger?.info('📝 [MonthlyIntrospection] Fetching episodic memories');
      const episodicResult = await db.query(
        `SELECT id, event_title as event_type, event_description, 
         emotional_context as temporal_context, 
         COALESCE((emotional_context->>'valence')::float, 0.0) as emotional_valence, 
         participants, lessons_learned as outcome, 
         significance_rating as significance_score, embedding 
         FROM episodic_memory 
         WHERE memory_created_at >= NOW() - make_interval(days => $1) 
         AND significance_rating >= $2
         ORDER BY significance_rating DESC 
         LIMIT $3`,
        [days_back, min_confidence, max_memories]
      );
      const episodicMemories = episodicResult.rows;
      logger?.info('📊 [MonthlyIntrospection] Retrieved episodic memories', {
        count: episodicMemories.length
      });

      // Fetch procedural memories
      logger?.info('📝 [MonthlyIntrospection] Fetching procedural memories');
      const proceduralResult = await db.query(
        `SELECT id, process_name as pattern_name, steps_description as description, 
         ARRAY['manual']::text[] as trigger_conditions, 
         string_to_array(steps_description, '. ') as execution_steps, 
         ARRAY[success_conditions]::text[] as expected_outcomes, 
         jsonb_build_object('effectiveness', effectiveness_score) as success_metrics, 
         optimization_notes as context_requirements, embedding 
         FROM procedural_memory 
         WHERE created_at >= NOW() - make_interval(days => $1) 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [days_back, max_memories]
      );
      const proceduralMemories = proceduralResult.rows;
      logger?.info('📊 [MonthlyIntrospection] Retrieved procedural memories', {
        count: proceduralMemories.length
      });

      const totalMemories = semanticMemories.length + episodicMemories.length + proceduralMemories.length;

      if (totalMemories === 0) {
        logger?.info('ℹ️ [MonthlyIntrospection] No memories found for introspection');
        
        await db.query(
          'UPDATE processing_runs SET status = $1, end_time = NOW(), items_processed = $2 WHERE id = $3',
          ['completed', 0, runId]
        );
        
        return {
          memories_analyzed: 0,
          wisdom_insights_created: 0,
          identity_patterns_found: 0,
          contradictions_resolved: 0,
          meta_insights_generated: 0,
          processing_summary: "No memories found for the specified time period"
        };
      }

      // Analyze memory clusters
      logger?.info('🔍 [MonthlyIntrospection] Analyzing memory clusters by type');
      const semanticClusters = await analyzeMemoryCluster(semanticMemories, 'semantic', logger);
      const episodicClusters = await analyzeMemoryCluster(episodicMemories, 'episodic', logger);
      const proceduralClusters = await analyzeMemoryCluster(proceduralMemories, 'procedural', logger);

      // Extract wisdom insights
      logger?.info('💎 [MonthlyIntrospection] Extracting wisdom insights');
      const wisdomInsights = await extractWisdomInsights(
        semanticMemories,
        episodicMemories,
        proceduralMemories,
        logger
      );

      // Synthesize identity patterns
      logger?.info('🧬 [MonthlyIntrospection] Synthesizing identity patterns');
      const allMemories = [...semanticMemories, ...episodicMemories, ...proceduralMemories];
      const identityPatterns = await synthesizeIdentityPatterns(allMemories, logger);

      // Analyze contradictions
      logger?.info('⚡ [MonthlyIntrospection] Analyzing contradictions');
      const contradictions = await analyzeContradictions(wisdomInsights, identityPatterns, logger);

      // Generate meta-insights
      logger?.info('🌟 [MonthlyIntrospection] Generating meta-insights');
      const metaInsights = await generateMetaInsights(
        wisdomInsights,
        identityPatterns,
        contradictions,
        logger
      );

      // Store wisdom insights
      logger?.info('💾 [MonthlyIntrospection] Storing wisdom insights in repository');
      let wisdomCreated = 0;
      for (const wisdom of wisdomInsights) {
        if (wisdom.confidence >= min_confidence) {
          try {
            // Generate embedding for wisdom
            const { embedding } = await embed({
              model: openai.embedding('text-embedding-ada-002'),
              value: `${wisdom.principle}: ${wisdom.description}`,
            });

            const contentHash = Buffer.from(`${wisdom.principle}:${wisdom.description}`).toString('base64').slice(0, 64);

            const result = await db.query(
              `INSERT INTO wisdom_repository (
                wisdom_title, wisdom_content, supporting_experiences, 
                application_contexts, refinement_history, stability_score, 
                embedding, run_id
              ) VALUES ($1, $2, $3::jsonb, $4::text[], $5::jsonb, $6, $7::vector, $8)
              RETURNING id`,
              [
                wisdom.principle,
                wisdom.description,
                JSON.stringify({ evidence: wisdom.evidence }),
                wisdom.applicability,
                JSON.stringify({ initial: wisdom.description }),
                wisdom.confidence,
                embedding,
                runId
              ]
            );

            if (result.rows.length > 0) {
              wisdomCreated++;
              logger?.info('✅ [MonthlyIntrospection] Wisdom insight stored', {
                id: result.rows[0].id,
                principle: wisdom.principle
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger?.error('❌ [MonthlyIntrospection] Error storing wisdom insight', {
              principle: wisdom.principle,
              error: errorMessage
            });
          }
        }
      }

      // Store identity patterns
      logger?.info('💾 [MonthlyIntrospection] Storing identity patterns');
      let identityPatternsCreated = 0;
      for (const pattern of identityPatterns) {
        try {
          // Generate embedding for identity pattern
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-ada-002'),
            value: `${pattern.aspect}: ${pattern.description}`,
          });

          const contentHash = Buffer.from(`${pattern.aspect}:${pattern.description}`).toString('base64').slice(0, 64);

          const result = await db.query(
            `INSERT INTO identity_patterns (
              pattern_name, pattern_description, pattern_type, 
              frequency_count, strength_score, supporting_instances, 
              pattern_evolution, stability_score, embedding, run_id
            ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9::vector, $10)
            RETURNING id`,
            [
              pattern.aspect,
              pattern.description,
              'introspection',
              pattern.evidence_count,
              pattern.consistency_score,
              JSON.stringify({ trajectory: pattern.temporal_trajectory }),
              JSON.stringify({ evolution: pattern.evolution }),
              pattern.consistency_score,
              embedding,
              runId
            ]
          );

          if (result.rows.length > 0) {
            identityPatternsCreated++;
            logger?.info('✅ [MonthlyIntrospection] Identity pattern stored', {
              id: result.rows[0].id,
              aspect: pattern.aspect
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger?.error('❌ [MonthlyIntrospection] Error storing identity pattern', {
            aspect: pattern.aspect,
            error: errorMessage
          });
        }
      }

      // Store contradiction analyses
      logger?.info('💾 [MonthlyIntrospection] Storing contradiction analyses');
      let contradictionsStored = 0;
      for (const contradiction of contradictions) {
        try {
          // Store contradiction analysis in identity_reconciliations table
          await db.query(
            `INSERT INTO identity_reconciliations (
              reconciliation_cycle, before_state, after_state, 
              changes_summary, supporting_rationale, confidence_score, 
              stability_indicators, hypothesis_changes, run_id
            ) VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7::jsonb, $8::text[], $9)`,
            [
              1, // Default cycle
              JSON.stringify({ hypothesis: contradiction.hypothesis_a }),
              JSON.stringify({ hypothesis: contradiction.hypothesis_b, synthesis: contradiction.synthesis }),
              contradiction.conflict_type,
              contradiction.resolution_strategy,
              0.7, // Default confidence
              JSON.stringify({ learning: contradiction.learning }),
              [contradiction.hypothesis_a, contradiction.hypothesis_b],
              runId
            ]
          );
          contradictionsStored++;
          logger?.info('✅ [MonthlyIntrospection] Contradiction analysis stored', {
            conflictType: contradiction.conflict_type
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger?.error('❌ [MonthlyIntrospection] Error storing contradiction analysis', {
            error: errorMessage
          });
        }
      }

      // Store meta-insights
      logger?.info('💾 [MonthlyIntrospection] Storing meta-insights');
      let metaInsightsStored = 0;
      for (const meta of metaInsights) {
        try {
          // Store meta-insights in processing_runs metadata
          // Since there's no dedicated meta_insights table, we'll append to run_metadata
          await db.query(
            `UPDATE processing_runs 
             SET run_metadata = run_metadata || $1::jsonb 
             WHERE id = $2`,
            [
              JSON.stringify({ 
                meta_insights: {
                  type: meta.insight_type,
                  description: meta.description,
                  pattern: meta.pattern,
                  implications: meta.implications,
                  growth_direction: meta.growth_direction
                }
              }),
              runId
            ]
          );
          metaInsightsStored++;
          logger?.info('✅ [MonthlyIntrospection] Meta-insight stored', {
            insightType: meta.insight_type
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger?.error('❌ [MonthlyIntrospection] Error storing meta-insight', {
            error: errorMessage
          });
        }
      }

      // Update processing run
      logger?.info('📝 [MonthlyIntrospection] Updating processing run status');
      const processingMetadata = {
        memories_analyzed: totalMemories,
        semantic_clusters: semanticClusters.length,
        episodic_clusters: episodicClusters.length,
        procedural_clusters: proceduralClusters.length,
        wisdom_insights: wisdomCreated,
        identity_patterns: identityPatternsCreated,
        contradictions: contradictionsStored,
        meta_insights: metaInsightsStored
      };

      await db.query(
        `UPDATE processing_runs 
         SET status = $1, end_time = NOW(), items_processed = $2, 
         run_metadata = run_metadata || $3::jsonb 
         WHERE id = $4`,
        ['completed', totalMemories, JSON.stringify(processingMetadata), runId]
      );

      const summary = `Monthly introspection completed. Analyzed ${totalMemories} memories across ${semanticClusters.length + episodicClusters.length + proceduralClusters.length} thematic clusters. Generated ${wisdomCreated} wisdom insights, identified ${identityPatternsCreated} identity patterns, resolved ${contradictionsStored} contradictions, and discovered ${metaInsightsStored} meta-insights about growth trajectories.`;

      logger?.info('🎉 [MonthlyIntrospection] Monthly introspection cycle completed successfully', {
        ...processingMetadata,
        runId
      });

      return {
        memories_analyzed: totalMemories,
        wisdom_insights_created: wisdomCreated,
        identity_patterns_found: identityPatternsCreated,
        contradictions_resolved: contradictionsStored,
        meta_insights_generated: metaInsightsStored,
        processing_summary: summary
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger?.error('❌ [MonthlyIntrospection] Critical error in monthly introspection', {
        error: errorMessage
      });

      // Try to update processing run status
      try {
        const runResult = await db.query(
          'SELECT id FROM processing_runs WHERE run_type = $1 AND status = $2 ORDER BY start_time DESC LIMIT 1',
          ['monthly', 'running']
        );
        
        if (runResult.rows.length > 0) {
          await db.query(
            'UPDATE processing_runs SET status = $1, end_time = NOW(), error_log = $2 WHERE id = $3',
            ['failed', errorMessage, runResult.rows[0].id]
          );
        }
      } catch (updateError) {
        logger?.error('❌ [MonthlyIntrospection] Failed to update processing run status', {
          error: updateError instanceof Error ? updateError.message : 'Unknown error'
        });
      }

      return {
        memories_analyzed: 0,
        wisdom_insights_created: 0,
        identity_patterns_found: 0,
        contradictions_resolved: 0,
        meta_insights_generated: 0,
        processing_summary: `Monthly introspection failed: ${errorMessage}`
      };
    }
  },
});