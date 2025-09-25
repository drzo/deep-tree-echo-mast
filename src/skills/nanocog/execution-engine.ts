/**
 * NanoCog Execution Engine
 * 
 * Handles the actual execution of cognitive skills according to the orchestrated plan.
 * Provides intelligent skill selection optimization, confidence-based recommendations,
 * and performance monitoring with adaptive learning.
 */

import {
  codeAnalysisSkill,
  advancedReasoningSkill,
  productionOptimizationSkill,
  adaptiveLearningSkill
} from "../index";

import {
  TaskAnalysis,
  SkillRecommendation,
  CognitivePhase,
  NanoCogTask,
  NanoCogResult,
  MetaCognitiveInsights
} from "./nanocog-orchestrator";

export interface SkillExecutionResult {
  skillId: string;
  success: boolean;
  result: any;
  executionTime: number;
  confidence: number;
  insights: string[];
  errors: string[];
}

export interface PhaseExecutionResult {
  phaseId: string;
  skillResults: SkillExecutionResult[];
  totalTime: number;
  success: boolean;
  parallelEfficiency?: number;
}

export interface SkillSelectionOptimizer {
  optimizeSkillSequence(skills: SkillRecommendation[], analysis: TaskAnalysis): SkillRecommendation[];
  calculateOptimalParallelization(skills: SkillRecommendation[]): Map<string, string[]>;
  assessSkillCompatibility(skillA: string, skillB: string): number;
}

export interface ConfidenceBasedRecommendationEngine {
  generateRecommendations(
    analysis: TaskAnalysis, 
    historicalPerformance: Map<string, number[]>,
    currentLoad: number
  ): SkillRecommendation[];
  updateConfidenceScores(results: SkillExecutionResult[]): Map<string, number>;
  predictSkillPerformance(skillId: string, context: any): number;
}

/**
 * Advanced skill selection optimizer using historical performance and context analysis
 */
export class AdvancedSkillSelectionOptimizer implements SkillSelectionOptimizer {
  private compatibilityMatrix: Map<string, Map<string, number>> = new Map();
  
  constructor() {
    this.initializeCompatibilityMatrix();
  }

  /**
   * Optimize skill sequence based on dependencies, performance, and compatibility
   */
  optimizeSkillSequence(skills: SkillRecommendation[], analysis: TaskAnalysis): SkillRecommendation[] {
    // Sort by priority and confidence, then optimize for dependency resolution
    const sortedSkills = skills.sort((a, b) => {
      // Primary sort: Priority * Confidence
      const scoreA = a.priority * a.confidence;
      const scoreB = b.priority * b.confidence;
      
      if (Math.abs(scoreA - scoreB) > 0.1) {
        return scoreB - scoreA;
      }
      
      // Secondary sort: Minimize risk factors
      return a.riskFactors.length - b.riskFactors.length;
    });

    // Optimize for task category
    return this.optimizeForCategory(sortedSkills, analysis.category);
  }

  /**
   * Calculate optimal parallelization strategy
   */
  calculateOptimalParallelization(skills: SkillRecommendation[]): Map<string, string[]> {
    const parallelGroups = new Map<string, string[]>();
    const processed = new Set<string>();
    
    // Group 1: Independent analysis skills
    const independentSkills = skills.filter(skill => 
      ['code-analysis', 'production-optimization'].includes(skill.skillId) &&
      skill.dependencies.length === 0
    );
    
    if (independentSkills.length > 0) {
      parallelGroups.set('parallel-analysis', independentSkills.map(s => s.skillId));
      independentSkills.forEach(s => processed.add(s.skillId));
    }

    // Group 2: Dependent skills that can run after analysis
    const dependentSkills = skills.filter(skill => 
      !processed.has(skill.skillId) && 
      skill.dependencies.some(dep => dep.includes('analysis'))
    );
    
    if (dependentSkills.length > 0) {
      parallelGroups.set('post-analysis', dependentSkills.map(s => s.skillId));
      dependentSkills.forEach(s => processed.add(s.skillId));
    }

    // Group 3: Final learning and adaptation
    const learningSkills = skills.filter(skill => 
      !processed.has(skill.skillId) && 
      skill.skillId === 'adaptive-learning'
    );
    
    if (learningSkills.length > 0) {
      parallelGroups.set('learning-phase', learningSkills.map(s => s.skillId));
    }

    return parallelGroups;
  }

