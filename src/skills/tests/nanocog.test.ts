/**
 * NanoCog Meta-Cognitive System Test Suite
 * 
 * Comprehensive tests for the NanoCog orchestrator, skill selection optimization,
 * confidence-based recommendations, and performance monitoring.
 */

import { nanoCogOrchestrator, nanoCogTaskSchema, NanoCogTask } from '../nanocog/nanocog-orchestrator';
import { skillSelectionOptimizer, recommendationEngine } from '../nanocog/execution-engine';
import { nanoCogTool, nanoCogAnalysisTool, NanoCogSystemManager } from '../nanocog';

describe('NanoCog Meta-Cognitive System', () => {
  
  beforeAll(async () => {
    // Initialize NanoCog system before running tests
    await NanoCogSystemManager.initializeNanoCog();
  });

  describe('Task Analysis and Categorization', () => {
    
    test('should correctly categorize code analysis tasks', async () => {
      const task: NanoCogTask = {
        task: 'Analyze the code quality of this JavaScript function and provide recommendations',
        context: {
          code: 'function processUser(user) { return user.name + " processed"; }',
          domain: 'software-engineering'
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result.analysis.category).toBe('code-analysis');
      expect(result.analysis.domains).toContain('software-engineering');
      expect(result.analysis.requiredSkills).toContain('code-analysis');
      expect(result.analysis.confidence).toBeGreaterThan(0.5);
      expect(result.analysis.reasoning).toContain('code');
    });

    test('should correctly categorize problem-solving tasks', async () => {
      const task: NanoCogTask = {
        task: 'Debug the issue where the API returns 500 errors intermittently',
        context: {
          domain: 'debugging'
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result.analysis.category).toBe('problem-solving');
      expect(result.analysis.domains).toContain('problem-solving');
      expect(result.analysis.requiredSkills).toContain('reasoning');
      expect(result.analysis.complexity).toMatch(/medium|high/);
    });

    test('should identify complex multistep tasks', async () => {
      const task: NanoCogTask = {
        task: 'Analyze the code, optimize performance, and implement learning for future improvements',
        context: {
          code: 'function complexOperation() { /* complex logic */ }',
          optimization: true,
          learning: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result.analysis.category).toBe('complex-multistep');
      expect(result.analysis.requiredSkills.length).toBeGreaterThan(1);
      expect(result.analysis.complexity).toMatch(/high|extreme/);
      expect(result.analysis.estimatedCognitiveLoad).toBeGreaterThan(0.5);
    });

    test('should assess task complexity accurately', async () => {
      const simpleTasks = [
        { task: 'Check code syntax', expectedComplexity: 'low' },
        { task: 'Analyze multiple system components and optimize performance across different layers', expectedComplexity: 'high' }
      ];

      for (const { task, expectedComplexity } of simpleTasks) {
        const nanoCogTask: NanoCogTask = { task, mode: 'analyze-only' };
        const result = await nanoCogOrchestrator.orchestrate(nanoCogTask);
        
        if (expectedComplexity === 'low') {
          expect(['low', 'medium']).toContain(result.analysis.complexity);
        } else {
          expect(['high', 'extreme']).toContain(result.analysis.complexity);
        }
      }
    });
  });

  describe('Skill Selection Optimization', () => {
    
    test('should optimize skill sequence based on priorities', () => {
      const mockRecommendations = [
        {
          skillId: 'adaptive-learning',
          skillName: 'Learning',
          priority: 0.6,
          confidence: 0.8,
          reasoning: 'Learning skill',
          expectedContribution: 0.5,
          riskFactors: [],
          dependencies: ['reasoning-results']
        },
        {
          skillId: 'code-analysis',
          skillName: 'Code Analysis',
          priority: 1.0,
          confidence: 0.9,
          reasoning: 'Code analysis skill',
          expectedContribution: 0.8,
          riskFactors: [],
          dependencies: []
        }
      ];

      const mockAnalysis = {
        id: 'test',
        category: 'code-analysis' as const,
        complexity: 'medium' as const,
        domains: ['software-engineering'],
        requiredSkills: ['code-analysis'],
        estimatedCognitiveLoad: 0.5,
        confidence: 0.8,
        reasoning: 'Test analysis'
      };

      const optimized = skillSelectionOptimizer.optimizeSkillSequence(mockRecommendations, mockAnalysis);
      
      expect(optimized[0].skillId).toBe('code-analysis'); // Higher priority should come first
      expect(optimized.length).toBe(2);
    });

    test('should calculate optimal parallelization groups', () => {
      const mockRecommendations = [
        {
          skillId: 'code-analysis',
          skillName: 'Code Analysis',
          priority: 0.9,
          confidence: 0.8,
          reasoning: 'Test',
          expectedContribution: 0.8,
          riskFactors: [],
          dependencies: []
        },
        {
          skillId: 'production-optimization',
          skillName: 'Optimization',
          priority: 0.7,
          confidence: 0.7,
          reasoning: 'Test',
          expectedContribution: 0.6,
          riskFactors: [],
          dependencies: []
        },
        {
          skillId: 'advanced-reasoning',
          skillName: 'Reasoning',
          priority: 0.8,
          confidence: 0.9,
          reasoning: 'Test',
          expectedContribution: 0.9,
          riskFactors: [],
          dependencies: ['code-analysis-results']
        }
      ];

      const parallelGroups = skillSelectionOptimizer.calculateOptimalParallelization(mockRecommendations);
      
      expect(parallelGroups.get('parallel-analysis')).toContain('code-analysis');
      expect(parallelGroups.get('parallel-analysis')).toContain('production-optimization');
      expect(parallelGroups.get('post-analysis')).toContain('advanced-reasoning');
    });

    test('should assess skill compatibility correctly', () => {
      const compatibility1 = skillSelectionOptimizer.assessSkillCompatibility('code-analysis', 'advanced-reasoning');
      const compatibility2 = skillSelectionOptimizer.assessSkillCompatibility('code-analysis', 'production-optimization');
      
      expect(compatibility1).toBeGreaterThan(compatibility2); // Code analysis feeds reasoning better
      expect(compatibility1).toBeGreaterThan(0.8);
      expect(compatibility2).toBeGreaterThan(0.5);
    });
  });

  describe('Confidence-Based Recommendations', () => {
    
    test('should generate appropriate skill recommendations', () => {
      const mockAnalysis = {
        id: 'test',
        category: 'code-analysis' as const,
        complexity: 'medium' as const,
        domains: ['software-engineering', 'code-quality'],
        requiredSkills: ['code-analysis'],
        estimatedCognitiveLoad: 0.5,
        confidence: 0.8,
        reasoning: 'Test analysis'
      };

      const historicalPerformance = new Map([
        ['code-analysis', [0.85, 0.90, 0.88]],
        ['advanced-reasoning', [0.75, 0.80, 0.78]]
      ]);

      const recommendations = recommendationEngine.generateRecommendations(
        mockAnalysis,
        historicalPerformance,
        0.6
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].skillId).toBe('code-analysis'); // Should recommend primary skill first
      expect(recommendations[0].confidence).toBeGreaterThan(0.7);
      expect(recommendations[0].expectedContribution).toBeGreaterThan(0.8);
    });

    test('should predict skill performance accurately', () => {
      const prediction1 = recommendationEngine.predictSkillPerformance('code-analysis', { complexity: 'low' });
      const prediction2 = recommendationEngine.predictSkillPerformance('advanced-reasoning', { complexity: 'high' });
      
      expect(prediction1).toBeGreaterThan(0.1);
      expect(prediction1).toBeLessThan(1.0);
      expect(prediction2).toBeGreaterThan(0.1);
      expect(prediction2).toBeLessThan(1.0);
    });

    test('should update confidence scores using Bayesian inference', () => {
      const mockResults = [
        {
          skillId: 'code-analysis',
          success: true,
          result: { quality: 0.85 },
          executionTime: 200,
          confidence: 0.9,
          insights: ['Good code structure'],
          errors: []
        },
        {
          skillId: 'advanced-reasoning',
          success: false,
          result: null,
          executionTime: 800,
          confidence: 0.3,
          insights: [],
          errors: ['Timeout error']
        }
      ];

      const updatedScores = recommendationEngine.updateConfidenceScores(mockResults);
      
      expect(updatedScores.get('code-analysis')).toBeGreaterThan(0.7);
      expect(updatedScores.get('advanced-reasoning')).toBeLessThan(0.5);
    });
  });

  describe('Execution Plan Generation', () => {
    
    test('should generate comprehensive execution plan', async () => {
      const task: NanoCogTask = {
        task: 'Analyze code quality and optimize performance',
        context: {
          code: 'function test() { return "hello"; }',
          optimization: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result.executionPlan.phases.length).toBeGreaterThan(0);
      expect(result.executionPlan.totalEstimatedTime).toBeGreaterThan(0);
      expect(result.executionPlan.confidenceScore).toBeGreaterThan(0.5);
      expect(result.executionPlan.riskMitigation).toBeInstanceOf(Array);
    });

    test('should identify parallel execution opportunities', async () => {
      const task: NanoCogTask = {
        task: 'Analyze code and monitor system performance',
        context: {
          code: 'function example() {}',
          optimization: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      const parallelPhases = result.executionPlan.phases.filter(phase => phase.isParallel);
      expect(parallelPhases.length).toBeGreaterThan(0);
    });
  });

  describe('Meta-Cognitive Insights', () => {
    
    test('should generate meaningful insights', async () => {
      const task: NanoCogTask = {
        task: 'Complex system analysis with learning capabilities',
        context: {
          code: 'function complexSystem() { /* implementation */ }',
          optimization: true,
          learning: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result.insights).toBeDefined();
      expect(result.insights.patternRecognition).toBeDefined();
      expect(result.insights.learningOpportunities).toBeInstanceOf(Array);
      expect(result.insights.skillImprovements).toBeInstanceOf(Array);
      expect(result.insights.systemOptimizations).toBeInstanceOf(Array);
    });

    test('should track learning outcomes', async () => {
      const task: NanoCogTask = {
        task: 'Learn from this task execution',
        context: {
          learning: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result.learningOutcome).toBeDefined();
      expect(result.learningOutcome.patternsLearned).toBeInstanceOf(Array);
      expect(result.learningOutcome.confidenceUpdates).toBeDefined();
      expect(result.learningOutcome.recommendationsForFuture).toBeInstanceOf(Array);
    });
  });

  describe('Mastra Tool Integration', () => {
    
    test('should validate input schema correctly', () => {
      const validTask = {
        task: 'Test task',
        context: {
          code: 'function test() {}',
          optimization: true
        },
        mode: 'analyze-only' as const
      };

      const invalidTask = {
        // Missing required 'task' field
        context: {
          code: 'function test() {}'
        }
      };

      expect(() => nanoCogTaskSchema.parse(validTask)).not.toThrow();
      expect(() => nanoCogTaskSchema.parse(invalidTask)).toThrow();
    });

    test('nanoCogTool should execute successfully', async () => {
      const context = {
        input: {
          task: 'Analyze this code for quality issues',
          context: {
            code: 'function simpleTest() { return 42; }'
          },
          mode: 'analyze-only' as const
        }
      };

      const result = await nanoCogTool.execute({ context });
      
      expect(result).toBeDefined();
      expect(result.taskId).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
    });

    test('nanoCogAnalysisTool should provide quick analysis', async () => {
      const context = {
        input: {
          task: 'Quick analysis of task requirements',
          context: {
            domain: 'software-engineering',
            complexity: 'medium' as const
          }
        }
      };

      const result = await nanoCogAnalysisTool.execute({ context });
      
      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.optimizationOpportunities).toBeInstanceOf(Array);
      expect(result.estimatedExecutionTime).toBeGreaterThan(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    
    test('should handle empty task gracefully', async () => {
      const task: NanoCogTask = {
        task: '',
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result).toBeDefined();
      expect(result.analysis.category).toBe('research'); // Default fallback
      expect(result.analysis.confidence).toBeGreaterThan(0);
    });

    test('should handle tasks without context', async () => {
      const task: NanoCogTask = {
        task: 'Simple task without context',
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const task: NanoCogTask = {
        task: 'Performance test task with medium complexity',
        context: {
          code: 'function performanceTest() { return "test"; }',
          optimization: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result).toBeDefined();
    });

    test('should handle concurrent orchestration requests', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        task: `Concurrent test task ${i}`,
        context: {
          code: `function test${i}() { return ${i}; }`
        },
        mode: 'analyze-only' as const
      }));

      const promises = tasks.map(task => nanoCogOrchestrator.orchestrate(task));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.taskId).toContain('nanocog');
        expect(result.analysis).toBeDefined();
      });
    });
  });

  describe('System Health and Status', () => {
    
    test('should provide system status', () => {
      const status = NanoCogSystemManager.getNanoStatus();
      
      expect(status).toBeDefined();
      expect(status.version).toBeDefined();
      expect(status.capabilities).toBeInstanceOf(Array);
      expect(status.enhancements).toBeInstanceOf(Array);
      expect(status.status).toBe('Operational');
    });

    test('should perform health check', async () => {
      const healthCheck = await NanoCogSystemManager.performNanoCogHealthCheck();
      
      expect(healthCheck).toBeDefined();
      expect(healthCheck.overallHealth).toBeDefined();
      expect(healthCheck.orchestrator).toBeDefined();
      expect(healthCheck.optimizer).toBeDefined();
      expect(healthCheck.recommendationEngine).toBeDefined();
      expect(healthCheck.lastCheck).toBeDefined();
    });
  });

  describe('Integration with Existing Cognitive Skills', () => {
    
    test('should maintain compatibility with existing orchestrator', async () => {
      // This test ensures NanoCog doesn't break existing functionality
      const task: NanoCogTask = {
        task: 'Test compatibility with existing cognitive skills',
        context: {
          code: 'function compatibility() { return true; }',
          optimization: true,
          learning: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(task);
      
      expect(result).toBeDefined();
      expect(result.recommendations.some(rec => 
        ['code-analysis', 'advanced-reasoning', 'production-optimization', 'adaptive-learning'].includes(rec.skillId)
      )).toBe(true);
    });

    test('should enhance existing skill selection', async () => {
      const complexTask: NanoCogTask = {
        task: 'Complex multistep task requiring all cognitive skills',
        context: {
          code: 'function complexLogic() { /* very complex implementation */ }',
          optimization: true,
          learning: true
        },
        mode: 'analyze-only'
      };

      const result = await nanoCogOrchestrator.orchestrate(complexTask);
      
      expect(result.recommendations.length).toBeGreaterThan(2); // Should recommend multiple skills
      expect(result.executionPlan.phases.length).toBeGreaterThan(1); // Should have multiple phases
      expect(result.analysis.complexity).toMatch(/high|extreme/); // Should detect complexity
    });
  });
});

// Helper functions for testing
function createMockSkillExecutionResult(skillId: string, success: boolean = true) {
  return {
    skillId,
    success,
    result: success ? { mockResult: true } : null,
    executionTime: Math.random() * 500 + 100,
    confidence: success ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.3,
    insights: success ? ['Mock insight'] : [],
    errors: success ? [] : ['Mock error']
  };
}

// Performance benchmarks
describe('NanoCog Performance Benchmarks', () => {
  
  test('should process simple tasks under 500ms', async () => {
    const iterations = 10;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      await nanoCogOrchestrator.orchestrate({
        task: `Simple benchmark task ${i}`,
        mode: 'analyze-only'
      });
      
      times.push(Date.now() - startTime);
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / iterations;
    console.log(`Average processing time: ${averageTime.toFixed(2)}ms`);
    
    expect(averageTime).toBeLessThan(500);
  });

  test('should maintain performance under concurrent load', async () => {
    const concurrency = 20;
    const startTime = Date.now();
    
    const promises = Array.from({ length: concurrency }, (_, i) => 
      nanoCogOrchestrator.orchestrate({
        task: `Concurrent load test ${i}`,
        mode: 'analyze-only'
      })
    );
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    expect(results).toHaveLength(concurrency);
    expect(totalTime).toBeLessThan(5000); // Should complete 20 concurrent tasks within 5 seconds
    
    console.log(`Processed ${concurrency} concurrent tasks in ${totalTime}ms`);
  });
});