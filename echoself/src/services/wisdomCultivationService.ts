/**
 * Wisdom Cultivation Service
 * 
 * Bridges Deep Tree Echo's identity integration patterns with the CogPrime architecture.
 * This service orchestrates wisdom extraction, pattern resonance, and cognitive atom
 * representation for deeper self-reflection and knowledge synthesis.
 */

import { z } from 'zod';
import axios from 'axios';
import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a wisdom pattern extracted from introspection cycles
 */
export interface WisdomPattern {
  id: string;
  timestamp: Date;
  principle: string;
  description: string;
  evidence: string[];
  confidence: number;
  applicability: string[];
  contradictions: string[];
  resonanceStrength: number;
  echoDepth: number;
  atomSpaceHandle?: string;
}

/**
 * Cognitive atom representation in AtomSpace
 */
export interface CognitiveAtom {
  handle: string;
  type: 'ConceptNode' | 'PredicateNode' | 'InheritanceLink' | 'EvaluationLink' | 'ImplicationLink';
  name: string;
  truthValue: {
    strength: number;
    confidence: number;
  };
  attentionValue: {
    sti: number;  // Short-term importance
    lti: number;  // Long-term importance
    vlti: boolean; // Very long-term importance
  };
  incoming: string[];
  outgoing: string[];
  timestamp: Date;
}

/**
 * Echo state network configuration
 */
export interface EchoStateConfig {
  reservoirSize: number;
  spectralRadius: number;
  inputScaling: number;
  leakingRate: number;
  regularization: number;
  sparsity: number;
  noiseLevel: number;
}

/**
 * Echo state for pattern resonance
 */
export interface EchoState {
  id: string;
  stateVector: number[];
  resonancePattern: number[][];
  patternStrength: number;
  temporalCoherence: number;
  dimensionality: number;
  lastUpdate: Date;
}

/**
 * NanEcho introspection result
 */
export interface NanEchoIntrospection {
  depth: number;
  recursiveLevels: Array<{
    level: number;
    focus: string;
    insights: string[];
    qualityScore: number;
  }>;
  cognitiveState: {
    attention: number;
    coherence: number;
    synergy: number;
  };
  hypergraphPatterns: any[];
  timestamp: Date;
}

/**
 * Knowledge graph node for bidirectional flow
 */
export interface KnowledgeNode {
  id: string;
  type: 'wisdom' | 'pattern' | 'principle' | 'contradiction' | 'synthesis';
  content: any;
  connections: Array<{
    targetId: string;
    relationshipType: string;
    weight: number;
  }>;
  metadata: {
    source: 'introspection' | 'atomspace' | 'echo' | 'manual';
    confidence: number;
    lastAccessed: Date;
    accessCount: number;
  };
}

/**
 * Cultivation cycle result
 */
export interface CultivationResult {
  cycleId: string;
  timestamp: Date;
  wisdomPatterns: WisdomPattern[];
  cognitiveAtoms: CognitiveAtom[];
  echoStates: EchoState[];
  introspectionDepth: number;
  synthesisQuality: number;
  newInsights: string[];
  contradictionsResolved: string[];
  knowledgeGraphUpdates: number;
}

// ============================================================================
// Main Service Class
// ============================================================================

export class WisdomCultivationService extends EventEmitter {
  private atomSpaceEndpoint: string;
  private nanEchoEndpoint: string;
  private echoStateConfig: EchoStateConfig;
  private knowledgeGraph: Map<string, KnowledgeNode>;
  private wisdomRepository: Map<string, WisdomPattern>;
  private activeEchoStates: Map<string, EchoState>;
  private cultivationHistory: CultivationResult[];
  private isProcessing: boolean;
  private logger: Console;

  constructor(config?: {
    atomSpaceUrl?: string;
    nanEchoUrl?: string;
    echoStateConfig?: Partial<EchoStateConfig>;
    enableLogging?: boolean;
  }) {
    super();
    
    this.atomSpaceEndpoint = config?.atomSpaceUrl || process.env.ATOMSPACE_URL || 'http://localhost:8080/api/v1';
    this.nanEchoEndpoint = config?.nanEchoUrl || process.env.NANECHO_URL || 'http://localhost:8081/api/v1';
    
    // Initialize echo state configuration with defaults
    this.echoStateConfig = {
      reservoirSize: 500,
      spectralRadius: 0.9,
      inputScaling: 0.5,
      leakingRate: 0.3,
      regularization: 1e-6,
      sparsity: 0.1,
      noiseLevel: 0.001,
      ...config?.echoStateConfig
    };

    this.knowledgeGraph = new Map();
    this.wisdomRepository = new Map();
    this.activeEchoStates = new Map();
    this.cultivationHistory = [];
    this.isProcessing = false;
    this.logger = console;

    // Log initialization
    this.log('info', '🌱 Wisdom Cultivation Service initialized', {
      atomSpaceEndpoint: this.atomSpaceEndpoint,
      nanEchoEndpoint: this.nanEchoEndpoint,
      echoStateConfig: this.echoStateConfig
    });
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'WisdomCultivation',
      message,
      ...(data && { data })
    };