  /**
   * Assess compatibility between two skills for parallel execution
   */
  assessSkillCompatibility(skillA: string, skillB: string): number {
    const compatibilityA = this.compatibilityMatrix.get(skillA);
    if (!compatibilityA) return 0.5; // Default neutral compatibility
    
    return compatibilityA.get(skillB) || 0.5;
  }

  private initializeCompatibilityMatrix(): void {
    // Initialize compatibility scores between skills (0-1 scale)
    const skills = ['code-analysis', 'advanced-reasoning', 'production-optimization', 'adaptive-learning'];
    
    skills.forEach(skillA => {
      const compatMap = new Map<string, number>();
      skills.forEach(skillB => {
        if (skillA === skillB) {
          compatMap.set(skillB, 1.0);
        } else {
          // Define specific compatibility rules
          compatMap.set(skillB, this.calculateBaseCompatibility(skillA, skillB));
        }
      });
      this.compatibilityMatrix.set(skillA, compatMap);
    });
  }

  private calculateBaseCompatibility(skillA: string, skillB: string): number {
    // Define compatibility rules based on cognitive resource usage and data flow
    const compatibilityRules = {
      'code-analysis': {
        'advanced-reasoning': 0.9,      // Code analysis feeds reasoning well
        'production-optimization': 0.7,  // Some overlap in analysis
        'adaptive-learning': 0.6         // Moderate compatibility
      },
      'advanced-reasoning': {
        'code-analysis': 0.9,
        'production-optimization': 0.8,
        'adaptive-learning': 0.9         // Reasoning enhances learning
      },
      'production-optimization': {
        'code-analysis': 0.7,
        'advanced-reasoning': 0.8,
        'adaptive-learning': 0.6
      },
      'adaptive-learning': {
        'code-analysis': 0.6,
        'advanced-reasoning': 0.9,
        'production-optimization': 0.6
      }
    };

    return compatibilityRules[skillA]?.[skillB] || 0.5;
  }

  private optimizeForCategory(skills: SkillRecommendation[], category: string): SkillRecommendation[] {
    // Category-specific optimizations
    const categoryOptimizations = {
      'code-analysis': (skills: SkillRecommendation[]) => {
        // Prioritize code analysis, then reasoning
        const codeSkills = skills.filter(s => s.skillId === 'code-analysis');
        const reasoningSkills = skills.filter(s => s.skillId === 'advanced-reasoning');
        const others = skills.filter(s => !['code-analysis', 'advanced-reasoning'].includes(s.skillId));
        return [...codeSkills, ...reasoningSkills, ...others];
      },
      'problem-solving': (skills: SkillRecommendation[]) => {
        // Prioritize reasoning, then supporting skills
        const reasoningSkills = skills.filter(s => s.skillId === 'advanced-reasoning');
        const others = skills.filter(s => s.skillId !== 'advanced-reasoning');
        return [...reasoningSkills, ...others];
      },
      'optimization': (skills: SkillRecommendation[]) => {
        // Prioritize optimization and analysis
        const optSkills = skills.filter(s => s.skillId === 'production-optimization');
        const codeSkills = skills.filter(s => s.skillId === 'code-analysis');
        const others = skills.filter(s => !['production-optimization', 'code-analysis'].includes(s.skillId));
        return [...optSkills, ...codeSkills, ...others];
      }
    };

    const optimizer = categoryOptimizations[category];
    return optimizer ? optimizer(skills) : skills;
  }
}

/**
 * Confidence-based recommendation engine using Bayesian inference and historical data
 */
export class IntelligentRecommendationEngine implements ConfidenceBasedRecommendationEngine {
  private confidenceHistory: Map<string, number[]> = new Map();
  private contextualPerformance: Map<string, Map<string, number>> = new Map();
  
  /**
   * Generate skill recommendations based on confidence analysis and historical performance
   */
  generateRecommendations(
    analysis: TaskAnalysis,
    historicalPerformance: Map<string, number[]>,
    currentLoad: number
  ): SkillRecommendation[] {
    const recommendations: SkillRecommendation[] = [];
    
    // Base recommendations from task analysis
    const baseSkills = this.getBaseSkillsForCategory(analysis.category);
    
    for (const skillId of baseSkills) {
      const performance = historicalPerformance.get(skillId) || [];
      const confidence = this.calculateConfidenceScore(skillId, analysis, performance);
      const priority = this.calculateDynamicPriority(skillId, analysis, currentLoad);
      
      // Only recommend if confidence meets minimum threshold
      if (confidence >= 0.4) {
        recommendations.push({
          skillId,
          skillName: this.getSkillDisplayName(skillId),
          priority,
          confidence,
          reasoning: this.generateRecommendationReasoning(skillId, analysis, confidence),
          expectedContribution: this.estimateContribution(skillId, analysis),
          riskFactors: this.assessRiskFactors(skillId, analysis, performance),
          dependencies: this.getSkillDependencies(skillId)
        });
      }
    }

    // Add contextual recommendations based on patterns
    const contextualRecs = this.generateContextualRecommendations(analysis, currentLoad);
    recommendations.push(...contextualRecs);

    return recommendations;
  }

