import { z } from "zod";

/**
 * Adaptive Learning Skill - Cognitive Learning & Adaptation
 * Adapted from ai-opencog's AdvancedLearningAgent
 * 
 * Provides adaptive learning capabilities that evolve based on user interactions,
 * pattern recognition, and continuous improvement of system responses.
 */

export const learningDataSchema = z.object({
  input: z.any().describe("The input data for learning"),
  expectedOutput: z.any().optional().describe("Expected output for supervised learning"),
  context: z.object({
    domain: z.string().optional(),
    userProfile: z.string().optional(),
    sessionId: z.string().optional(),
    timestamp: z.number().optional()
  }).optional().describe("Context information for learning"),
  feedback: z.object({
    score: z.number().min(0).max(1).describe("Feedback score (0-1)"),
    type: z.enum(['positive', 'negative', 'neutral']).describe("Feedback type"),
    details: z.string().optional().describe("Additional feedback details")
  }).optional().describe("User feedback for reinforcement learning")
});

export const learningConfigSchema = z.object({
  learningRate: z.number().min(0).max(1).default(0.1).describe("Learning rate (0-1)"),
  adaptationThreshold: z.number().min(0).max(1).default(0.7).describe("Threshold for adaptation"),
  maxPatterns: z.number().default(1000).describe("Maximum patterns to store"),
  forgettingFactor: z.number().min(0).max(1).default(0.05).describe("Forgetting factor for old patterns"),
  explorationRate: z.number().min(0).max(1).default(0.2).describe("Exploration vs exploitation rate")
});

export type LearningData = z.infer<typeof learningDataSchema>;
export type LearningConfig = z.infer<typeof learningConfigSchema>;

export interface LearningPattern {
  id: string;
  input: any;
  output: any;
  confidence: number;
  frequency: number;
  lastUsed: number;
  domain: string;
  context: any;
}

export interface UserProfile {
  id: string;
  preferences: Record<string, any>;
  learningAreas: Array<{
    name: string;
    progress: number;
    confidence: number;
    category: string;
  }>;
  interactionHistory: Array<{
    timestamp: number;
    action: string;
    feedback?: any;
    context: any;
  }>;
  adaptationMetrics: {
    totalInteractions: number;
    patternsLearned: number;
    adaptationsMade: number;
    accuracyImprovement: number;
  };
}

export interface LearningProgress {
  overallProgress: number;
  learningAreas: Array<{
    name: string;
    progress: number;
    confidence: number;
    category: string;
  }>;
  recentLearnings: Array<{
    timestamp: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    category: string;
  }>;
  learningStats: {
    totalInteractions: number;
    patternsLearned: number;
    adaptationsMade: number;
    accuracyImprovement: number;
  };
}

export interface LearningRecommendation {
  type: 'pattern' | 'adaptation' | 'optimization' | 'exploration';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  suggestedAction: string;
  reasoning: string;
}

export class AdaptiveLearningSkill {
  
  private patterns: Map<string, LearningPattern> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private config: LearningConfig = {
    learningRate: 0.1,
    adaptationThreshold: 0.7,
    maxPatterns: 1000,
    forgettingFactor: 0.05,
    explorationRate: 0.2
  };
  
  private learningHistory: Array<{ timestamp: number; event: string; data: any }> = [];

  constructor(config?: Partial<LearningConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeLearningSystem();
  }

  private initializeLearningSystem(): void {
    // Initialize with some basic learning patterns
    this.seedBasicPatterns();
    
    // Start periodic maintenance
    setInterval(() => {
      this.performMaintenance();
    }, 300000); // Every 5 minutes
  }

  private seedBasicPatterns(): void {
    // Code-related patterns
    this.addPattern({
      id: 'code-optimization-pattern',
      input: { type: 'code', language: 'javascript', complexity: 'high' },
      output: { suggestions: ['refactor', 'split-functions', 'optimize-loops'] },
      confidence: 0.8,
      frequency: 1,
      lastUsed: Date.now(),
      domain: 'code-analysis',
      context: { category: 'optimization' }
    });

    // Problem-solving patterns
    this.addPattern({
      id: 'debugging-pattern',
      input: { type: 'error', severity: 'high', domain: 'debugging' },
      output: { approach: 'root-cause-analysis', steps: ['isolate', 'analyze', 'fix', 'test'] },
      confidence: 0.9,
      frequency: 1,
      lastUsed: Date.now(),
      domain: 'problem-solving',
      context: { category: 'debugging' }
    });
  }