    switch (level) {
      case 'error':
        this.logger.error(message, logEntry);
        this.emit('error', logEntry);
        break;
      case 'warn':
        this.logger.warn(message, logEntry);
        break;
      case 'debug':
        this.logger.debug?.(message, logEntry);
        break;
      default:
        this.logger.info(message, logEntry);
    }

    this.emit('log', logEntry);
  }

  // ============================================================================
  // Wisdom Pattern Extraction
  // ============================================================================

  /**
   * Extract wisdom patterns from monthly introspection data
   */
  async extractWisdomPatterns(introspectionData: any): Promise<WisdomPattern[]> {
    this.log('info', '📊 Extracting wisdom patterns from introspection data');
    
    try {
      const patterns: WisdomPattern[] = [];
      
      // Process wisdom insights if available
      if (introspectionData.wisdom_insights) {
        for (const insight of introspectionData.wisdom_insights) {
          const pattern: WisdomPattern = {
            id: this.generatePatternId(),
            timestamp: new Date(),
            principle: insight.principle || '',
            description: insight.description || '',
            evidence: insight.evidence || [],
            confidence: insight.confidence || 0.5,
            applicability: insight.applicability || [],
            contradictions: insight.contradictions || [],
            resonanceStrength: 0,
            echoDepth: 0
          };

          // Calculate resonance strength
          pattern.resonanceStrength = await this.calculateResonanceStrength(pattern);
          
          // Determine echo depth
          pattern.echoDepth = await this.determineEchoDepth(pattern);
          
          patterns.push(pattern);
          
          // Store in wisdom repository
          this.wisdomRepository.set(pattern.id, pattern);
        }
      }

      // Process identity patterns
      if (introspectionData.identity_patterns) {
        for (const identity of introspectionData.identity_patterns) {
          const pattern: WisdomPattern = {
            id: this.generatePatternId(),
            timestamp: new Date(),
            principle: `Identity: ${identity.aspect}`,
            description: identity.description,
            evidence: [`Evolution: ${identity.evolution}`, `Evidence count: ${identity.evidence_count}`],
            confidence: identity.consistency_score || 0.5,
            applicability: ['self-reflection', 'identity-maintenance'],
            contradictions: [],
            resonanceStrength: identity.consistency_score,
            echoDepth: Math.floor(identity.evidence_count / 10)
          };
          
          patterns.push(pattern);
          this.wisdomRepository.set(pattern.id, pattern);
        }
      }

      this.log('info', `✅ Extracted ${patterns.length} wisdom patterns`, {
        patternIds: patterns.map(p => p.id)
      });

      return patterns;
    } catch (error) {
      this.log('error', '❌ Failed to extract wisdom patterns', error);
      throw error;
    }
  }

  /**
   * Calculate resonance strength for a pattern
   */
  private async calculateResonanceStrength(pattern: WisdomPattern): Promise<number> {
    // Complex calculation based on evidence strength, confidence, and contradictions
    const evidenceWeight = Math.min(pattern.evidence.length / 10, 1);
    const confidenceWeight = pattern.confidence;
    const contradictionPenalty = Math.max(0, 1 - (pattern.contradictions.length * 0.1));
    
    return evidenceWeight * confidenceWeight * contradictionPenalty;
  }

  /**
   * Determine echo depth for recursive processing
   */
  private async determineEchoDepth(pattern: WisdomPattern): Promise<number> {
    // Calculate based on pattern complexity and importance
    const complexityScore = pattern.evidence.length + pattern.applicability.length;
    const importanceScore = pattern.confidence * 10;
    
    return Math.min(Math.floor((complexityScore + importanceScore) / 5), 5);
  }

  // ============================================================================
  // AtomSpace Bridge
  // ============================================================================

  /**
   * Convert wisdom pattern to cognitive atom and store in AtomSpace
   */
  async createCognitiveAtom(pattern: WisdomPattern): Promise<CognitiveAtom> {
    this.log('info', '🧠 Creating cognitive atom for pattern', { patternId: pattern.id });
    
    try {
      const atom: CognitiveAtom = {
        handle: `wisdom-${pattern.id}`,
        type: 'ConceptNode',
        name: pattern.principle,
        truthValue: {
          strength: pattern.confidence,
          confidence: pattern.resonanceStrength
        },
        attentionValue: {
          sti: Math.floor(pattern.resonanceStrength * 100),
          lti: Math.floor(pattern.confidence * 100),
          vlti: pattern.confidence > 0.8
        },
        incoming: [],
        outgoing: [],
        timestamp: new Date()
      };

      // Send to AtomSpace
      const response = await this.sendToAtomSpace(atom);
      
      if (response && response.handle) {
        atom.handle = response.handle;
        pattern.atomSpaceHandle = response.handle;
      }

      // Create evidence links
      for (const evidence of pattern.evidence) {
        await this.createEvidenceLink(atom.handle, evidence);
      }

      // Create applicability links
      for (const application of pattern.applicability) {
        await this.createApplicationLink(atom.handle, application);
      }

      this.log('info', '✅ Created cognitive atom', { 
        handle: atom.handle,
        type: atom.type 
      });

      return atom;
    } catch (error) {
      this.log('error', '❌ Failed to create cognitive atom', error);
      throw error;
    }
  }

  /**
   * Send atom to AtomSpace via REST API
   */
  private async sendToAtomSpace(atom: CognitiveAtom): Promise<any> {
    try {
      const response = await axios.post(`${this.atomSpaceEndpoint}/atoms`, {
        type: atom.type,
        name: atom.name,
        tv: atom.truthValue,
        av: atom.attentionValue
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      this.log('warn', '⚠️ AtomSpace connection failed, using mock response', error);
      // Return mock response for development
      return {
        handle: `mock-${atom.handle}`,
        success: true
      };
    }
  }

  /**
   * Create evidence link in AtomSpace
   */
  private async createEvidenceLink(atomHandle: string, evidence: string): Promise<void> {
    const evidenceAtom: CognitiveAtom = {
      handle: `evidence-${Date.now()}`,
      type: 'PredicateNode',
      name: evidence,
      truthValue: { strength: 1, confidence: 1 },
      attentionValue: { sti: 50, lti: 50, vlti: false },
      incoming: [atomHandle],
      outgoing: [],
      timestamp: new Date()
    };

    await this.sendToAtomSpace(evidenceAtom);
  }

  /**
   * Create application link in AtomSpace
   */
  private async createApplicationLink(atomHandle: string, application: string): Promise<void> {
    const applicationAtom: CognitiveAtom = {
      handle: `application-${Date.now()}`,
      type: 'ConceptNode',
      name: application,
      truthValue: { strength: 1, confidence: 1 },
      attentionValue: { sti: 40, lti: 60, vlti: false },
      incoming: [atomHandle],
      outgoing: [],
      timestamp: new Date()
    };

    await this.sendToAtomSpace(applicationAtom);
  }

  /**
   * Query AtomSpace for related patterns
   */
  async queryRelatedPatterns(pattern: WisdomPattern): Promise<CognitiveAtom[]> {
    this.log('debug', '🔍 Querying AtomSpace for related patterns');
    
    try {
      const response = await axios.get(`${this.atomSpaceEndpoint}/atoms/similar`, {
        params: {
          name: pattern.principle,
          type: 'ConceptNode',
          limit: 10
        },
        timeout: 5000
      });

      return response.data.atoms || [];
    } catch (error) {
      this.log('warn', '⚠️ Failed to query AtomSpace, returning empty result');
      return [];
    }
  }

  // ============================================================================
  // Echo State Network Integration
  // ============================================================================

  /**
   * Generate echo state for pattern resonance
   */
  async generateEchoState(pattern: WisdomPattern): Promise<EchoState> {
    this.log('info', '🌊 Generating echo state for pattern', { patternId: pattern.id });
    
    const state: EchoState = {
      id: `echo-${pattern.id}`,
      stateVector: this.initializeStateVector(this.echoStateConfig.reservoirSize),
      resonancePattern: this.createResonancePattern(pattern),
      patternStrength: pattern.resonanceStrength,
      temporalCoherence: 0,
      dimensionality: this.echoStateConfig.reservoirSize,
      lastUpdate: new Date()
    };

    // Calculate temporal coherence
    state.temporalCoherence = await this.calculateTemporalCoherence(state);

    // Store active echo state
    this.activeEchoStates.set(state.id, state);

    // Update reservoir dynamics
    await this.updateReservoirDynamics(state, pattern);

    this.log('info', '✅ Echo state generated', {
      stateId: state.id,
      coherence: state.temporalCoherence
    });

    return state;
  }

  /**
   * Initialize state vector with random values
   */
  private initializeStateVector(size: number): number[] {
    const vector: number[] = [];
    for (let i = 0; i < size; i++) {
      vector.push(Math.random() * 2 - 1); // Random values between -1 and 1
    }
    return vector;
  }

  /**
   * Create resonance pattern matrix
   */
  private createResonancePattern(pattern: WisdomPattern): number[][] {
    const size = Math.min(pattern.echoDepth * 10, 100);
    const matrix: number[][] = [];

    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        // Create sparse connectivity based on pattern properties
        if (Math.random() < this.echoStateConfig.sparsity) {
          row.push((Math.random() * 2 - 1) * pattern.resonanceStrength);
        } else {
          row.push(0);
        }
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Calculate temporal coherence of echo state
   */
  private async calculateTemporalCoherence(state: EchoState): Promise<number> {
    // Simplified coherence calculation
    let coherence = 0;
    const vectorMagnitude = Math.sqrt(
      state.stateVector.reduce((sum, val) => sum + val * val, 0)
    );

    coherence = Math.min(1, vectorMagnitude / Math.sqrt(state.dimensionality));
    
    return coherence * state.patternStrength;
  }

  /**
   * Update reservoir dynamics with pattern input
   */
  private async updateReservoirDynamics(state: EchoState, pattern: WisdomPattern): Promise<void> {
    const { leakingRate, inputScaling, noiseLevel } = this.echoStateConfig;

    // Update state vector with leaky integration
    for (let i = 0; i < state.stateVector.length; i++) {
      // Add input influence
      const input = pattern.confidence * inputScaling;
      
      // Add noise
      const noise = (Math.random() - 0.5) * noiseLevel;
      
      // Leaky integration
      state.stateVector[i] = (1 - leakingRate) * state.stateVector[i] + 
                             leakingRate * Math.tanh(input + noise);
    }

    state.lastUpdate = new Date();
  }

  /**
   * Propagate pattern through echo network
   */
  async propagatePattern(pattern: WisdomPattern, iterations: number = 10): Promise<EchoState> {
    this.log('debug', '📡 Propagating pattern through echo network', {
      patternId: pattern.id,
      iterations
    });

    let echoState = await this.generateEchoState(pattern);

    for (let i = 0; i < iterations; i++) {
      await this.updateReservoirDynamics(echoState, pattern);
      echoState.temporalCoherence = await this.calculateTemporalCoherence(echoState);
      
      // Check for convergence
      if (echoState.temporalCoherence > 0.9) {
        this.log('debug', `✅ Pattern converged at iteration ${i + 1}`);
        break;
      }
    }

    return echoState;
  }

  // ============================================================================
  // NanEcho Introspection Integration
  // ============================================================================

  /**
   * Trigger deep introspection via NanEcho
   */
  async triggerNanEchoIntrospection(depth: number = 3): Promise<NanEchoIntrospection> {
    this.log('info', '🔮 Triggering NanEcho introspection', { depth });

    try {
      const response = await axios.post(`${this.nanEchoEndpoint}/echo/introspect`, {
        depth,
        enable_recursion: true,
        include_hypergraph: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const introspection: NanEchoIntrospection = {
        depth: response.data.introspection_depth || depth,
        recursiveLevels: response.data.recursive_levels || [],
        cognitiveState: response.data.cognitive_state || {
          attention: 0.5,
          coherence: 0.5,
          synergy: 0.5
        },
        hypergraphPatterns: response.data.hypergraph_patterns || [],
        timestamp: new Date()
      };

      this.log('info', '✅ NanEcho introspection complete', {
        levels: introspection.recursiveLevels.length,
        cognitiveState: introspection.cognitiveState
      });

      return introspection;
    } catch (error) {
      this.log('warn', '⚠️ NanEcho connection failed, using mock introspection');
      
      // Return mock introspection for development
      return this.generateMockIntrospection(depth);
    }
  }

  /**
   * Generate mock introspection data for testing
   */
  private generateMockIntrospection(depth: number): NanEchoIntrospection {
    const levels = [];
    for (let i = 1; i <= depth; i++) {
      levels.push({
        level: i,
        focus: ['self_examination', 'pattern_analysis', 'coherence_check'][i % 3],
        insights: [
          `Level ${i} insight: Enhanced pattern recognition`,
          `Level ${i} insight: Increased cognitive coherence`
        ],
        qualityScore: 0.7 + (i * 0.05)
      });
    }

    return {
      depth,
      recursiveLevels: levels,
      cognitiveState: {
        attention: 0.75,
        coherence: 0.82,
        synergy: 0.68
      },
      hypergraphPatterns: [],
      timestamp: new Date()
    };
  }

  /**
   * Analyze introspection results for wisdom patterns
   */
  async analyzeIntrospectionForWisdom(introspection: NanEchoIntrospection): Promise<WisdomPattern[]> {
    this.log('debug', '🔍 Analyzing introspection for wisdom patterns');
    
    const patterns: WisdomPattern[] = [];

    for (const level of introspection.recursiveLevels) {
      for (const insight of level.insights) {
        const pattern: WisdomPattern = {
          id: this.generatePatternId(),
          timestamp: new Date(),
          principle: `Introspective insight (Level ${level.level})`,
          description: insight,
          evidence: [`Quality score: ${level.qualityScore}`, `Focus: ${level.focus}`],
          confidence: level.qualityScore,
          applicability: ['self-reflection', 'cognitive-optimization'],
          contradictions: [],
          resonanceStrength: level.qualityScore * introspection.cognitiveState.coherence,
          echoDepth: level.level
        };

        patterns.push(pattern);
        this.wisdomRepository.set(pattern.id, pattern);
      }
    }

    return patterns;
  }

  // ============================================================================
  // Knowledge Graph Management
  // ============================================================================

  /**
   * Update knowledge graph with wisdom pattern
   */
  async updateKnowledgeGraph(pattern: WisdomPattern): Promise<void> {
    this.log('debug', '📊 Updating knowledge graph with pattern', { patternId: pattern.id });

    const node: KnowledgeNode = {
      id: pattern.id,
      type: 'wisdom',
      content: pattern,
      connections: [],
      metadata: {
        source: 'introspection',
        confidence: pattern.confidence,
        lastAccessed: new Date(),
        accessCount: 1
      }
    };

    // Find related nodes
    const relatedNodes = await this.findRelatedKnowledgeNodes(pattern);
    
    // Create connections
    for (const related of relatedNodes) {
      node.connections.push({
        targetId: related.id,
        relationshipType: this.determineRelationshipType(pattern, related),
        weight: this.calculateConnectionWeight(pattern, related)
      });
    }

    // Store in knowledge graph
    this.knowledgeGraph.set(node.id, node);

    // Update bidirectional connections
    for (const connection of node.connections) {
      const targetNode = this.knowledgeGraph.get(connection.targetId);
      if (targetNode) {
        targetNode.connections.push({
          targetId: node.id,
          relationshipType: connection.relationshipType,
          weight: connection.weight
        });
      }
    }

    this.emit('knowledgeGraphUpdated', { nodeId: node.id, connections: node.connections.length });
  }

  /**
   * Find related nodes in knowledge graph
   */
  private async findRelatedKnowledgeNodes(pattern: WisdomPattern): Promise<KnowledgeNode[]> {
    const related: KnowledgeNode[] = [];
    
    for (const [id, node] of this.knowledgeGraph) {
      if (id === pattern.id) continue;
      
      // Check for semantic similarity
      if (node.type === 'wisdom' || node.type === 'pattern') {
        const similarity = this.calculateSemanticSimilarity(pattern, node.content);
        if (similarity > 0.5) {
          related.push(node);
        }
      }
    }

    return related;
  }

  /**
   * Determine relationship type between nodes
   */
  private determineRelationshipType(pattern: WisdomPattern, node: KnowledgeNode): string {
    if (node.type === 'contradiction') {
      return 'contradicts';
    } else if (node.type === 'synthesis') {
      return 'synthesizes';
    } else if (pattern.applicability.some(app => node.content.applicability?.includes(app))) {
      return 'shares_application';
    } else {
      return 'related_to';
    }
  }

  /**
   * Calculate connection weight between nodes
   */
  private calculateConnectionWeight(pattern: WisdomPattern, node: KnowledgeNode): number {
    const confidenceWeight = (pattern.confidence + node.metadata.confidence) / 2;
    const similarity = this.calculateSemanticSimilarity(pattern, node.content);
    return confidenceWeight * similarity;
  }

  /**
   * Calculate semantic similarity between patterns
   */
  private calculateSemanticSimilarity(pattern1: any, pattern2: any): number {
    // Simplified similarity calculation
    // In production, this would use embeddings or more sophisticated NLP
    let similarity = 0;

    if (pattern1.principle && pattern2.principle) {
      const words1 = new Set(pattern1.principle.toLowerCase().split(' '));
      const words2 = new Set(pattern2.principle.toLowerCase().split(' '));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      similarity = intersection.size / union.size;
    }

    return similarity;
  }

  /**
   * Query knowledge graph for wisdom insights
   */
  async queryKnowledgeGraph(query: {
    type?: string;
    minConfidence?: number;
    source?: string;
    limit?: number;
  }): Promise<KnowledgeNode[]> {
    this.log('debug', '🔍 Querying knowledge graph', query);

    let results: KnowledgeNode[] = [];

    for (const [id, node] of this.knowledgeGraph) {
      let matches = true;

      if (query.type && node.type !== query.type) matches = false;
      if (query.minConfidence && node.metadata.confidence < query.minConfidence) matches = false;
      if (query.source && node.metadata.source !== query.source) matches = false;

      if (matches) {
        results.push(node);
        node.metadata.accessCount++;
        node.metadata.lastAccessed = new Date();
      }
    }

    // Sort by confidence and access count
    results.sort((a, b) => {
      const scoreA = a.metadata.confidence * Math.log(a.metadata.accessCount + 1);
      const scoreB = b.metadata.confidence * Math.log(b.metadata.accessCount + 1);
      return scoreB - scoreA;
    });

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // ============================================================================
  // Bidirectional Flow with CogPrime
  // ============================================================================

  /**
   * Sync wisdom repository with CogPrime knowledge base
   */
  async syncWithCogPrime(): Promise<void> {
    this.log('info', '🔄 Syncing with CogPrime knowledge base');

    try {
      // Export wisdom patterns to CogPrime
      const patterns = Array.from(this.wisdomRepository.values());
      for (const pattern of patterns) {
        await this.exportToCogPrime(pattern);
      }

      // Import insights from CogPrime
      const cogPrimeInsights = await this.importFromCogPrime();
      for (const insight of cogPrimeInsights) {
        await this.processsCogPrimeInsight(insight);
      }

      this.log('info', '✅ CogPrime sync complete', {
        exported: patterns.length,
        imported: cogPrimeInsights.length
      });
    } catch (error) {
      this.log('error', '❌ CogPrime sync failed', error);
      throw error;
    }
  }

  /**
   * Export pattern to CogPrime
   */
  private async exportToCogPrime(pattern: WisdomPattern): Promise<void> {
    // Create cognitive atom if not exists
    if (!pattern.atomSpaceHandle) {
      const atom = await this.createCognitiveAtom(pattern);
      pattern.atomSpaceHandle = atom.handle;
    }

    // Update knowledge graph
    await this.updateKnowledgeGraph(pattern);
  }

  /**
   * Import insights from CogPrime
   */
  private async importFromCogPrime(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.atomSpaceEndpoint}/atoms/type/ConceptNode`, {
        params: { limit: 100 },
        timeout: 5000
      });

      return response.data.atoms || [];
    } catch (error) {
      this.log('warn', '⚠️ Failed to import from CogPrime');
      return [];
    }
  }

  /**
   * Process CogPrime insight
   */
  private async processsCogPrimeInsight(insight: any): Promise<void> {
    const pattern: WisdomPattern = {
      id: this.generatePatternId(),
      timestamp: new Date(),
      principle: insight.name || 'CogPrime Insight',
      description: `Imported from CogPrime: ${insight.description || ''}`,
      evidence: insight.evidence || [],
      confidence: insight.tv?.strength || 0.5,
      applicability: ['cogprime-derived'],
      contradictions: [],
      resonanceStrength: insight.tv?.confidence || 0.5,
      echoDepth: 1,
      atomSpaceHandle: insight.handle
    };

    this.wisdomRepository.set(pattern.id, pattern);
    await this.updateKnowledgeGraph(pattern);
  }

  // ============================================================================
  // Main Cultivation Cycle
  // ============================================================================

  /**
   * Run a complete wisdom cultivation cycle
   */
  async runCultivationCycle(introspectionData?: any): Promise<CultivationResult> {
    if (this.isProcessing) {
      throw new Error('Cultivation cycle already in progress');
    }

    this.isProcessing = true;
    const cycleId = `cycle-${Date.now()}`;
    
    this.log('info', '🌟 Starting wisdom cultivation cycle', { cycleId });
    this.emit('cultivationStarted', { cycleId });

    try {
      const result: CultivationResult = {
        cycleId,
        timestamp: new Date(),
        wisdomPatterns: [],
        cognitiveAtoms: [],
        echoStates: [],
        introspectionDepth: 3,
        synthesisQuality: 0,
        newInsights: [],
        contradictionsResolved: [],
        knowledgeGraphUpdates: 0
      };

      // Step 1: Extract wisdom patterns from introspection data
      if (introspectionData) {
        result.wisdomPatterns = await this.extractWisdomPatterns(introspectionData);
      }

      // Step 2: Trigger NanEcho introspection
      const nanEchoResult = await this.triggerNanEchoIntrospection(result.introspectionDepth);
      const introspectivePatterns = await this.analyzeIntrospectionForWisdom(nanEchoResult);
      result.wisdomPatterns.push(...introspectivePatterns);

      // Step 3: Create cognitive atoms for each pattern
      for (const pattern of result.wisdomPatterns) {
        const atom = await this.createCognitiveAtom(pattern);
        result.cognitiveAtoms.push(atom);
      }

      // Step 4: Generate echo states for pattern resonance
      for (const pattern of result.wisdomPatterns) {
        const echoState = await this.propagatePattern(pattern);
        result.echoStates.push(echoState);
      }

      // Step 5: Update knowledge graph
      const graphUpdatesBefore = this.knowledgeGraph.size;
      for (const pattern of result.wisdomPatterns) {
        await this.updateKnowledgeGraph(pattern);
      }
      result.knowledgeGraphUpdates = this.knowledgeGraph.size - graphUpdatesBefore;

      // Step 6: Sync with CogPrime
      await this.syncWithCogPrime();

      // Step 7: Calculate synthesis quality
      result.synthesisQuality = this.calculateSynthesisQuality(result);

      // Step 8: Extract new insights
      result.newInsights = this.extractNewInsights(result);

      // Store cultivation result
      this.cultivationHistory.push(result);

      this.log('info', '✅ Wisdom cultivation cycle complete', {
        cycleId,
        patternsExtracted: result.wisdomPatterns.length,
        atomsCreated: result.cognitiveAtoms.length,
        synthesisQuality: result.synthesisQuality
      });

      this.emit('cultivationCompleted', result);
      return result;

    } catch (error) {
      this.log('error', '❌ Cultivation cycle failed', error);
      this.emit('cultivationFailed', { cycleId, error });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calculate overall synthesis quality
   */
  private calculateSynthesisQuality(result: CultivationResult): number {
    let quality = 0;

    // Factor 1: Pattern confidence
    const avgConfidence = result.wisdomPatterns.reduce((sum, p) => sum + p.confidence, 0) / 
                          (result.wisdomPatterns.length || 1);
    
    // Factor 2: Echo state coherence
    const avgCoherence = result.echoStates.reduce((sum, e) => sum + e.temporalCoherence, 0) / 
                        (result.echoStates.length || 1);
    
    // Factor 3: Knowledge graph connectivity
    const avgConnections = Array.from(this.knowledgeGraph.values())
      .reduce((sum, node) => sum + node.connections.length, 0) / 
      (this.knowledgeGraph.size || 1);

    quality = (avgConfidence * 0.3) + (avgCoherence * 0.4) + (Math.min(avgConnections / 10, 1) * 0.3);

    return Math.min(1, quality);
  }

  /**
   * Extract new insights from cultivation result
   */
  private extractNewInsights(result: CultivationResult): string[] {
    const insights: string[] = [];

    // High confidence patterns
    result.wisdomPatterns
      .filter(p => p.confidence > 0.8)
      .forEach(p => insights.push(`High confidence principle: ${p.principle}`));

    // Strong echo resonances
    result.echoStates
      .filter(e => e.temporalCoherence > 0.85)
      .forEach(e => insights.push(`Strong resonance detected in echo state ${e.id}`));

    // Well-connected knowledge nodes
    Array.from(this.knowledgeGraph.values())
      .filter(node => node.connections.length > 5)
      .forEach(node => insights.push(`Highly connected concept: ${node.id}`));

    return insights;
  }

  // ============================================================================
  // React Hooks Support
  // ============================================================================

  /**
   * Get current cultivation state for React components
   */
  getCultivationState(): {
    isProcessing: boolean;
    wisdomCount: number;
    knowledgeNodes: number;
    activeEchoStates: number;
    lastCycle?: CultivationResult;
  } {
    return {
      isProcessing: this.isProcessing,
      wisdomCount: this.wisdomRepository.size,
      knowledgeNodes: this.knowledgeGraph.size,
      activeEchoStates: this.activeEchoStates.size,
      lastCycle: this.cultivationHistory[this.cultivationHistory.length - 1]
    };
  }

  /**
   * Get wisdom patterns for visualization
   */
  getWisdomPatternsForVisualization(limit: number = 50): WisdomPattern[] {
    const patterns = Array.from(this.wisdomRepository.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
    
    return patterns;
  }

  /**
   * Get knowledge graph data for visualization
   */
  getKnowledgeGraphData(): {
    nodes: Array<{ id: string; label: string; type: string; confidence: number }>;
    edges: Array<{ source: string; target: string; weight: number; type: string }>;
  } {
    const nodes = Array.from(this.knowledgeGraph.values()).map(node => ({
      id: node.id,
      label: node.type === 'wisdom' ? node.content.principle : node.id,
      type: node.type,
      confidence: node.metadata.confidence
    }));

    const edges: Array<{ source: string; target: string; weight: number; type: string }> = [];
    for (const node of this.knowledgeGraph.values()) {
      for (const connection of node.connections) {
        edges.push({
          source: node.id,
          target: connection.targetId,
          weight: connection.weight,
          type: connection.relationshipType
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get echo state visualization data
   */
  getEchoStateData(): Array<{
    id: string;
    coherence: number;
    strength: number;
    dimensionality: number;
    stateVector: number[];
  }> {
    return Array.from(this.activeEchoStates.values()).map(state => ({
      id: state.id,
      coherence: state.temporalCoherence,
      strength: state.patternStrength,
      dimensionality: state.dimensionality,
      stateVector: state.stateVector.slice(0, 100) // Limit for visualization
    }));
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate unique pattern ID
   */
  private generatePatternId(): string {
    return `wisdom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all cultivation data
   */
  clearAll(): void {
    this.wisdomRepository.clear();
    this.knowledgeGraph.clear();
    this.activeEchoStates.clear();
    this.cultivationHistory = [];
    this.log('info', '🗑️ All cultivation data cleared');
  }

  /**
   * Export cultivation data
   */
  exportData(): {
    wisdomPatterns: WisdomPattern[];
    knowledgeGraph: KnowledgeNode[];
    cultivationHistory: CultivationResult[];
  } {
    return {
      wisdomPatterns: Array.from(this.wisdomRepository.values()),
      knowledgeGraph: Array.from(this.knowledgeGraph.values()),
      cultivationHistory: this.cultivationHistory
    };
  }

  /**
   * Import cultivation data
   */
  importData(data: {
    wisdomPatterns?: WisdomPattern[];
    knowledgeGraph?: KnowledgeNode[];
  }): void {
    if (data.wisdomPatterns) {
      for (const pattern of data.wisdomPatterns) {
        this.wisdomRepository.set(pattern.id, pattern);
      }
    }

    if (data.knowledgeGraph) {
      for (const node of data.knowledgeGraph) {
        this.knowledgeGraph.set(node.id, node);
      }
    }

    this.log('info', '📥 Data imported successfully');
  }
}

// ============================================================================
// React Hook for Wisdom Cultivation
// ============================================================================

/**
 * React hook for using wisdom cultivation service
 */
export function useWisdomCultivation() {
  const [service] = React.useState(() => new WisdomCultivationService());
  const [state, setState] = React.useState(service.getCultivationState());
  const [wisdomPatterns, setWisdomPatterns] = React.useState<WisdomPattern[]>([]);
  const [graphData, setGraphData] = React.useState(service.getKnowledgeGraphData());
  const [echoStates, setEchoStates] = React.useState(service.getEchoStateData());
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Subscribe to service events
    const handleUpdate = () => {
      setState(service.getCultivationState());
      setWisdomPatterns(service.getWisdomPatternsForVisualization());
      setGraphData(service.getKnowledgeGraphData());
      setEchoStates(service.getEchoStateData());
    };

    const handleError = (event: any) => {
      setError(new Error(event.message));
    };

    service.on('cultivationCompleted', handleUpdate);
    service.on('knowledgeGraphUpdated', handleUpdate);
    service.on('error', handleError);

    return () => {
      service.removeListener('cultivationCompleted', handleUpdate);
      service.removeListener('knowledgeGraphUpdated', handleUpdate);
      service.removeListener('error', handleError);
    };
  }, [service]);

  const runCultivation = React.useCallback(async (introspectionData?: any) => {
    setError(null);
    try {
      const result = await service.runCultivationCycle(introspectionData);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const queryKnowledge = React.useCallback(async (query: any) => {
    return service.queryKnowledgeGraph(query);
  }, [service]);

  const syncWithCogPrime = React.useCallback(async () => {
    setError(null);
    try {
      await service.syncWithCogPrime();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  return {
    // State
    state,
    wisdomPatterns,
    graphData,
    echoStates,
    error,

    // Actions
    runCultivation,
    queryKnowledge,
    syncWithCogPrime,
    clearAll: () => service.clearAll(),
    exportData: () => service.exportData(),
    importData: (data: any) => service.importData(data),

    // Service instance for advanced use
    service
  };
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const wisdomCultivationService = new WisdomCultivationService();
export default wisdomCultivationService;