  /**
   * Update confidence scores based on execution results using Bayesian inference
   */
  updateConfidenceScores(results: SkillExecutionResult[]): Map<string, number> {
    const updatedScores = new Map<string, number>();
    
    results.forEach(result => {
      const currentHistory = this.confidenceHistory.get(result.skillId) || [];
      
      // Bayesian update: Prior + Likelihood = Posterior
      const prior = this.getPriorConfidence(result.skillId);
      const likelihood = this.calculateLikelihood(result);
      const posterior = this.bayesianUpdate(prior, likelihood);
      
      // Store updated confidence
      currentHistory.push(result.confidence);
      this.confidenceHistory.set(result.skillId, currentHistory.slice(-20)); // Keep last 20 results
      updatedScores.set(result.skillId, posterior);
      
      // Update contextual performance
      this.updateContextualPerformance(result);
    });
    
    return updatedScores;
  }

  /**
   * Predict skill performance based on current context and historical data
   */
  predictSkillPerformance(skillId: string, context: any): number {
    const basePerformance = this.getAverageHistoricalPerformance(skillId);
    const contextualAdjustment = this.getContextualAdjustment(skillId, context);
    const confidenceAdjustment = this.getConfidenceAdjustment(skillId);
    
    // Weighted combination of factors
    const prediction = (
      basePerformance * 0.5 +
      contextualAdjustment * 0.3 +
      confidenceAdjustment * 0.2
    );
    
    return Math.max(0.1, Math.min(1.0, prediction));
  }

  private getBaseSkillsForCategory(category: string): string[] {
    const categorySkills = {
      'code-analysis': ['code-analysis', 'advanced-reasoning'],
      'problem-solving': ['advanced-reasoning', 'code-analysis'],
      'optimization': ['production-optimization', 'code-analysis', 'advanced-reasoning'],
      'learning': ['adaptive-learning', 'advanced-reasoning'],
      'complex-multistep': ['code-analysis', 'advanced-reasoning', 'production-optimization', 'adaptive-learning'],
      'research': ['advanced-reasoning', 'adaptive-learning']
    };
    
    return categorySkills[category] || ['advanced-reasoning'];
  }

  private calculateConfidenceScore(skillId: string, analysis: TaskAnalysis, performance: number[]): number {
    if (performance.length === 0) {
      // No history: base confidence on skill-category fit
      return this.getBaseCategoryConfidence(skillId, analysis.category);
    }
    
    // Historical average with recency weighting
    const weights = performance.map((_, i) => Math.pow(0.9, performance.length - 1 - i));
    const weightedSum = performance.reduce((sum, perf, i) => sum + perf * weights[i], 0);
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    
    const historicalConfidence = weightedSum / weightSum;
    
    // Adjust for task complexity
    const complexityAdjustment = {
      'low': 0.1,
      'medium': 0,
      'high': -0.1,
      'extreme': -0.2
    }[analysis.complexity] || 0;
    
    return Math.max(0.1, Math.min(1.0, historicalConfidence + complexityAdjustment));
  }

  private calculateDynamicPriority(skillId: string, analysis: TaskAnalysis, currentLoad: number): number {
    // Base priority from category mapping
    const basePriority = this.getBasePriority(skillId, analysis.category);
    
    // Adjust for current cognitive load
    const loadAdjustment = currentLoad > 0.8 ? -0.2 : 0;
    
    // Adjust for skill specialization in domain
    const domainBonus = analysis.domains.some(domain => 
      this.isSkillSpecializedInDomain(skillId, domain)
    ) ? 0.1 : 0;
    
    return Math.max(0.1, basePriority + loadAdjustment + domainBonus);
  }