  async learn(learningData: LearningData): Promise<{
    learned: boolean;
    patternId?: string;
    confidence: number;
    adaptations: string[];
  }> {
    const { input, expectedOutput, context, feedback } = learningData;
    
    // Find similar patterns
    const similarPatterns = this.findSimilarPatterns(input, context?.domain);
    
    // Determine if this is a new pattern or refinement of existing
    const isNewPattern = similarPatterns.length === 0 || 
                         (feedback && feedback.score < this.config.adaptationThreshold);
    
    let patternId: string | undefined;
    const adaptations: string[] = [];
    let confidence = 0.5; // Default confidence for new learning
    
    if (isNewPattern && expectedOutput) {
      // Create new pattern
      patternId = this.generatePatternId(input, context);
      const newPattern: LearningPattern = {
        id: patternId,
        input,
        output: expectedOutput,
        confidence: this.config.learningRate,
        frequency: 1,
        lastUsed: Date.now(),
        domain: context?.domain || 'general',
        context: context || {}
      };
      
      this.addPattern(newPattern);
      adaptations.push('Created new learning pattern');
      confidence = this.config.learningRate;
      
    } else if (similarPatterns.length > 0) {
      // Refine existing patterns
      const bestMatch = similarPatterns[0];
      patternId = bestMatch.id;
      
      if (feedback) {
        this.applyReinforcementLearning(bestMatch, feedback);
        adaptations.push('Applied reinforcement learning');
        confidence = bestMatch.confidence;
      }
      
      if (expectedOutput) {
        this.refinePattern(bestMatch, expectedOutput);
        adaptations.push('Refined pattern based on new data');
      }
    }
    
    // Update user profile if available
    if (context?.userProfile) {
      this.updateUserProfile(context.userProfile, learningData, adaptations);
    }
    
    // Log learning event
    this.learningHistory.push({
      timestamp: Date.now(),
      event: isNewPattern ? 'pattern-created' : 'pattern-refined',
      data: { patternId, adaptations, confidence }
    });
    
    return {
      learned: true,
      patternId,
      confidence,
      adaptations
    };
  }

  private findSimilarPatterns(input: any, domain?: string): LearningPattern[] {
    const patterns = Array.from(this.patterns.values());
    
    const scored = patterns
      .filter(pattern => !domain || pattern.domain === domain)
      .map(pattern => ({
        pattern,
        similarity: this.calculateSimilarity(input, pattern.input)
      }))
      .filter(item => item.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity);
    
    return scored.slice(0, 5).map(item => item.pattern); // Top 5 similar patterns
  }

