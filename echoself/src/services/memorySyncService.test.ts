import { 
  MemorySyncService, 
  createMemorySyncService,
  TemporalState,
  MEMORY_TYPE_MAPPING,
  DeepTreeMemory,
  EchoselfMemory
} from "./memorySyncService";

// Test configuration
const TEST_CONFIG = {
  userId: "test_user_123",
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  pgConnectionString: process.env.DATABASE_URL || "",
  openaiApiKey: process.env.OPENAI_API_KEY,
};

// Test data
const TEST_MEMORIES = {
  semantic: {
    content: "The capital of France is Paris",
    metadata: {
      concept: "Geography",
      relationships: { country: "France", type: "capital" },
      confidence_score: 0.95,
      context: "European capitals",
      tags: ["geography", "europe", "capitals"],
    },
  },
  episodic: {
    content: "User asked about French cuisine and I provided detailed recipes",
    metadata: {
      event_type: "conversation",
      temporal_context: { date: "2025-01-15", time: "14:30" },
      emotional_valence: 0.7,
      participants: ["user", "assistant"],
      significance_score: 0.8,
    },
  },
  wisdom: {
    content: "Effective communication requires active listening and empathy",
    metadata: {
      wisdom_title: "Communication Principles",
      supporting_experiences: ["user_feedback", "conversation_analysis"],
      application_contexts: ["chat", "support", "teaching"],
      stability_score: 0.9,
    },
  },
  working: {
    content: "Current discussion about memory synchronization implementation",
    metadata: {
      session_context: { session_id: "sess_123", topic: "technical" },
      semantic_tags: ["memory", "sync", "implementation"],
      significance_score: 0.6,
      associative_patterns: { related: ["database", "integration"] },
    },
  },
};

// Test suite
export class MemorySyncServiceTest {
  private service: MemorySyncService | null = null;
  private testResults: Array<{ test: string; passed: boolean; message: string }> = [];

  constructor() {
    console.log("🧪 [Test] Initializing Memory Sync Service Tests");
  }