  private getBaseCategoryConfidence(skillId: string, category: string): number {
    const confidenceMatrix = {
      'code-analysis': {
        'code-analysis': 0.9,
        'problem-solving': 0.7,
        'optimization': 0.6,
        'learning': 0.5,
        'complex-multistep': 0.8,
        'research': 0.6
      },
      'advanced-reasoning': {
        'code-analysis': 0.8,
        'problem-solving': 0.95,
        'optimization': 0.85,
        'learning': 0.7,
        'complex-multistep': 0.9,
        'research': 0.9
      },
      'production-optimization': {
        'code-analysis': 0.6,
        'problem-solving': 0.7,
        'optimization': 0.95,
        'learning': 0.5,
        'complex-multistep': 0.75,
        'research': 0.6
      },
      'adaptive-learning': {
        'code-analysis': 0.5,
        'problem-solving': 0.6,
        'optimization': 0.6,
        'learning': 0.95,
        'complex-multistep': 0.7,
        'research': 0.8
      }
    };
    
    return confidenceMatrix[skillId]?.[category] || 0.7;
  }

  private generateRecommendationReasoning(skillId: string, analysis: TaskAnalysis, confidence: number): string {
    const confidenceLevel = confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low';
    return `${skillId} recommended for ${analysis.category} task with ${confidenceLevel} confidence (${(confidence * 100).toFixed(1)}%). Task complexity: ${analysis.complexity}.`;
  }

  private estimateContribution(skillId: string, analysis: TaskAnalysis): number {
    // Estimate expected contribution based on skill-task fit
    const contributionMatrix = {
      'code-analysis': {
        'code-analysis': 0.9,
        'problem-solving': 0.6,
        'optimization': 0.7,
        'learning': 0.4,
        'complex-multistep': 0.7,
        'research': 0.5
      },
      'advanced-reasoning': {
        'code-analysis': 0.7,
        'problem-solving': 0.95,
        'optimization': 0.8,
        'learning': 0.6,
        'complex-multistep': 0.85,
        'research': 0.9
      },
      'production-optimization': {
        'code-analysis': 0.5,
        'problem-solving': 0.6,
        'optimization': 0.9,
        'learning': 0.4,
        'complex-multistep': 0.6,
        'research': 0.4
      },
      'adaptive-learning': {
        'code-analysis': 0.3,
        'problem-solving': 0.5,
        'optimization': 0.5,
        'learning': 0.9,
        'complex-multistep': 0.6,
        'research': 0.7
      }
    };
    
    return contributionMatrix[skillId]?.[analysis.category] || 0.5;
  }

  private assessRiskFactors(skillId: string, analysis: TaskAnalysis, performance: number[]): string[] {
    const riskFactors: string[] = [];
    
    // Historical performance risk
    if (performance.length > 3) {
      const avgPerformance = performance.reduce((sum, p) => sum + p, 0) / performance.length;
      if (avgPerformance < 0.6) {
        riskFactors.push('Below-average historical performance');
      }
      
      // Volatility risk
      const variance = performance.reduce((sum, p) => sum + Math.pow(p - avgPerformance, 2), 0) / performance.length;
      if (variance > 0.1) {
        riskFactors.push('High performance volatility');
      }
    }
    
    // Complexity risk
    if (analysis.complexity === 'extreme') {
      riskFactors.push('Extreme task complexity may impact performance');
    }
    
    // Cognitive load risk
    if (analysis.estimatedCognitiveLoad > 0.8) {
      riskFactors.push('High cognitive load may cause performance degradation');
    }
    
    return riskFactors;
  }

  private getSkillDependencies(skillId: string): string[] {
    const dependencies = {
      'code-analysis': [],
      'advanced-reasoning': ['code-analysis-results'],
      'production-optimization': [],
      'adaptive-learning': ['reasoning-results', 'optimization-results']
    };
    
    return dependencies[skillId] || [];
  }

  private generateContextualRecommendations(analysis: TaskAnalysis, currentLoad: number): SkillRecommendation[] {
    const contextualRecs: SkillRecommendation[] = [];
    
    // If load is high, recommend optimization skill
    if (currentLoad > 0.7 && !analysis.requiredSkills.includes('optimization')) {
      contextualRecs.push({
        skillId: 'production-optimization',
        skillName: 'Production Optimization Skill',
        priority: 0.8,
        confidence: 0.7,
        reasoning: 'High cognitive load detected - optimization recommended',
        expectedContribution: 0.6,
        riskFactors: [],
        dependencies: []
      });
    }
    
    // If complex multistep, recommend learning for future optimization
    if (analysis.category === 'complex-multistep' && !analysis.requiredSkills.includes('learning')) {
      contextualRecs.push({
        skillId: 'adaptive-learning',
        skillName: 'Adaptive Learning Skill',
        priority: 0.6,
        confidence: 0.8,
        reasoning: 'Complex task pattern - learning recommended for future optimization',
        expectedContribution: 0.5,
        riskFactors: [],
        dependencies: ['reasoning-results']
      });
    }
    
    return contextualRecs;
  }

