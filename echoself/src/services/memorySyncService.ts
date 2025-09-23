import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { OpenAI } from "openai";

// Memory type mappings between systems
export const MEMORY_TYPE_MAPPING = {
  // Deep Tree Echo -> Echoself
  semantic: "semantic",
  episodic: "episodic",
  wisdom: "declarative",
  working: "procedural",
  // Echoself -> Deep Tree Echo (reverse mapping)
  memory: "working", // Default generic memories go to working memory
  implicit: "working",
  associative: "semantic",
} as const;

// Temporal processing states
export enum TemporalState {
  UNPROCESSED = "unprocessed",
  DAILY_PROCESSED = "daily_processed",
  WEEKLY_PROCESSED = "weekly_processed",
  MONTHLY_PROCESSED = "monthly_processed",
  INTEGRATED = "integrated",
}

export interface SyncMetadata {
  lastSyncTimestamp?: string;
  syncDirection?: "postgres_to_supabase" | "supabase_to_postgres" | "bidirectional";
  temporalState?: TemporalState;
  processingHistory?: Array<{
    timestamp: string;
    processType: string;
    status: string;
  }>;
}

export interface DeepTreeMemory {
  id?: string;
  type: "semantic" | "episodic" | "wisdom" | "working";
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at?: string;
  temporal_state?: TemporalState;
}

export interface EchoselfMemory {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  embedding?: number[] | null;
  type: string;
  context?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export class MemorySyncService {
  private supabase: ReturnType<typeof createClient>;
  private pgPool: Pool;
  private openai: OpenAI | null = null;
  private userId: string;
  private logger: Console = console;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    pgConnectionString: string,
    userId: string,
    openaiApiKey?: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.pgPool = new Pool({ connectionString: pgConnectionString });
    this.userId = userId;

    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
  }

