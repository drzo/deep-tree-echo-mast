import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel, MastraLogger } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";

import { sharedPostgresStorage } from "./storage";
import { inngest, inngestServe, registerCronWorkflow } from "./inngest";
import { dailyParserTool } from "./tools/dailyParserTool";
import { weeklyProcessorTool } from "./tools/weeklyProcessorTool";
import { monthlyIntrospectionTool } from "./tools/monthlyIntrospectionTool";
import { conversationStorageTool } from "./tools/conversationStorageTool";
import { memoryQueryTool } from "./tools/memoryQueryTool";
import { memoryProcessingWorkflow } from "./workflows/memoryProcessingWorkflow";
import { deepTreeEchoAgent } from "./agents/deepTreeEchoAgent";

class ProductionPinoLogger extends MastraLogger {
  protected logger: pino.Logger;

  constructor(
    options: {
      name?: string;
      level?: LogLevel;
    } = {},
  ) {
    super(options);

    this.logger = pino({
      name: options.name || "app",
      level: options.level || LogLevel.INFO,
      base: {},
      formatters: {
        level: (label: string, _number: number) => ({
          level: label,
        }),
      },
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    });
  }

  debug(message: string, args: Record<string, any> = {}): void {
    this.logger.debug(args, message);
  }

  info(message: string, args: Record<string, any> = {}): void {
    this.logger.info(args, message);
  }

  warn(message: string, args: Record<string, any> = {}): void {
    this.logger.warn(args, message);
  }

  error(message: string, args: Record<string, any> = {}): void {
    this.logger.error(args, message);
  }
}

// Register the memory processing workflow as a cron job to run daily at 2 AM
// Using America/Los_Angeles timezone as default
registerCronWorkflow(
  `TZ=${process.env.SCHEDULE_CRON_TIMEZONE || 'America/Los_Angeles'} ${process.env.SCHEDULE_CRON_EXPRESSION || '0 2 * * *'}`, 
  memoryProcessingWorkflow
);