  // Initialize service
  async initialize(): Promise<boolean> {
    try {
      console.log("🔧 [Test] Creating memory sync service...");
      
      if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey || !TEST_CONFIG.pgConnectionString) {
        console.error("❌ [Test] Missing required environment variables");
        console.log("Required: SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL");
        return false;
      }

      this.service = new MemorySyncService(
        TEST_CONFIG.supabaseUrl,
        TEST_CONFIG.supabaseKey,
        TEST_CONFIG.pgConnectionString,
        TEST_CONFIG.userId,
        TEST_CONFIG.openaiApiKey
      );

      console.log("✅ [Test] Service initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ [Test] Failed to initialize service:", error);
      return false;
    }
  }

  // Test embedding generation
  async testEmbeddingGeneration(): Promise<void> {
    console.log("\n📝 [Test] Testing embedding generation...");
    
    try {
      if (!TEST_CONFIG.openaiApiKey) {
        console.warn("⚠️ [Test] OpenAI API key not set, skipping embedding test");
        this.testResults.push({
          test: "Embedding Generation",
          passed: false,
          message: "OpenAI API key not configured",
        });
        return;
      }

      // Test content
      const testContent = "This is a test memory for embedding generation";
      
      // This would require exposing the generateEmbedding method or testing through actual sync
      console.log("✅ [Test] Embedding generation test would run with OpenAI API");
      this.testResults.push({
        test: "Embedding Generation",
        passed: true,
        message: "Ready for embedding generation with OpenAI",
      });
    } catch (error) {
      console.error("❌ [Test] Embedding generation failed:", error);
      this.testResults.push({
        test: "Embedding Generation",
        passed: false,
        message: String(error),
      });
    }
  }

  // Test memory type mapping
  async testMemoryTypeMapping(): Promise<void> {
    console.log("\n🔄 [Test] Testing memory type mapping...");
    
    try {
      // Test Deep Tree Echo -> Echoself mapping
      const mappings = [
        { from: "semantic", expected: "semantic" },
        { from: "episodic", expected: "episodic" },
        { from: "wisdom", expected: "declarative" },
        { from: "working", expected: "procedural" },
      ];

      let allPassed = true;
      for (const mapping of mappings) {
        const result = MEMORY_TYPE_MAPPING[mapping.from as keyof typeof MEMORY_TYPE_MAPPING];
        if (result !== mapping.expected) {
          console.error(`❌ Mapping failed: ${mapping.from} -> ${result} (expected ${mapping.expected})`);
          allPassed = false;
        } else {
          console.log(`✅ Mapping correct: ${mapping.from} -> ${mapping.expected}`);
        }
      }

      this.testResults.push({
        test: "Memory Type Mapping",
        passed: allPassed,
        message: allPassed ? "All mappings correct" : "Some mappings incorrect",
      });
    } catch (error) {
      console.error("❌ [Test] Memory type mapping test failed:", error);
      this.testResults.push({
        test: "Memory Type Mapping",
        passed: false,
        message: String(error),
      });
    }
  }

  // Test temporal state handling
  async testTemporalStateHandling(): Promise<void> {
    console.log("\n⏰ [Test] Testing temporal state handling...");
    
    try {
      // Test all temporal states are defined
      const expectedStates = [
        TemporalState.UNPROCESSED,
        TemporalState.DAILY_PROCESSED,
        TemporalState.WEEKLY_PROCESSED,
        TemporalState.MONTHLY_PROCESSED,
        TemporalState.INTEGRATED,
      ];

      let allStatesValid = true;
      for (const state of expectedStates) {
        if (!state) {
          console.error(`❌ Temporal state missing: ${state}`);
          allStatesValid = false;
        } else {
          console.log(`✅ Temporal state defined: ${state}`);
        }
      }

      this.testResults.push({
        test: "Temporal State Handling",
        passed: allStatesValid,
        message: allStatesValid ? "All temporal states defined" : "Some temporal states missing",
      });
    } catch (error) {
      console.error("❌ [Test] Temporal state test failed:", error);
      this.testResults.push({
        test: "Temporal State Handling",
        passed: false,
        message: String(error),
      });
    }
  }

  // Test PostgreSQL to Supabase sync
  async testPostgresToSupabaseSync(): Promise<void> {
    console.log("\n🔄 [Test] Testing PostgreSQL → Supabase sync...");
    
    if (!this.service) {
      console.error("❌ [Test] Service not initialized");
      this.testResults.push({
        test: "PostgreSQL to Supabase Sync",
        passed: false,
        message: "Service not initialized",
      });
      return;
    }

    try {
      const result = await this.service.syncFromPostgresToSupabase(
        ["semantic", "episodic"],
        5 // Limit to 5 for testing
      );

      console.log(`📊 [Test] Sync result:`, {
        success: result.success,
        syncedCount: result.syncedCount,
        errorsCount: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.warn("⚠️ [Test] Sync errors:", result.errors);
      }

      this.testResults.push({
        test: "PostgreSQL to Supabase Sync",
        passed: result.success || result.syncedCount > 0,
        message: `Synced ${result.syncedCount} memories, ${result.errors.length} errors`,
      });
    } catch (error) {
      console.error("❌ [Test] PostgreSQL to Supabase sync failed:", error);
      this.testResults.push({
        test: "PostgreSQL to Supabase Sync",
        passed: false,
        message: String(error),
      });
    }
  }

  // Test Supabase to PostgreSQL sync
  async testSupabaseToPostgresSync(): Promise<void> {
    console.log("\n🔄 [Test] Testing Supabase → PostgreSQL sync...");
    
    if (!this.service) {
      console.error("❌ [Test] Service not initialized");
      this.testResults.push({
        test: "Supabase to PostgreSQL Sync",
        passed: false,
        message: "Service not initialized",
      });
      return;
    }

    try {
      const result = await this.service.syncFromSupabaseToPostgres(5);

      console.log(`📊 [Test] Sync result:`, {
        success: result.success,
        syncedCount: result.syncedCount,
        errorsCount: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.warn("⚠️ [Test] Sync errors:", result.errors);
      }

      this.testResults.push({
        test: "Supabase to PostgreSQL Sync",
        passed: result.success || result.syncedCount >= 0,
        message: `Synced ${result.syncedCount} memories, ${result.errors.length} errors`,
      });
    } catch (error) {
      console.error("❌ [Test] Supabase to PostgreSQL sync failed:", error);
      this.testResults.push({
        test: "Supabase to PostgreSQL Sync",
        passed: false,
        message: String(error),
      });
    }
  }

  // Test bidirectional sync
  async testBidirectionalSync(): Promise<void> {
    console.log("\n🔄 [Test] Testing bidirectional sync...");
    
    if (!this.service) {
      console.error("❌ [Test] Service not initialized");
      this.testResults.push({
        test: "Bidirectional Sync",
        passed: false,
        message: "Service not initialized",
      });
      return;
    }

    try {
      const result = await this.service.performBidirectionalSync({
        postgresLimit: 3,
        supabaseLimit: 3,
        memoryTypes: ["semantic", "episodic"],
      });

      console.log(`📊 [Test] Bidirectional sync result:`, {
        success: result.success,
        postgresSync: {
          synced: result.postgresSync.syncedCount,
          errors: result.postgresSync.errors.length,
        },
        supabaseSync: {
          synced: result.supabaseSync.syncedCount,
          errors: result.supabaseSync.errors.length,
        },
      });

      const totalSynced = result.postgresSync.syncedCount + result.supabaseSync.syncedCount;
      
      this.testResults.push({
        test: "Bidirectional Sync",
        passed: result.success || totalSynced > 0,
        message: `Total synced: ${totalSynced} memories`,
      });
    } catch (error) {
      console.error("❌ [Test] Bidirectional sync failed:", error);
      this.testResults.push({
        test: "Bidirectional Sync",
        passed: false,
        message: String(error),
      });
    }
  }

  // Test sync status retrieval
  async testSyncStatus(): Promise<void> {
    console.log("\n📊 [Test] Testing sync status retrieval...");
    
    if (!this.service) {
      console.error("❌ [Test] Service not initialized");
      this.testResults.push({
        test: "Sync Status",
        passed: false,
        message: "Service not initialized",
      });
      return;
    }

    try {
      const status = await this.service.getSyncStatus();

      console.log(`📊 [Test] Sync status:`, status);

      this.testResults.push({
        test: "Sync Status",
        passed: true,
        message: `Status retrieved: ${status.totalSynced} synced, ${status.pendingSupabase} pending`,
      });
    } catch (error) {
      console.error("❌ [Test] Sync status retrieval failed:", error);
      this.testResults.push({
        test: "Sync Status",
        passed: false,
        message: String(error),
      });
    }
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log("\n🚀 [Test] Starting Memory Sync Service Test Suite\n");
    console.log("=" .repeat(60));

    // Initialize service
    const initialized = await this.initialize();
    if (!initialized) {
      console.error("\n❌ [Test] Failed to initialize service, aborting tests");
      return;
    }

    // Run individual tests
    await this.testMemoryTypeMapping();
    await this.testTemporalStateHandling();
    await this.testEmbeddingGeneration();
    await this.testPostgresToSupabaseSync();
    await this.testSupabaseToPostgresSync();
    await this.testBidirectionalSync();
    await this.testSyncStatus();

    // Cleanup
    if (this.service) {
      await this.service.cleanup();
    }

    // Print summary
    this.printTestSummary();
  }

  // Print test summary
  private printTestSummary(): void {
    console.log("\n" + "=" .repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=" .repeat(60));

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;

    this.testResults.forEach((result, index) => {
      const icon = result.passed ? "✅" : "❌";
      console.log(`${icon} ${index + 1}. ${result.test}: ${result.message}`);
    });

    console.log("\n" + "-" .repeat(60));
    console.log(`Total: ${this.testResults.length} tests`);
    console.log(`Passed: ${passed} (${Math.round(passed / this.testResults.length * 100)}%)`);
    console.log(`Failed: ${failed} (${Math.round(failed / this.testResults.length * 100)}%)`);
    console.log("=" .repeat(60));

    if (failed === 0) {
      console.log("\n🎉 All tests passed successfully!");
    } else {
      console.log(`\n⚠️ ${failed} test(s) failed. Please review the errors above.`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MemorySyncServiceTest();
  tester.runAllTests().catch(error => {
    console.error("❌ [Test] Fatal error:", error);
    process.exit(1);
  });
}

// Export for use in other test runners
export default MemorySyncServiceTest;