  private calculateSimilarity(input1: any, input2: any): number {
    // Simple similarity calculation - in real implementation, this would be more sophisticated
    if (typeof input1 !== typeof input2) return 0;
    
    if (typeof input1 === 'string') {
      return this.stringSimilarity(input1, input2);
    }
    
    if (typeof input1 === 'object') {
      return this.objectSimilarity(input1, input2);
    }
    
    return input1 === input2 ? 1 : 0;
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private objectSimilarity(obj1: any, obj2: any): number {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    for (const key of allKeys) {
      if (key in obj1 && key in obj2) {
        if (typeof obj1[key] === typeof obj2[key]) {
          if (typeof obj1[key] === 'object') {
            matches += this.objectSimilarity(obj1[key], obj2[key]) * 0.5;
          } else {
            matches += obj1[key] === obj2[key] ? 1 : 0.5;
          }
        }
      }
    }
    
    return matches / allKeys.size;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private generatePatternId(input: any, context?: any): string {
    const hash = this.simpleHash(JSON.stringify(input) + (context?.domain || ''));
    return `pattern-${Date.now()}-${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private addPattern(pattern: LearningPattern): void {
    this.patterns.set(pattern.id, pattern);
    
    // Remove oldest patterns if we exceed the limit
    if (this.patterns.size > this.config.maxPatterns) {
      this.removeOldestPatterns();
    }
  }

  private removeOldestPatterns(): void {
    const patterns = Array.from(this.patterns.values());
    patterns.sort((a, b) => a.lastUsed - b.lastUsed);
    
    const toRemove = patterns.slice(0, this.patterns.size - this.config.maxPatterns);
    for (const pattern of toRemove) {
      this.patterns.delete(pattern.id);
    }
  }

  private applyReinforcementLearning(pattern: LearningPattern, feedback: any): void {
    const reward = feedback.score;
    const learningRate = this.config.learningRate;
    
    // Update confidence based on feedback
    if (feedback.type === 'positive') {
      pattern.confidence = Math.min(1.0, pattern.confidence + learningRate * reward);
    } else if (feedback.type === 'negative') {
      pattern.confidence = Math.max(0.1, pattern.confidence - learningRate * (1 - reward));
    }
    
    pattern.frequency++;
    pattern.lastUsed = Date.now();
  }

  private refinePattern(pattern: LearningPattern, newOutput: any): void {
    // Merge new output with existing output
    if (typeof pattern.output === 'object' && typeof newOutput === 'object') {
      pattern.output = { ...pattern.output, ...newOutput };
    } else {
      pattern.output = newOutput;
    }
    
    pattern.lastUsed = Date.now();
    pattern.frequency++;
  }

  async predict(input: any, context?: any): Promise<{
    prediction: any;
    confidence: number;
    reasoning: string;
    usedPatterns: string[];
  }> {
    const similarPatterns = this.findSimilarPatterns(input, context?.domain);
    
    if (similarPatterns.length === 0) {
      return {
        prediction: null,
        confidence: 0,
        reasoning: 'No similar patterns found for prediction',
        usedPatterns: []
      };
    }
    
    // Use the most confident pattern or ensemble prediction
    const bestPattern = similarPatterns[0];
    const usedPatterns = [bestPattern.id];
    
    // Update pattern usage
    bestPattern.lastUsed = Date.now();
    bestPattern.frequency++;
    
    return {
      prediction: bestPattern.output,
      confidence: bestPattern.confidence,
      reasoning: `Prediction based on pattern ${bestPattern.id} with ${bestPattern.frequency} uses`,
      usedPatterns
    };
  }

  async getLearningProgress(userId?: string): Promise<LearningProgress> {
    const userProfile = userId ? this.userProfiles.get(userId) : null;
    
    const totalPatterns = this.patterns.size;
    const avgConfidence = this.calculateAverageConfidence();
    const recentLearnings = this.getRecentLearnings();
    
    const progress = {
      overallProgress: Math.round(avgConfidence * 100),
      learningAreas: userProfile?.learningAreas || this.getDefaultLearningAreas(),
      recentLearnings,
      learningStats: userProfile?.adaptationMetrics || {
        totalInteractions: totalPatterns,
        patternsLearned: totalPatterns,
        adaptationsMade: this.learningHistory.length,
        accuracyImprovement: (avgConfidence - 0.5) * 100
      }
    };
    
    return progress;
  }

  private calculateAverageConfidence(): number {
    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) return 0.5;
    
    const sum = patterns.reduce((acc, pattern) => acc + pattern.confidence, 0);
    return sum / patterns.length;
  }

  private getRecentLearnings(): any[] {
    return this.learningHistory
      .slice(-10)
      .map(event => ({
        timestamp: new Date(event.timestamp).toLocaleString(),
        description: this.formatLearningEvent(event),
        impact: this.assessImpact(event),
        category: event.data?.category || 'General'
      }));
  }

  private formatLearningEvent(event: any): string {
    switch (event.event) {
      case 'pattern-created':
        return 'Learned new pattern from user interaction';
      case 'pattern-refined':
        return 'Refined existing pattern based on feedback';
      default:
        return 'Learning event occurred';
    }
  }

  private assessImpact(event: any): 'low' | 'medium' | 'high' {
    const confidence = event.data?.confidence || 0;
    if (confidence > 0.8) return 'high';
    if (confidence > 0.5) return 'medium';
    return 'low';
  }

  private getDefaultLearningAreas(): any[] {
    const domainCounts = new Map<string, number>();
    const domainConfidences = new Map<string, number[]>();
    
    this.patterns.forEach(pattern => {
      const domain = pattern.domain;
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      
      if (!domainConfidences.has(domain)) {
        domainConfidences.set(domain, []);
      }
      domainConfidences.get(domain)!.push(pattern.confidence);
    });
    
    const learningAreas = [];
    for (const [domain, count] of domainCounts.entries()) {
      const confidences = domainConfidences.get(domain)!;
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      
      learningAreas.push({
        name: this.formatDomainName(domain),
        progress: Math.round(avgConfidence * 100),
        confidence: Math.round(avgConfidence * 100) / 100,
        category: 'learning'
      });
    }
    
    return learningAreas;
  }

  private formatDomainName(domain: string): string {
    return domain.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private updateUserProfile(userId: string, learningData: LearningData, adaptations: string[]): void {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        id: userId,
        preferences: {},
        learningAreas: [],
        interactionHistory: [],
        adaptationMetrics: {
          totalInteractions: 0,
          patternsLearned: 0,
          adaptationsMade: 0,
          accuracyImprovement: 0
        }
      });
    }
    
    const profile = this.userProfiles.get(userId)!;
    
    // Update interaction history
    profile.interactionHistory.push({
      timestamp: Date.now(),
      action: 'learning',
      feedback: learningData.feedback,
      context: learningData.context
    });
    
    // Update metrics
    profile.adaptationMetrics.totalInteractions++;
    if (adaptations.includes('Created new learning pattern')) {
      profile.adaptationMetrics.patternsLearned++;
    }
    profile.adaptationMetrics.adaptationsMade += adaptations.length;
    
    // Keep only recent interactions
    if (profile.interactionHistory.length > 100) {
      profile.interactionHistory = profile.interactionHistory.slice(-100);
    }
  }

  private performMaintenance(): void {
    // Apply forgetting factor to reduce confidence of old patterns
    const now = Date.now();
    const forgettingThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    this.patterns.forEach(pattern => {
      const age = now - pattern.lastUsed;
      if (age > forgettingThreshold) {
        pattern.confidence = Math.max(0.1, 
          pattern.confidence * (1 - this.config.forgettingFactor)
        );
      }
    });
    
    // Remove patterns with very low confidence and frequency
    const toRemove: string[] = [];
    this.patterns.forEach((pattern, id) => {
      if (pattern.confidence < 0.2 && pattern.frequency < 2) {
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => this.patterns.delete(id));
    
    console.log(`🧠 Learning maintenance: ${toRemove.length} patterns removed`);
  }

  async generateRecommendations(context?: any): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    
    // Analyze learning patterns for recommendations
    const patterns = Array.from(this.patterns.values());
    const lowConfidencePatterns = patterns.filter(p => p.confidence < 0.6);
    const underutilizedPatterns = patterns.filter(p => p.frequency < 3);
    
    if (lowConfidencePatterns.length > 0) {
      recommendations.push({
        type: 'adaptation',
        title: 'Improve Low-Confidence Patterns',
        description: `${lowConfidencePatterns.length} patterns have low confidence scores`,
        confidence: 0.8,
        priority: 'medium',
        suggestedAction: 'Gather more training data or user feedback for these patterns',
        reasoning: 'Low confidence patterns may lead to poor predictions'
      });
    }
    
    if (underutilizedPatterns.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Optimize Pattern Usage',
        description: `${underutilizedPatterns.length} patterns are rarely used`,
        confidence: 0.7,
        priority: 'low',
        suggestedAction: 'Review and potentially remove unused patterns',
        reasoning: 'Unused patterns consume resources without providing value'
      });
    }
    
    // Domain-specific recommendations
    const domainCoverage = this.analyzeDomainCoverage();
    if (domainCoverage.gaps.length > 0) {
      recommendations.push({
        type: 'exploration',
        title: 'Expand Learning Domains',
        description: `Limited coverage in: ${domainCoverage.gaps.join(', ')}`,
        confidence: 0.6,
        priority: 'medium',
        suggestedAction: 'Collect more data in underrepresented domains',
        reasoning: 'Diverse training data improves overall system capability'
      });
    }
    
    return recommendations;
  }

  private analyzeDomainCoverage(): { covered: string[]; gaps: string[] } {
    const expectedDomains = ['code-analysis', 'problem-solving', 'optimization', 'debugging', 'design'];
    const coveredDomains = new Set(
      Array.from(this.patterns.values()).map(p => p.domain)
    );
    
    const gaps = expectedDomains.filter(domain => !coveredDomains.has(domain));
    
    return {
      covered: Array.from(coveredDomains),
      gaps
    };
  }

  // Configuration methods
  updateConfig(newConfig: Partial<LearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Learning configuration updated:', newConfig);
  }

  getConfig(): LearningConfig {
    return { ...this.config };
  }

  // Export/Import for persistence
  exportLearningData(): any {
    return {
      patterns: Array.from(this.patterns.entries()),
      userProfiles: Array.from(this.userProfiles.entries()),
      config: this.config,
      learningHistory: this.learningHistory.slice(-100) // Last 100 events
    };
  }

  importLearningData(data: any): void {
    if (data.patterns) {
      this.patterns = new Map(data.patterns);
    }
    if (data.userProfiles) {
      this.userProfiles = new Map(data.userProfiles);
    }
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    if (data.learningHistory) {
      this.learningHistory = data.learningHistory;
    }
    
    console.log('📥 Learning data imported successfully');
  }

  // Analytics methods
  getLearningAnalytics(): any {
    const patterns = Array.from(this.patterns.values());
    
    return {
      totalPatterns: patterns.length,
      averageConfidence: this.calculateAverageConfidence(),
      domainDistribution: this.getDomainDistribution(),
      learningVelocity: this.calculateLearningVelocity(),
      patternUtilization: this.calculatePatternUtilization()
    };
  }

  private getDomainDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.patterns.forEach(pattern => {
      distribution[pattern.domain] = (distribution[pattern.domain] || 0) + 1;
    });
    return distribution;
  }

  private calculateLearningVelocity(): number {
    const recentEvents = this.learningHistory.filter(
      event => Date.now() - event.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    return recentEvents.length;
  }

  private calculatePatternUtilization(): number {
    const patterns = Array.from(this.patterns.values());
    const totalFreq = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const avgFreq = totalFreq / patterns.length;
    return Math.round(avgFreq * 100) / 100;
  }
}

export const adaptiveLearningSkill = new AdaptiveLearningSkill();