  private getPriorConfidence(skillId: string): number {
    const history = this.confidenceHistory.get(skillId) || [];
    if (history.length === 0) return 0.7; // Default prior
    
    return history.reduce((sum, conf) => sum + conf, 0) / history.length;
  }

  private calculateLikelihood(result: SkillExecutionResult): number {
    // Success probability based on execution result
    if (!result.success) return 0.1;
    
    // Performance-based likelihood
    const performanceFactor = result.executionTime > 1000 ? 0.8 : 1.0; // Penalize slow execution
    const confidenceFactor = result.confidence;
    
    return Math.min(1.0, performanceFactor * confidenceFactor);
  }

  private bayesianUpdate(prior: number, likelihood: number): number {
    // Simple Bayesian update: posterior ∝ likelihood × prior
    const posterior = likelihood * prior;
    const normalizedPosterior = posterior / (posterior + (1 - likelihood) * (1 - prior));
    
    return Math.max(0.1, Math.min(0.95, normalizedPosterior));
  }

  private updateContextualPerformance(result: SkillExecutionResult): void {
    // Update contextual performance tracking for better future predictions
    // This would analyze the context patterns that lead to good/bad performance
    // Implementation depends on specific context structure
  }

  private getAverageHistoricalPerformance(skillId: string): number {
    const history = this.confidenceHistory.get(skillId) || [];
    if (history.length === 0) return 0.7;
    
    return history.reduce((sum, conf) => sum + conf, 0) / history.length;
  }

  private getContextualAdjustment(skillId: string, context: any): number {
    // Analyze context to adjust performance prediction
    // This would be enhanced based on specific context patterns
    return 0.7; // Placeholder
  }

  private getConfidenceAdjustment(skillId: string): number {
    const history = this.confidenceHistory.get(skillId) || [];
    if (history.length < 3) return 0.7;
    
    // Recent trend analysis
    const recent = history.slice(-3);
    const trend = recent.reduce((sum, conf, i) => sum + conf * (i + 1), 0) / 6; // Weighted recent
    
    return Math.max(0.1, Math.min(1.0, trend));
  }

  private getBasePriority(skillId: string, category: string): number {
    const priorityMatrix = {
      'code-analysis': {
        'code-analysis': 1.0,
        'problem-solving': 0.7,
        'optimization': 0.8,
        'learning': 0.5,
        'complex-multistep': 0.8,
        'research': 0.6
      },
      'advanced-reasoning': {
        'code-analysis': 0.8,
        'problem-solving': 1.0,
        'optimization': 0.9,
        'learning': 0.7,
        'complex-multistep': 0.95,
        'research': 0.95
      },
      'production-optimization': {
        'code-analysis': 0.6,
        'problem-solving': 0.7,
        'optimization': 1.0,
        'learning': 0.5,
        'complex-multistep': 0.7,
        'research': 0.5
      },
      'adaptive-learning': {
        'code-analysis': 0.4,
        'problem-solving': 0.6,
        'optimization': 0.6,
        'learning': 1.0,
        'complex-multistep': 0.7,
        'research': 0.8
      }
    };
    
    return priorityMatrix[skillId]?.[category] || 0.5;
  }

  private isSkillSpecializedInDomain(skillId: string, domain: string): boolean {
    const specializations = {
      'code-analysis': ['software-engineering', 'code-quality'],
      'advanced-reasoning': ['problem-solving', 'debugging', 'system-design'],
      'production-optimization': ['performance', 'optimization', 'scalability'],
      'adaptive-learning': ['machine-learning', 'adaptation', 'pattern-recognition']
    };
    
    return specializations[skillId]?.includes(domain) || false;
  }

  private getSkillDisplayName(skillId: string): string {
    const displayNames = {
      'code-analysis': 'Code Analysis Skill',
      'advanced-reasoning': 'Advanced Reasoning Skill',
      'production-optimization': 'Production Optimization Skill',
      'adaptive-learning': 'Adaptive Learning Skill'
    };
    
    return displayNames[skillId] || skillId;
  }
}

// Export the optimized components
export const skillSelectionOptimizer = new AdvancedSkillSelectionOptimizer();
export const recommendationEngine = new IntelligentRecommendationEngine();