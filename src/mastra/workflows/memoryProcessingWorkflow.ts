import { createWorkflow, createStep } from "../inngest";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { dailyParserTool } from "../tools/dailyParserTool";
import { weeklyProcessorTool } from "../tools/weeklyProcessorTool";
import { monthlyIntrospectionTool } from "../tools/monthlyIntrospectionTool";

const runtimeContext = new RuntimeContext();

// Step 1: Execute Daily Parser Tool
const dailyParsingStep = createStep({
  id: "daily-parsing-step",
  description: "Parse recent chat sessions for semantic tagging and pattern mining",
  inputSchema: z.object({}), // Empty input for time-based workflow
  outputSchema: z.object({
    success: z.boolean(),
    processed_count: z.number(),
    working_memories_created: z.number(),
    patterns_discovered: z.number(),
    tags_created: z.number(),
    processing_summary: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    console.log('🌅 [MemoryProcessing] Starting DAILY parsing cycle', {
      timestamp: new Date().toISOString(),
      step: 'daily-parsing-step'
    });

    try {
      // Execute daily parser with default parameters
      const result = await dailyParserTool.execute({
        context: {
          hours_back: 24,
          batch_size: 50,
          min_significance: 0.2
        },
        tracingContext: {},
        runtimeContext
      });

      console.log('✅ [MemoryProcessing] Daily parsing completed successfully', {
        processed_count: result.processed_count,
        working_memories_created: result.working_memories_created,
        patterns_discovered: result.patterns_discovered,
        tags_created: result.tags_created,
        summary: result.processing_summary
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [MemoryProcessing] Daily parsing failed', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        processed_count: 0,
        working_memories_created: 0,
        patterns_discovered: 0,
        tags_created: 0,
        processing_summary: `Daily parsing failed: ${errorMessage}`,
        error: errorMessage
      };
    }
  }
});

// Step 2: Execute Weekly Processor Tool (conditionally)
const weeklyProcessingStep = createStep({
  id: "weekly-processing-step",
  description: "Process working memory into semantic, episodic, and procedural memory",
  inputSchema: z.object({
    success: z.boolean(),
    processed_count: z.number(),
    working_memories_created: z.number(),
    patterns_discovered: z.number(),
    tags_created: z.number(),
    processing_summary: z.string(),
    error: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    memories_processed: z.number(),
    semantic_facts_created: z.number(),
    episodic_events_created: z.number(),
    procedural_routines_created: z.number(),
    processing_summary: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const dailyResult = inputData;
    
    // Check if it's time for weekly processing (every Sunday)
    const today = new Date();
    const isWeeklyProcessingDay = today.getDay() === 0; // Sunday
    
    console.log('📅 [MemoryProcessing] Checking WEEKLY processing schedule', {
      timestamp: today.toISOString(),
      dayOfWeek: today.getDay(),
      isWeeklyProcessingDay,
      step: 'weekly-processing-step'
    });

    if (!isWeeklyProcessingDay) {
      console.log('⏭️ [MemoryProcessing] Skipping weekly processing (not Sunday)', {
        nextRunDay: 'Next Sunday'
      });
      
      return {
        success: true,
        memories_processed: 0,
        semantic_facts_created: 0,
        episodic_events_created: 0,
        procedural_routines_created: 0,
        processing_summary: "Weekly processing skipped - runs on Sundays only"
      };
    }

    try {
      console.log('🔄 [MemoryProcessing] Starting WEEKLY processing cycle', {
        timestamp: new Date().toISOString(),
        dailyMemoriesAvailable: dailyResult.working_memories_created
      });

      // Execute weekly processor with default parameters
      const result = await weeklyProcessorTool.execute({
        context: {
          days_back: 7,
          min_confidence: 0.3,
          batch_size: 100
        },
        tracingContext: {},
        runtimeContext
      });

      console.log('✅ [MemoryProcessing] Weekly processing completed successfully', {
        memories_processed: result.memories_processed,
        semantic_facts_created: result.semantic_facts_created,
        episodic_events_created: result.episodic_events_created,
        procedural_routines_created: result.procedural_routines_created,
        summary: result.processing_summary
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [MemoryProcessing] Weekly processing failed', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        memories_processed: 0,
        semantic_facts_created: 0,
        episodic_events_created: 0,
        procedural_routines_created: 0,
        processing_summary: `Weekly processing failed: ${errorMessage}`,
        error: errorMessage
      };
    }
  }
});

// Step 3: Execute Monthly Introspection Tool (conditionally)
const monthlyIntrospectionStep = createStep({
  id: "monthly-introspection-step",
  description: "Perform deep introspection and wisdom extraction from memories",
  inputSchema: z.object({
    success: z.boolean(),
    memories_processed: z.number(),
    semantic_facts_created: z.number(),
    episodic_events_created: z.number(),
    procedural_routines_created: z.number(),
    processing_summary: z.string(),
    error: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    memories_analyzed: z.number(),
    wisdom_insights_created: z.number(),
    identity_patterns_found: z.number(),
    contradictions_resolved: z.number(),
    meta_insights_generated: z.number(),
    processing_summary: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const weeklyResult = inputData;
    
    // Check if it's time for monthly introspection (first day of month)
    const today = new Date();
    const isMonthlyIntrospectionDay = today.getDate() === 1;
    
    console.log('📆 [MemoryProcessing] Checking MONTHLY introspection schedule', {
      timestamp: today.toISOString(),
      dayOfMonth: today.getDate(),
      isMonthlyIntrospectionDay,
      step: 'monthly-introspection-step'
    });

    if (!isMonthlyIntrospectionDay) {
      console.log('⏭️ [MemoryProcessing] Skipping monthly introspection (not 1st of month)', {
        nextRunDate: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()
      });
      
      return {
        success: true,
        memories_analyzed: 0,
        wisdom_insights_created: 0,
        identity_patterns_found: 0,
        contradictions_resolved: 0,
        meta_insights_generated: 0,
        processing_summary: "Monthly introspection skipped - runs on 1st of each month only"
      };
    }

    try {
      console.log('🧘 [MemoryProcessing] Starting MONTHLY introspection cycle', {
        timestamp: new Date().toISOString(),
        semanticFactsAvailable: weeklyResult.semantic_facts_created,
        episodicEventsAvailable: weeklyResult.episodic_events_created
      });

      // Execute monthly introspection with default parameters
      const result = await monthlyIntrospectionTool.execute({
        context: {
          days_back: 30,
          min_confidence: 0.5,
          max_memories: 500
        },
        tracingContext: {},
        runtimeContext
      });

      console.log('✅ [MemoryProcessing] Monthly introspection completed successfully', {
        memories_analyzed: result.memories_analyzed,
        wisdom_insights_created: result.wisdom_insights_created,
        identity_patterns_found: result.identity_patterns_found,
        contradictions_resolved: result.contradictions_resolved,
        meta_insights_generated: result.meta_insights_generated,
        summary: result.processing_summary
      });

      return {
        success: true,
        memories_analyzed: result.memories_analyzed,
        wisdom_insights_created: result.wisdom_insights_created,
        identity_patterns_found: result.identity_patterns_found,
        contradictions_resolved: result.contradictions_resolved,
        meta_insights_generated: result.meta_insights_generated,
        processing_summary: result.processing_summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [MemoryProcessing] Monthly introspection failed', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        memories_analyzed: 0,
        wisdom_insights_created: 0,
        identity_patterns_found: 0,
        contradictions_resolved: 0,
        meta_insights_generated: 0,
        processing_summary: `Monthly introspection failed: ${errorMessage}`,
        error: errorMessage
      };
    }
  }
});

// Main Memory Processing Workflow
export const memoryProcessingWorkflow = createWorkflow({
  id: "memory-processing-workflow",
  description: "Orchestrates daily, weekly, and monthly memory processing cycles for Deep Tree Echo",
  inputSchema: z.object({}), // Empty input schema for time-based workflow
  outputSchema: z.object({
    success: z.boolean(),
    daily: z.object({
      processed_count: z.number(),
      working_memories_created: z.number(),
      patterns_discovered: z.number(),
      tags_created: z.number(),
    }),
    weekly: z.object({
      memories_processed: z.number(),
      semantic_facts_created: z.number(),
      episodic_events_created: z.number(),
      procedural_routines_created: z.number(),
    }),
    monthly: z.object({
      memories_analyzed: z.number(),
      wisdom_insights_created: z.number(),
      identity_patterns_found: z.number(),
      contradictions_resolved: z.number(),
      meta_insights_generated: z.number(),
    }),
    summary: z.string(),
    completedAt: z.string(),
  }),
})
  .then(dailyParsingStep)
  .then(weeklyProcessingStep)
  .then(monthlyIntrospectionStep)
  .then(createStep({
    id: "output-aggregation",
    description: "Aggregate outputs from all processing steps",
    inputSchema: z.object({
      success: z.boolean(),
      memories_analyzed: z.number(),
      wisdom_insights_created: z.number(),
      identity_patterns_found: z.number(),
      contradictions_resolved: z.number(),
      meta_insights_generated: z.number(),
      processing_summary: z.string(),
      error: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      daily: z.object({
        processed_count: z.number(),
        working_memories_created: z.number(),
        patterns_discovered: z.number(),
        tags_created: z.number(),
      }),
      weekly: z.object({
        memories_processed: z.number(),
        semantic_facts_created: z.number(),
        episodic_events_created: z.number(),
        procedural_routines_created: z.number(),
      }),
      monthly: z.object({
        memories_analyzed: z.number(),
        wisdom_insights_created: z.number(),
        identity_patterns_found: z.number(),
        contradictions_resolved: z.number(),
        meta_insights_generated: z.number(),
      }),
      summary: z.string(),
      completedAt: z.string(),
    }),
    execute: async ({ inputData }) => {
      const logger = console;
      logger.log('📊 [MemoryProcessing] Starting output aggregation', {
        timestamp: new Date().toISOString(),
        step: 'output-aggregation'
      });

      // Monthly results are passed as input
      const monthlyResults = inputData;
      
      // Build comprehensive summary showing the complete workflow status
      const summaryParts = [
        `Memory Processing Cycle Completed at ${new Date().toISOString()}`,
        `Monthly introspection: ${monthlyResults.processing_summary}`
      ];

      // For a complete solution, we'll need to store step results in a shared location
      // For now, we'll report what we can from the monthly step
      const result = {
        success: monthlyResults.success,
        daily: {
          processed_count: 0, // Will be populated from stored results in future enhancement
          working_memories_created: 0,
          patterns_discovered: 0,
          tags_created: 0,
        },
        weekly: {
          memories_processed: 0, // Will be populated from stored results in future enhancement
          semantic_facts_created: 0,
          episodic_events_created: 0,
          procedural_routines_created: 0,
        },
        monthly: {
          memories_analyzed: monthlyResults.memories_analyzed || 0,
          wisdom_insights_created: monthlyResults.wisdom_insights_created || 0,
          identity_patterns_found: monthlyResults.identity_patterns_found || 0,
          contradictions_resolved: monthlyResults.contradictions_resolved || 0,
          meta_insights_generated: monthlyResults.meta_insights_generated || 0,
        },
        summary: summaryParts.join('\n'),
        completedAt: new Date().toISOString(),
      };

      logger.log('✅ [MemoryProcessing] Output aggregation completed', {
        monthlyAnalyzed: result.monthly.memories_analyzed,
        overallSuccess: result.success,
        note: 'Daily and weekly metrics will be enhanced in future updates'
      });

      return result;
    }
  }))
  .commit();