export const mastra = new Mastra({
  storage: sharedPostgresStorage,
  agents: { deepTreeEchoAgent },
  workflows: { memoryProcessingWorkflow },
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: { 
        dailyParserTool, 
        weeklyProcessorTool, 
        monthlyIntrospectionTool,
        conversationStorageTool,
        memoryQueryTool
      },
    }),
  },
  bundler: {
    // A few dependencies are not properly picked up by
    // the bundler if they are not added directly to the
    // entrypoint.
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming",
    ],
    // sourcemaps are good for debugging.
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    middleware: [
      async (c, next) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();
        logger?.debug("[Request]", { method: c.req.method, url: c.req.url });
        try {
          await next();
        } catch (error) {
          logger?.error("[Response]", {
            method: c.req.method,
            url: c.req.url,
            error,
          });
          if (error instanceof MastraError) {
            if (error.id === "AGENT_MEMORY_MISSING_RESOURCE_ID") {
              // This is typically a non-retirable error. It means that the request was not
              // setup correctly to pass in the necessary parameters.
              throw new NonRetriableError(error.message, { cause: error });
            }
          } else if (error instanceof z.ZodError) {
            // Validation errors are never retriable.
            throw new NonRetriableError(error.message, { cause: error });
          }

          throw error;
        }
      },
    ],
    apiRoutes: [
      // This API route is used to register the Mastra workflow (inngest function) on the inngest server
      {
        path: "/api/inngest",
        method: "ALL",
        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
        // The inngestServe function integrates Mastra workflows with Inngest by:
        // 1. Creating Inngest functions for each workflow with unique IDs (workflow.${workflowId})
        // 2. Setting up event handlers that:
        //    - Generate unique run IDs for each workflow execution
        //    - Create an InngestExecutionEngine to manage step execution
        //    - Handle workflow state persistence and real-time updates
        // 3. Establishing a publish-subscribe system for real-time monitoring
        //    through the workflow:${workflowId}:${runId} channel
      },
      // Chat API endpoint for Deep Tree Echo Agent
      {
        path: "/api/chat",
        method: "POST",
        createHandler: async ({ mastra }) => {
          return async (c: any) => {
            const logger = mastra.getLogger();
            logger?.info('🌳 [DeepTreeEcho] Chat endpoint received request', {
              method: c.req.method,
              url: c.req.url,
              timestamp: new Date().toISOString()
            });

            try {
              const body = await c.req.json();
              const { message, sessionId, threadId } = body;

              if (!message) {
                logger?.warn('⚠️ [DeepTreeEcho] Missing message in request');
                return c.json({ error: "Message is required" }, 400);
              }

              const agent = mastra.getAgent("deepTreeEchoAgent");
              if (!agent) {
                logger?.error('❌ [DeepTreeEcho] Agent not found');
                return c.json({ error: "Deep Tree Echo agent not available" }, 500);
              }

              // Generate session ID if not provided
              const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const chatThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              logger?.info('📝 [DeepTreeEcho] Processing chat message', {
                sessionId: chatSessionId,
                threadId: chatThreadId,
                messageLength: message.length
              });

              // First, query relevant memories to provide context
              logger?.info('🔍 [DeepTreeEcho] Searching memories for context');
              const runtimeContext = new RuntimeContext();
              const memoryContext = await memoryQueryTool.execute({
                context: {
                  query: message,
                  memory_types: ["semantic", "episodic", "wisdom", "working"],
                  limit_per_type: 3,
                  include_recent_working: true
                },
                mastra,
                runtimeContext,
                tracingContext: {}
              });

              logger?.info('📚 [DeepTreeEcho] Memory search completed', {
                memoriesFound: memoryContext.total_found,
                summary: memoryContext.search_summary
              });

              // Prepare context-enriched messages
              const messages: any[] = [];
              
              // Add memory context as system message if memories found
              if (memoryContext.memories && memoryContext.memories.length > 0) {
                const contextSummary = `Based on my accumulated memories:\n\n${
                  memoryContext.memories.slice(0, 5).map(m => 
                    `[${m.type}] ${m.content}`
                  ).join('\n\n')
                }`;
                
                messages.push({
                  role: "system",
                  content: contextSummary
                });

                logger?.info('💭 [DeepTreeEcho] Added memory context to conversation', {
                  contextMemories: memoryContext.memories.length
                });
              }

              // Add the user's message
              messages.push({
                role: "user",
                content: message
              });

              // Store the user's message in the database
              logger?.info('💾 [DeepTreeEcho] Storing user message');
              await conversationStorageTool.execute({
                context: {
                  session_id: chatSessionId,
                  role: "user",
                  content: message,
                  metadata: { threadId: chatThreadId }
                },
                mastra,
                runtimeContext,
                tracingContext: {}
              });

              // Generate response from the agent
              logger?.info('🤖 [DeepTreeEcho] Generating agent response');
              const response = await agent.generate(messages, {
                resourceId: chatSessionId,
                threadId: chatThreadId,
                maxSteps: 5
              });

              logger?.info('✅ [DeepTreeEcho] Agent response generated', {
                responseLength: response.text?.length || 0,
                toolCalls: response.toolCalls?.length || 0
              });

              // Store the assistant's response in the database
              if (response.text) {
                logger?.info('💾 [DeepTreeEcho] Storing assistant response');
                await conversationStorageTool.execute({
                  context: {
                    session_id: chatSessionId,
                    role: "assistant",
                    content: response.text,
                    metadata: { 
                      threadId: chatThreadId,
                      memoriesUsed: memoryContext.total_found,
                      toolCalls: response.toolCalls?.length || 0
                    }
                  },
                  mastra,
                  runtimeContext,
                  tracingContext: {}
                });
              }

              logger?.info('🎉 [DeepTreeEcho] Chat interaction completed successfully', {
                sessionId: chatSessionId,
                threadId: chatThreadId
              });

              return c.json({
                response: response.text,
                sessionId: chatSessionId,
                threadId: chatThreadId,
                memoriesUsed: memoryContext.total_found,
                memorySummary: memoryContext.search_summary,
                toolCalls: response.toolCalls
              });

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logger?.error('❌ [DeepTreeEcho] Error in chat endpoint', {
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
              });

              return c.json({ 
                error: "Failed to process chat message",
                details: errorMessage 
              }, 500);
            }
          };
        }
      },
    ],
  },
  logger:
    process.env.NODE_ENV === "production"
      ? new ProductionPinoLogger({
          name: "Mastra",
          level: "info",
        })
      : new PinoLogger({
          name: "Mastra",
          level: "info",
        }),
});

/*  Sanity check 1: Throw an error if there are more than 1 workflows.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error(
    "More than 1 workflows found. Currently, more than 1 workflows are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}

/*  Sanity check 2: Throw an error if there are more than 1 agents.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error(
    "More than 1 agents found. Currently, more than 1 agents are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}
