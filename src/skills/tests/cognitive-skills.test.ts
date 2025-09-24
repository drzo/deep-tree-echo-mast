import { describe, expect, test, beforeAll } from '@jest/globals';
import { 
  codeAnalysisSkill,
  advancedReasoningSkill, 
  productionOptimizationSkill,
  adaptiveLearningSkill,
  CognitiveSkillsManager
} from '../index';

/**
 * Cognitive Skills Test Suite
 * Adapted from ai-opencog's validation scripts
 * 
 * Tests the functionality and integration of all cognitive skills
 * extracted from ai-opencog and adapted for Mastra framework.
 */

describe('Cognitive Skills Integration Tests', () => {
  
  beforeAll(async () => {
    // Initialize all cognitive skills
    await CognitiveSkillsManager.initializeSkills();
  });

  describe('Code Analysis Skill', () => {
    test('should analyze JavaScript code and provide quality metrics', async () => {
      const testCode = `
        function calculateTotal(items) {
          let total = 0;
          for (let i = 0; i < items.length; i++) {
            total += items[i].price;
          }
          return total;
        }
      `;

      const result = await codeAnalysisSkill.analyzeCode({
        code: testCode,
        language: 'javascript',
        context: { filename: 'test.js' }
      });

      expect(result).toBeDefined();
      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.score).toBeGreaterThan(0);
      expect(result.qualityMetrics.score).toBeLessThanOrEqual(1);
      expect(result.qualityMetrics.complexity).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.maintainability).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.performance).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.cognitiveInsights).toBeDefined();
    });

    test('should detect React patterns in JSX code', async () => {
      const reactCode = `
        import React, { useState, useEffect } from 'react';
        
        function MyComponent() {
          const [data, setData] = useState([]);
          
          useEffect(() => {
            fetchData();
          }, []);
          
          return <div>{data.map(item => <span key={item.id}>{item.name}</span>)}</div>;
        }
      `;

      const result = await codeAnalysisSkill.analyzeCode({
        code: reactCode,
        language: 'javascript',
        context: { filename: 'component.jsx' }
      });

      const hasReactPattern = result.patterns.some(p => p.name === 'React Hooks');
      expect(hasReactPattern).toBe(true);
    });

    test('should identify anti-patterns in large functions', async () => {
      const badCode = Array(30).fill('console.log("test");').join('\n');
      
      const result = await codeAnalysisSkill.analyzeCode({
        code: `function godObject() {\n${badCode}\n}`,
        context: { filename: 'bad.js' }
      });

      expect(result.qualityMetrics.complexity).toBeGreaterThan(0.3);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Reasoning Skill', () => {
    test('should solve architecture problems with deductive reasoning', async () => {
      const problem = {
        title: 'Microservices Architecture Design',
        description: 'Need to break down monolithic application into microservices',
        domain: 'architecture' as const,
        complexity: 'high' as const,
        constraints: ['Must maintain data consistency', 'Low latency required'],
        goals: ['Improve scalability', 'Enable team independence', 'Reduce deployment risk']
      };

      const solution = await advancedReasoningSkill.solveProblem(problem);

      expect(solution).toBeDefined();
      expect(solution.id).toBeDefined();
      expect(solution.approach).toBeDefined();
      expect(solution.reasoning.type).toBe('analogical'); // Architecture problems use analogical reasoning
      expect(solution.reasoning.steps.length).toBeGreaterThan(0);
      expect(solution.reasoning.conclusion).toBeDefined();
      expect(solution.implementation.phases.length).toBeGreaterThan(0);
      expect(solution.confidence).toBeGreaterThan(0);
      expect(solution.confidence).toBeLessThanOrEqual(1);
    });

    test('should use deductive reasoning for debugging problems', async () => {
      const debugProblem = {
        title: 'Memory Leak in Node.js Application',
        description: 'Application memory usage continuously increases',
        domain: 'debugging' as const,
        complexity: 'medium' as const,
        constraints: ['Production environment', 'Cannot restart frequently'],
        goals: ['Identify memory leak source', 'Fix without downtime']
      };

      const solution = await advancedReasoningSkill.solveProblem(debugProblem);

      expect(solution.reasoning.type).toBe('deductive');
      expect(solution.reasoning.steps.some(s => s.description.includes('facts'))).toBe(true);
    });

    test('should generate implementation phases with dependencies', async () => {
      const problem = {
        title: 'API Rate Limiting Implementation',
        description: 'Add rate limiting to protect API from abuse',
        domain: 'security' as const,
        complexity: 'low' as const,
        constraints: ['Minimal performance impact'],
        goals: ['Prevent API abuse', 'Maintain service availability']
      };

      const solution = await advancedReasoningSkill.solveProblem(problem);

      expect(solution.implementation.phases.length).toBeGreaterThan(0);
      
      const hasPlanning = solution.implementation.phases.some(p => p.phase.includes('Planning'));
      const hasImplementation = solution.implementation.phases.some(p => p.phase.includes('Implementation'));
      
      expect(hasPlanning).toBe(true);
      expect(hasImplementation).toBe(true);
    });
  });

  describe('Production Optimization Skill', () => {
    test('should collect system metrics', async () => {
      const metrics = await productionOptimizationSkill.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.performance?.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.performance?.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.performance?.responseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.resources).toBeDefined();
      expect(metrics.cognitive).toBeDefined();
    });

    test('should perform system health checks', async () => {
      const health = await productionOptimizationSkill.getHealth();

      expect(health).toBeDefined();
      expect(['healthy', 'degraded', 'critical']).toContain(health.status);
      expect(Array.isArray(health.services)).toBe(true);
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.lastCheck).toBeGreaterThan(0);
    });

    test('should optimize memory performance', async () => {
      const result = await productionOptimizationSkill.optimizePerformance('memory');

      expect(result).toBeDefined();
      expect(result.type).toBe('memory');
      expect(result.optimization).toContain('Memory');
      expect(result.improvement).toBeGreaterThan(0);
      expect(result.resourceSavings).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    test('should generate comprehensive optimization report', async () => {
      const report = await productionOptimizationSkill.generateOptimizationReport();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.health).toBeDefined();
      expect(Array.isArray(report.recentOptimizations)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should clear cache with pattern matching', async () => {
      const result = await productionOptimizationSkill.clearCache('user-*');

      expect(result).toBeDefined();
      expect(result.cleared).toBeGreaterThan(0);
      expect(result.pattern).toBe('user-*');
    });
  });

  describe('Adaptive Learning Skill', () => {
    test('should learn from new data', async () => {
      const learningData = {
        input: { 
          type: 'code',
          language: 'javascript',
          pattern: 'async-await'
        },
        expectedOutput: {
          suggestion: 'Use try-catch for error handling with async/await'
        },
        context: {
          domain: 'code-analysis'
        }
      };

      const result = await adaptiveLearningSkill.learn(learningData);

      expect(result).toBeDefined();
      expect(result.learned).toBe(true);
      expect(result.patternId).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(Array.isArray(result.adaptations)).toBe(true);
    });

    test('should make predictions based on learned patterns', async () => {
      // First, learn something
      await adaptiveLearningSkill.learn({
        input: { type: 'error', category: 'syntax' },
        expectedOutput: { solution: 'Check syntax and fix errors' },
        context: { domain: 'debugging' }
      });

      // Then predict on similar input
      const prediction = await adaptiveLearningSkill.predict(
        { type: 'error', category: 'syntax' },
        { domain: 'debugging' }
      );

      expect(prediction).toBeDefined();
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(prediction.usedPatterns)).toBe(true);
    });

    test('should track learning progress', async () => {
      const progress = await adaptiveLearningSkill.getLearningProgress();

      expect(progress).toBeDefined();
      expect(progress.overallProgress).toBeGreaterThanOrEqual(0);
      expect(progress.overallProgress).toBeLessThanOrEqual(100);
      expect(Array.isArray(progress.learningAreas)).toBe(true);
      expect(Array.isArray(progress.recentLearnings)).toBe(true);
      expect(progress.learningStats).toBeDefined();
    });

    test('should generate learning recommendations', async () => {
      const recommendations = await adaptiveLearningSkill.generateRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec.type).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high']).toContain(rec.priority);
      }
    });

    test('should provide learning analytics', async () => {
      const analytics = adaptiveLearningSkill.getLearningAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalPatterns).toBeGreaterThanOrEqual(0);
      expect(analytics.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(analytics.domainDistribution).toBeDefined();
      expect(analytics.learningVelocity).toBeGreaterThanOrEqual(0);
      expect(analytics.patternUtilization).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cognitive Skills Manager', () => {
    test('should perform health check on all skills', async () => {
      const healthCheck = await CognitiveSkillsManager.performHealthCheck();

      expect(healthCheck).toBeDefined();
      expect(['healthy', 'degraded']).toContain(healthCheck.overallHealth);
      expect(Array.isArray(healthCheck.skillHealthChecks)).toBe(true);
      expect(healthCheck.skillHealthChecks.length).toBe(4); // 4 skills tested
      expect(healthCheck.timestamp).toBeDefined();

      // Each skill should have a health check
      const skillNames = healthCheck.skillHealthChecks.map((check: any) => check.skill);
      expect(skillNames).toContain('code-analysis');
      expect(skillNames).toContain('advanced-reasoning');
      expect(skillNames).toContain('production-optimization');
      expect(skillNames).toContain('adaptive-learning');
    });

    test('should provide skill summary', () => {
      const summary = CognitiveSkillsManager.getSkillSummary();

      expect(summary).toBeDefined();
      expect(summary.totalSkills).toBe(5);
      expect(summary.capabilities).toBeDefined();
      expect(summary.integration).toContain('Mastra');
      expect(summary.source).toContain('ai-opencog');
    });
  });

  describe('Integration Tests', () => {
    test('should work together for complex problem solving', async () => {
      // Test code analysis + reasoning integration
      const problemCode = `
        function processData(data) {
          var result = [];
          for (var i = 0; i < data.length; i++) {
            if (data[i].status == "active") {
              result.push({
                id: data[i].id,
                name: data[i].name,
                processedAt: Date.now()
              });
            }
          }
          return result;
        }
      `;

      // Analyze code first
      const codeAnalysis = await codeAnalysisSkill.analyzeCode({
        code: problemCode,
        context: { filename: 'process.js' }
      });

      // Use analysis results to create a reasoning problem
      const reasoningProblem = {
        title: 'Optimize Data Processing Function',
        description: `Code has ${codeAnalysis.issues.length} issues and ${codeAnalysis.qualityMetrics.complexity} complexity`,
        domain: 'performance' as const,
        complexity: 'medium' as const,
        constraints: ['Must maintain functionality', 'Improve performance'],
        goals: ['Reduce complexity', 'Fix identified issues', 'Improve maintainability']
      };

      const reasoningSolution = await advancedReasoningSkill.solveProblem(reasoningProblem);

      expect(reasoningSolution).toBeDefined();
      expect(reasoningSolution.reasoning.type).toBe('inductive'); // Performance problems use inductive reasoning
      
      // Learn from this integration
      await adaptiveLearningSkill.learn({
        input: { codeComplexity: codeAnalysis.qualityMetrics.complexity, issueCount: codeAnalysis.issues.length },
        expectedOutput: { reasoningType: reasoningSolution.reasoning.type, confidence: reasoningSolution.confidence },
        context: { domain: 'code-optimization' }
      });

      const learningProgress = await adaptiveLearningSkill.getLearningProgress();
      expect(learningProgress.overallProgress).toBeGreaterThan(0);
    });

    test('should handle error conditions gracefully', async () => {
      // Test with invalid code
      const invalidAnalysis = await codeAnalysisSkill.analyzeCode({
        code: '',
        context: { filename: 'empty.js' }
      });
      
      expect(invalidAnalysis).toBeDefined();
      expect(invalidAnalysis.qualityMetrics.score).toBeGreaterThanOrEqual(0);

      // Test with invalid problem context
      const result = await advancedReasoningSkill.solveProblem({
        title: '',
        description: '',
        domain: 'debugging' as const,
        complexity: 'low' as const,
        constraints: [],
        goals: []
      });

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tests', () => {
    test('should complete code analysis within reasonable time', async () => {
      const start = Date.now();
      
      await codeAnalysisSkill.analyzeCode({
        code: 'const x = 1; const y = 2; const z = x + y;',
        context: { filename: 'simple.js' }
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent skill operations', async () => {
      const operations = [
        codeAnalysisSkill.analyzeCode({ code: 'console.log("test1");', context: { filename: 'test1.js' } }),
        codeAnalysisSkill.analyzeCode({ code: 'console.log("test2");', context: { filename: 'test2.js' } }),
        productionOptimizationSkill.getMetrics(),
        adaptiveLearningSkill.getLearningProgress()
      ];

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});

// Additional helper functions for testing
export function createTestCodeSample(complexity: 'low' | 'medium' | 'high'): string {
  switch (complexity) {
    case 'low':
      return 'const greeting = "Hello World"; console.log(greeting);';
    
    case 'medium':
      return `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        console.log(fibonacci(10));
      `;
    
    case 'high':
      return Array(20).fill(`
        if (Math.random() > 0.5) {
          for (let i = 0; i < 10; i++) {
            try {
              const result = complexCalculation(i);
              if (result) processResult(result);
            } catch (e) {
              handleError(e);
            }
          }
        }
      `).join('\n');
    
    default:
      return 'const test = true;';
  }
}

export function createTestProblem(domain: string, complexity: string) {
  return {
    title: `Test ${domain} Problem`,
    description: `A test problem for ${domain} domain with ${complexity} complexity`,
    domain: domain as any,
    complexity: complexity as any,
    constraints: [`${domain} constraint 1`, `${domain} constraint 2`],
    goals: [`Solve ${domain} issue`, `Improve ${complexity} performance`]
  };
}