  // Generate embeddings compatible with both systems (1536 dimensions)
  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) {
      this.logger.warn("⚠️ [MemorySync] OpenAI not initialized, skipping embedding generation");
      return null;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-large",
        input: text,
        dimensions: 1536, // Ensure 1536 dimensions for both systems
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error("❌ [MemorySync] Error generating embedding:", error);
      return null;
    }
  }

  // Convert Deep Tree Echo memory to Echoself format
  private convertToEchoselfMemory(
    deepTreeMemory: DeepTreeMemory,
    memoryType: string
  ): EchoselfMemory {
    const metadata = deepTreeMemory.metadata || {};
    
    // Extract tags based on memory type
    let tags: string[] = [];
    if (memoryType === "semantic" && metadata.tags) {
      tags = Array.isArray(metadata.tags) ? metadata.tags : [metadata.tags];
    } else if (memoryType === "episodic" && metadata.participants) {
      tags = Array.isArray(metadata.participants) ? metadata.participants : [];
    } else if (memoryType === "wisdom" && metadata.application_contexts) {
      tags = Array.isArray(metadata.application_contexts) ? metadata.application_contexts : [];
    } else if (memoryType === "working" && metadata.semantic_tags) {
      tags = Array.isArray(metadata.semantic_tags) ? metadata.semantic_tags : [];
    }

    // Create title based on memory type
    let title = "Memory";
    if (memoryType === "semantic" && metadata.concept) {
      title = `Concept: ${metadata.concept}`;
    } else if (memoryType === "episodic" && metadata.event_type) {
      title = `Event: ${metadata.event_type}`;
    } else if (memoryType === "wisdom" && metadata.wisdom_title) {
      title = metadata.wisdom_title;
    }

    // Map memory type
    const mappedType = MEMORY_TYPE_MAPPING[memoryType as keyof typeof MEMORY_TYPE_MAPPING] || "memory";

    return {
      user_id: this.userId,
      title,
      content: deepTreeMemory.content,
      tags,
      embedding: deepTreeMemory.embedding,
      type: mappedType,
      context: metadata.context || metadata.session_context,
      metadata: {
        ...metadata,
        source: "deep_tree_echo",
        original_type: memoryType,
        temporal_state: deepTreeMemory.temporal_state,
        sync_metadata: {
          lastSyncTimestamp: new Date().toISOString(),
          syncDirection: "postgres_to_supabase",
        } as SyncMetadata,
      },
      created_at: deepTreeMemory.created_at,
      updated_at: new Date().toISOString(),
    };
  }

  // Convert Echoself memory to Deep Tree Echo format
  private convertToDeepTreeMemory(echoselfMemory: EchoselfMemory): DeepTreeMemory {
    const metadata = echoselfMemory.metadata || {};
    
    // Determine target memory type based on echoself type
    let targetType: DeepTreeMemory["type"] = "working";
    if (echoselfMemory.type === "semantic" || echoselfMemory.type === "associative") {
      targetType = "semantic";
    } else if (echoselfMemory.type === "episodic") {
      targetType = "episodic";
    } else if (echoselfMemory.type === "declarative") {
      targetType = "wisdom";
    }

    return {
      type: targetType,
      content: echoselfMemory.content,
      embedding: echoselfMemory.embedding || undefined,
      metadata: {
        ...metadata,
        title: echoselfMemory.title,
        tags: echoselfMemory.tags,
        context: echoselfMemory.context,
        source: "echoself",
        original_type: echoselfMemory.type,
        user_id: echoselfMemory.user_id,
      },
      created_at: echoselfMemory.created_at,
      temporal_state: metadata.temporal_state || TemporalState.UNPROCESSED,
    };
  }

  // Sync from PostgreSQL to Supabase
  public async syncFromPostgresToSupabase(
    memoryTypes: Array<"semantic" | "episodic" | "wisdom" | "working"> = ["semantic", "episodic", "wisdom", "working"],
    limit: number = 100
  ): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    this.logger.info("🔄 [MemorySync] Starting PostgreSQL → Supabase sync", {
      memoryTypes,
      limit,
      userId: this.userId,
    });

    for (const memoryType of memoryTypes) {
      try {
        this.logger.info(`📊 [MemorySync] Syncing ${memoryType} memories`);
        
        // Fetch memories from PostgreSQL
        const memories = await this.fetchPostgresMemories(memoryType, limit);
        
        this.logger.info(`✅ [MemorySync] Found ${memories.length} ${memoryType} memories to sync`);

        // Convert and sync each memory
        for (const memory of memories) {
          try {
            // Check if memory already exists in Supabase
            const existingCheck = await this.checkSupabaseMemoryExists(memory);
            if (existingCheck) {
              this.logger.debug(`⏭️ [MemorySync] Memory already exists, skipping`, {
                type: memoryType,
                content: memory.content.substring(0, 50),
              });
              continue;
            }

            // Convert to Echoself format
            const echoselfMemory = this.convertToEchoselfMemory(memory, memoryType);
            
            // Ensure embedding compatibility
            if (!echoselfMemory.embedding && echoselfMemory.content) {
              echoselfMemory.embedding = await this.generateEmbedding(echoselfMemory.content);
            }

            // Insert into Supabase
            const { error } = await this.supabase
              .from("memories")
              .insert(echoselfMemory);

            if (error) {
              throw error;
            }

            syncedCount++;
            this.logger.debug(`✅ [MemorySync] Synced ${memoryType} memory`, {
              title: echoselfMemory.title,
            });
          } catch (error) {
            const errorMsg = `Failed to sync individual ${memoryType} memory: ${error}`;
            errors.push(errorMsg);
            this.logger.error(`❌ [MemorySync] ${errorMsg}`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to fetch ${memoryType} memories: ${error}`;
        errors.push(errorMsg);
        this.logger.error(`❌ [MemorySync] ${errorMsg}`);
      }
    }

    this.logger.info(`🎉 [MemorySync] PostgreSQL → Supabase sync completed`, {
      syncedCount,
      errorsCount: errors.length,
    });

    return { success: errors.length === 0, syncedCount, errors };
  }

  // Sync from Supabase to PostgreSQL
  public async syncFromSupabaseToPostgres(
    limit: number = 100
  ): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    this.logger.info("🔄 [MemorySync] Starting Supabase → PostgreSQL sync", {
      limit,
      userId: this.userId,
    });

    try {
      // Fetch memories from Supabase that haven't been synced
      const { data: memories, error } = await this.supabase
        .from("memories")
        .select("*")
        .eq("user_id", this.userId)
        .or("metadata->>source.neq.deep_tree_echo,metadata->>source.is.null")
        .limit(limit);

      if (error) {
        throw error;
      }

      this.logger.info(`✅ [MemorySync] Found ${memories?.length || 0} memories to sync`);

      for (const memory of memories || []) {
        try {
          // Convert to Deep Tree Echo format
          const deepTreeMemory = this.convertToDeepTreeMemory(memory);
          
          // Ensure embedding compatibility
          if (!deepTreeMemory.embedding && deepTreeMemory.content) {
            deepTreeMemory.embedding = await this.generateEmbedding(deepTreeMemory.content);
          }

          // Insert into appropriate PostgreSQL table
          await this.insertPostgresMemory(deepTreeMemory);
          
          syncedCount++;
          this.logger.debug(`✅ [MemorySync] Synced memory to ${deepTreeMemory.type}`, {
            title: memory.title,
          });

          // Update Supabase metadata to mark as synced
          await this.supabase
            .from("memories")
            .update({
              metadata: {
                ...memory.metadata,
                source: "synced",
                last_sync: new Date().toISOString(),
              },
            })
            .eq("id", memory.id);
        } catch (error) {
          const errorMsg = `Failed to sync individual memory: ${error}`;
          errors.push(errorMsg);
          this.logger.error(`❌ [MemorySync] ${errorMsg}`);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to fetch Supabase memories: ${error}`;
      errors.push(errorMsg);
      this.logger.error(`❌ [MemorySync] ${errorMsg}`);
    }

    this.logger.info(`🎉 [MemorySync] Supabase → PostgreSQL sync completed`, {
      syncedCount,
      errorsCount: errors.length,
    });

    return { success: errors.length === 0, syncedCount, errors };
  }

  // Bidirectional sync
  public async performBidirectionalSync(
    options: {
      postgresLimit?: number;
      supabaseLimit?: number;
      memoryTypes?: Array<"semantic" | "episodic" | "wisdom" | "working">;
    } = {}
  ): Promise<{ success: boolean; postgresSync: any; supabaseSync: any }> {
    this.logger.info("🔄 [MemorySync] Starting bidirectional sync", options);

    // First sync from PostgreSQL to Supabase
    const postgresSync = await this.syncFromPostgresToSupabase(
      options.memoryTypes,
      options.postgresLimit
    );

    // Then sync from Supabase to PostgreSQL
    const supabaseSync = await this.syncFromSupabaseToPostgres(
      options.supabaseLimit
    );

    const success = postgresSync.success && supabaseSync.success;
    
    this.logger.info(`🎉 [MemorySync] Bidirectional sync completed`, {
      success,
      totalSynced: postgresSync.syncedCount + supabaseSync.syncedCount,
    });

    return { success, postgresSync, supabaseSync };
  }

  // Fetch memories from PostgreSQL
  private async fetchPostgresMemories(
    memoryType: "semantic" | "episodic" | "wisdom" | "working",
    limit: number
  ): Promise<DeepTreeMemory[]> {
    let query = "";
    let mapRow: (row: any) => DeepTreeMemory;

    switch (memoryType) {
      case "semantic":
        query = `
          SELECT concept, fact_text, relationships, confidence_score, 
                 context, tags, embedding, created_at
          FROM semantic_memory
          ORDER BY created_at DESC
          LIMIT $1
        `;
        mapRow = (row) => ({
          type: "semantic",
          content: `${row.concept}: ${row.fact_text}`,
          embedding: row.embedding,
          metadata: {
            concept: row.concept,
            relationships: row.relationships,
            confidence_score: row.confidence_score,
            context: row.context,
            tags: row.tags,
          },
          created_at: row.created_at,
        });
        break;

      case "episodic":
        query = `
          SELECT event_type, event_description, temporal_context,
                 emotional_valence, participants, outcome, 
                 significance_score, embedding, created_at
          FROM episodic_memory
          ORDER BY created_at DESC
          LIMIT $1
        `;
        mapRow = (row) => ({
          type: "episodic",
          content: `${row.event_description}. Outcome: ${row.outcome}`,
          embedding: row.embedding,
          metadata: {
            event_type: row.event_type,
            temporal_context: row.temporal_context,
            emotional_valence: row.emotional_valence,
            participants: row.participants,
            significance_score: row.significance_score,
          },
          created_at: row.created_at,
        });
        break;

      case "wisdom":
        query = `
          SELECT wisdom_title, wisdom_content, supporting_experiences,
                 application_contexts, stability_score, embedding, created_at
          FROM wisdom_repository
          ORDER BY created_at DESC
          LIMIT $1
        `;
        mapRow = (row) => ({
          type: "wisdom",
          content: row.wisdom_content,
          embedding: row.embedding,
          metadata: {
            wisdom_title: row.wisdom_title,
            supporting_experiences: row.supporting_experiences,
            application_contexts: row.application_contexts,
            stability_score: row.stability_score,
          },
          created_at: row.created_at,
        });
        break;

      case "working":
        query = `
          SELECT raw_content, session_context, semantic_tags,
                 significance_score, associative_patterns, embedding, created_at
          FROM working_memory
          WHERE created_at >= NOW() - INTERVAL '7 days'
          ORDER BY created_at DESC
          LIMIT $1
        `;
        mapRow = (row) => ({
          type: "working",
          content: row.raw_content,
          embedding: row.embedding,
          metadata: {
            session_context: row.session_context,
            semantic_tags: row.semantic_tags,
            significance_score: row.significance_score,
            associative_patterns: row.associative_patterns,
          },
          created_at: row.created_at,
        });
        break;

      default:
        throw new Error(`Unknown memory type: ${memoryType}`);
    }

    const result = await this.pgPool.query(query, [limit]);
    return result.rows.map(mapRow);
  }

  // Check if memory exists in Supabase
  private async checkSupabaseMemoryExists(memory: DeepTreeMemory): Promise<boolean> {
    const { data } = await this.supabase
      .from("memories")
      .select("id")
      .eq("user_id", this.userId)
      .eq("content", memory.content)
      .single();

    return !!data;
  }

  // Insert memory into PostgreSQL
  private async insertPostgresMemory(memory: DeepTreeMemory): Promise<void> {
    const embeddingStr = memory.embedding ? JSON.stringify(memory.embedding) : null;

    switch (memory.type) {
      case "semantic":
        await this.pgPool.query(
          `INSERT INTO semantic_memory 
           (concept, fact_text, relationships, confidence_score, context, tags, embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7::vector)`,
          [
            memory.metadata.title || "Concept",
            memory.content,
            memory.metadata.relationships || {},
            memory.metadata.confidence_score || 0.5,
            memory.metadata.context,
            memory.metadata.tags || [],
            embeddingStr,
          ]
        );
        break;

      case "episodic":
        await this.pgPool.query(
          `INSERT INTO episodic_memory 
           (event_type, event_description, temporal_context, emotional_valence, 
            participants, outcome, significance_score, embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)`,
          [
            memory.metadata.event_type || "Event",
            memory.content,
            memory.metadata.temporal_context || {},
            memory.metadata.emotional_valence || 0,
            memory.metadata.participants || [],
            memory.metadata.outcome || "",
            memory.metadata.significance_score || 0.5,
            embeddingStr,
          ]
        );
        break;

      case "wisdom":
        await this.pgPool.query(
          `INSERT INTO wisdom_repository 
           (wisdom_title, wisdom_content, supporting_experiences, 
            application_contexts, stability_score, embedding)
           VALUES ($1, $2, $3, $4, $5, $6::vector)`,
          [
            memory.metadata.wisdom_title || memory.metadata.title || "Insight",
            memory.content,
            memory.metadata.supporting_experiences || [],
            memory.metadata.application_contexts || [],
            memory.metadata.stability_score || 0.5,
            embeddingStr,
          ]
        );
        break;

      case "working":
        await this.pgPool.query(
          `INSERT INTO working_memory 
           (content_hash, raw_content, session_context, semantic_tags, 
            significance_score, associative_patterns, embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7::vector)`,
          [
            memory.metadata.content_hash || this.generateContentHash(memory.content),
            memory.content,
            memory.metadata.session_context || {},
            memory.metadata.semantic_tags || memory.metadata.tags || [],
            memory.metadata.significance_score || 0.5,
            memory.metadata.associative_patterns || {},
            embeddingStr,
          ]
        );
        break;
    }
  }

  // Generate content hash for working memory
  private generateContentHash(content: string): string {
    // Simple hash generation (you might want to use a proper hashing library)
    return Buffer.from(content).toString("base64").substring(0, 32);
  }

  // Update temporal state metadata
  public async updateTemporalState(
    memoryId: string,
    temporalState: TemporalState,
    source: "supabase" | "postgres"
  ): Promise<void> {
    this.logger.info(`📝 [MemorySync] Updating temporal state`, {
      memoryId,
      temporalState,
      source,
    });

    if (source === "supabase") {
      const { error } = await this.supabase
        .from("memories")
        .update({
          metadata: {
            temporal_state: temporalState,
            last_processed: new Date().toISOString(),
          },
        })
        .eq("id", memoryId);

      if (error) {
        throw error;
      }
    } else {
      // For PostgreSQL, you'd need to add a temporal_state column or store in metadata
      // This is a simplified example
      this.logger.warn("⚠️ [MemorySync] PostgreSQL temporal state update not implemented");
    }
  }

  // Get sync status
  public async getSyncStatus(): Promise<{
    lastSync: string | null;
    pendingPostgres: number;
    pendingSupabase: number;
    totalSynced: number;
  }> {
    try {
      // Get last sync timestamp from Supabase
      const { data: lastSyncData } = await this.supabase
        .from("memories")
        .select("metadata")
        .eq("user_id", this.userId)
        .order("updated_at", { ascending: false })
        .limit(1);

      const lastSync = lastSyncData?.[0]?.metadata?.sync_metadata?.lastSyncTimestamp || null;

      // Count pending items (simplified - you'd need more complex queries)
      const { count: pendingSupabase } = await this.supabase
        .from("memories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", this.userId)
        .or("metadata->>source.neq.deep_tree_echo,metadata->>source.is.null");

      // For PostgreSQL pending count, you'd need to track sync status
      const pendingPostgres = 0; // Simplified

      const { count: totalSynced } = await this.supabase
        .from("memories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", this.userId)
        .eq("metadata->>source", "synced");

      return {
        lastSync,
        pendingPostgres,
        pendingSupabase: pendingSupabase || 0,
        totalSynced: totalSynced || 0,
      };
    } catch (error) {
      this.logger.error("❌ [MemorySync] Error getting sync status:", error);
      return {
        lastSync: null,
        pendingPostgres: 0,
        pendingSupabase: 0,
        totalSynced: 0,
      };
    }
  }

  // Cleanup resources
  public async cleanup(): Promise<void> {
    await this.pgPool.end();
  }
}

// Factory function to create a memory sync service
export function createMemorySyncService(
  userId: string,
  options?: {
    supabaseUrl?: string;
    supabaseKey?: string;
    pgConnectionString?: string;
    openaiApiKey?: string;
  }
): MemorySyncService {
  const supabaseUrl = options?.supabaseUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = options?.supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const pgConnectionString = options?.pgConnectionString || process.env.DATABASE_URL;
  const openaiApiKey = options?.openaiApiKey || process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase configuration missing");
  }

  if (!pgConnectionString) {
    throw new Error("PostgreSQL connection string missing");
  }

  return new MemorySyncService(
    supabaseUrl,
    supabaseKey,
    pgConnectionString,
    userId,
    openaiApiKey
  );
}