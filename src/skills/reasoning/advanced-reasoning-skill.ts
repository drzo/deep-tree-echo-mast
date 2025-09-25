import { z } from "zod";

/**
 * Advanced Reasoning Skill - Multi-step Problem Solving
 * Adapted from ai-opencog's AdvancedReasoningAgent
 * 
 * Provides sophisticated reasoning capabilities for complex problem-solving,
 * architecture decisions, and cognitive analysis.
 */

export const problemContextSchema = z.object({
  title: z.string().describe("Problem title/summary"),
  description: z.string().describe("Detailed problem description"),
  domain: z.enum(['architecture', 'performance', 'security', 'debugging', 'design', 'integration', 'scalability']).describe("Problem domain"),
  complexity: z.enum(['low', 'medium', 'high', 'expert']).describe("Problem complexity level"),
  constraints: z.array(z.string()).describe("Constraints and limitations"),
  goals: z.array(z.string()).describe("Desired outcomes and goals"),
  currentSolution: z.string().optional().describe("Current approach if any"),
  context: z.object({
    codebase: z.string().optional(),
    technology: z.array(z.string()).optional(),
    timeline: z.string().optional(),
    resources: z.array(z.string()).optional()
  }).optional().describe("Additional context information")
});

export type ProblemContext = z.infer<typeof problemContextSchema>;

export interface ReasoningStep {
  step: number;
  description: string;
  reasoning: string;
  confidence: number;
  dependencies?: string[];
}

export interface Alternative {
  approach: string;
  pros: string[];
  cons: string[];
  feasibility: number;
}

export interface ImplementationPhase {
  phase: string;
  tasks: string[];
  estimatedTime: string;
  dependencies: string[];
  risks: string[];
}

export interface ReasoningSolution {
  id: string;
  approach: string;
  reasoning: {
    type: 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'creative';
    steps: ReasoningStep[];
    conclusion: string;
    alternatives: Alternative[];
  };
  implementation: {
    phases: ImplementationPhase[];
    codeExamples?: string[];
    architecturalChanges?: string[];
    testingStrategy?: string;
  };
  validation: {
    successCriteria: string[];
    testCases: string[];
    metrics: string[];
    rollbackPlan: string;
  };
  confidence: number;
  learningNotes: string[];
}

export class AdvancedReasoningSkill {
  
  private solutionHistory: Map<string, ReasoningSolution[]> = new Map();
  private reasoningPatterns: Map<string, any> = new Map();
  
  constructor() {
    this.initializeReasoningPatterns();
  }

  private initializeReasoningPatterns(): void {
    // Common reasoning patterns for software engineering
    this.reasoningPatterns.set('divide-and-conquer', {
      description: 'Break complex problems into smaller, manageable parts',
      applicability: ['high-complexity', 'architecture', 'debugging'],
      effectiveness: 0.85
    });
    
    this.reasoningPatterns.set('root-cause-analysis', {
      description: 'Identify underlying causes rather than symptoms',
      applicability: ['debugging', 'performance', 'security'],
      effectiveness: 0.90
    });
    
    this.reasoningPatterns.set('proof-of-concept', {
      description: 'Validate approach with minimal implementation',
      applicability: ['architecture', 'integration', 'design'],
      effectiveness: 0.75
    });
    
    this.reasoningPatterns.set('analogical-reasoning', {
      description: 'Apply solutions from similar domains or problems',
      applicability: ['design', 'architecture', 'creative'],
      effectiveness: 0.70
    });
  }

  async solveProblem(problemContext: ProblemContext): Promise<ReasoningSolution> {
    const solutionId = this.generateSolutionId(problemContext);
    
    // Analyze problem context
    const analysis = this.analyzeProblemContext(problemContext);
    
    // Select reasoning approach
    const reasoningType = this.selectReasoningType(problemContext, analysis);
    
    // Generate reasoning steps
    const reasoningSteps = await this.generateReasoningSteps(problemContext, reasoningType);
    
    // Generate alternatives
    const alternatives = this.generateAlternatives(problemContext, reasoningSteps);
    
    // Create implementation plan
    const implementation = this.createImplementationPlan(problemContext, reasoningSteps);
    
    // Define validation strategy
    const validation = this.defineValidationStrategy(problemContext, implementation);
    
    // Calculate confidence
    const confidence = this.calculateSolutionConfidence(reasoningSteps, alternatives, implementation);
    
    // Generate learning notes
    const learningNotes = this.generateLearningNotes(problemContext, reasoningSteps, alternatives);
    
    const solution: ReasoningSolution = {
      id: solutionId,
      approach: this.describeSolutionApproach(reasoningSteps),
      reasoning: {
        type: reasoningType,
        steps: reasoningSteps,
        conclusion: this.generateConclusion(reasoningSteps, problemContext),
        alternatives
      },
      implementation,
      validation,
      confidence,
      learningNotes
    };
    
    // Store solution for future reference
    this.storeSolution(problemContext.domain, solution);
    
    return solution;
  }

  private generateSolutionId(context: ProblemContext): string {
    return `${context.domain}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private analyzeProblemContext(context: ProblemContext): any {
    const complexity = context.complexity;
    const domain = context.domain;
    const constraintCount = context.constraints.length;
    const goalCount = context.goals.length;
    
    return {
      complexity,
      domain,
      constraintCount,
      goalCount,
      hasExistingSolution: !!context.currentSolution,
      timeConstraint: context.context?.timeline ? this.parseTimeConstraint(context.context.timeline) : null,
      technologyStack: context.context?.technology || [],
      resourceAvailability: context.context?.resources || []
    };
  }

  private selectReasoningType(context: ProblemContext, analysis: any): 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'creative' {
    // Deductive reasoning for well-defined problems with clear rules
    if (context.domain === 'debugging' || context.domain === 'security') {
      return 'deductive';
    }
    
    // Inductive reasoning for patterns and generalizations
    if (context.domain === 'performance' || context.complexity === 'high') {
      return 'inductive';
    }
    
    // Abductive reasoning for best explanations
    if (analysis.hasExistingSolution && context.complexity === 'expert') {
      return 'abductive';
    }
    
    // Analogical reasoning for design and architecture
    if (context.domain === 'architecture' || context.domain === 'design') {
      return 'analogical';
    }
    
    // Creative reasoning for novel problems
    return 'creative';
  }

  private async generateReasoningSteps(context: ProblemContext, reasoningType: string): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];
    
    switch (reasoningType) {
      case 'deductive':
        steps.push(...this.generateDeductiveSteps(context));
        break;
      case 'inductive':
        steps.push(...this.generateInductiveSteps(context));
        break;
      case 'abductive':
        steps.push(...this.generateAbductiveSteps(context));
        break;
      case 'analogical':
        steps.push(...this.generateAnalogicalSteps(context));
        break;
      case 'creative':
        steps.push(...this.generateCreativeSteps(context));
        break;
    }
    
    return steps;
  }

  private generateDeductiveSteps(context: ProblemContext): ReasoningStep[] {
    return [
      {
        step: 1,
        description: "Identify known facts and constraints",
        reasoning: `Analyzing constraints: ${context.constraints.join(', ')}`,
        confidence: 0.95
      },
      {
        step: 2,
        description: "Apply domain-specific rules and principles",
        reasoning: `Applying ${context.domain} domain rules to problem space`,
        confidence: 0.90
      },
      {
        step: 3,
        description: "Derive logical conclusions",
        reasoning: "Following logical inference to reach solution",
        confidence: 0.85
      },
      {
        step: 4,
        description: "Validate against requirements",
        reasoning: `Ensuring solution meets goals: ${context.goals.join(', ')}`,
        confidence: 0.80
      }
    ];
  }

  private generateInductiveSteps(context: ProblemContext): ReasoningStep[] {
    return [
      {
        step: 1,
        description: "Analyze similar problems and patterns",
        reasoning: "Identifying patterns from previous solutions in this domain",
        confidence: 0.80
      },
      {
        step: 2,
        description: "Extract general principles",
        reasoning: "Deriving general rules from specific cases",
        confidence: 0.75
      },
      {
        step: 3,
        description: "Apply generalized solution",
        reasoning: "Adapting general principles to current problem",
        confidence: 0.85
      },
      {
        step: 4,
        description: "Test and refine approach",
        reasoning: "Iterating based on feedback and results",
        confidence: 0.90
      }
    ];
  }

  private generateAbductiveSteps(context: ProblemContext): ReasoningStep[] {
    return [
      {
        step: 1,
        description: "Analyze symptoms and observations",
        reasoning: "Understanding what we observe and why",
        confidence: 0.70
      },
      {
        step: 2,
        description: "Generate possible explanations",
        reasoning: "Creating hypotheses that could explain observations",
        confidence: 0.75
      },
      {
        step: 3,
        description: "Evaluate explanation plausibility",
        reasoning: "Ranking explanations by likelihood and evidence",
        confidence: 0.80
      },
      {
        step: 4,
        description: "Select best explanation as solution basis",
        reasoning: "Choosing most plausible explanation to guide solution",
        confidence: 0.85
      }
    ];
  }

  private generateAnalogicalSteps(context: ProblemContext): ReasoningStep[] {
    return [
      {
        step: 1,
        description: "Identify similar problems or domains",
        reasoning: "Finding analogous situations from other domains",
        confidence: 0.75
      },
      {
        step: 2,
        description: "Map structural similarities",
        reasoning: "Understanding how problem structures align",
        confidence: 0.70
      },
      {
        step: 3,
        description: "Adapt solution from analogy",
        reasoning: "Translating analogous solution to current context",
        confidence: 0.80
      },
      {
        step: 4,
        description: "Validate analogy appropriateness",
        reasoning: "Ensuring analogous solution fits current constraints",
        confidence: 0.85
      }
    ];
  }

  private generateCreativeSteps(context: ProblemContext): ReasoningStep[] {
    return [
      {
        step: 1,
        description: "Explore unconventional approaches",
        reasoning: "Thinking outside traditional solution spaces",
        confidence: 0.60
      },
      {
        step: 2,
        description: "Combine existing concepts creatively",
        reasoning: "Merging ideas from different domains or approaches",
        confidence: 0.65
      },
      {
        step: 3,
        description: "Generate novel solution concepts",
        reasoning: "Creating new approaches based on creative combinations",
        confidence: 0.70
      },
      {
        step: 4,
        description: "Prototype and validate creativity",
        reasoning: "Testing creative concepts for feasibility",
        confidence: 0.75
      }
    ];
  }

  private generateAlternatives(context: ProblemContext, steps: ReasoningStep[]): Alternative[] {
    const alternatives: Alternative[] = [];
    
    // Conservative approach
    alternatives.push({
      approach: "Conservative Solution",
      pros: ["Low risk", "Proven patterns", "Easy to implement"],
      cons: ["May not be optimal", "Limited innovation", "Could be over-engineered"],
      feasibility: 0.90
    });
    
    // Aggressive/Innovative approach
    alternatives.push({
      approach: "Innovative Solution",
      pros: ["Cutting-edge technology", "High performance potential", "Future-proof"],
      cons: ["Higher risk", "Learning curve", "Unknown edge cases"],
      feasibility: 0.65
    });
    
    // Hybrid approach
    alternatives.push({
      approach: "Hybrid Solution",
      pros: ["Balanced risk/reward", "Combines best practices", "Incremental adoption"],
      cons: ["Complexity of integration", "Potential compromise", "Requires careful coordination"],
      feasibility: 0.75
    });
    
    return alternatives;
  }

  private createImplementationPlan(context: ProblemContext, steps: ReasoningStep[]): any {
    const phases: ImplementationPhase[] = [];
    
    // Planning phase
    phases.push({
      phase: "Planning & Analysis",
      tasks: [
        "Detailed requirements analysis",
        "Architecture design",
        "Risk assessment",
        "Resource allocation"
      ],
      estimatedTime: "1-2 weeks",
      dependencies: [],
      risks: ["Incomplete requirements", "Changing scope"]
    });
    
    // Implementation phase
    phases.push({
      phase: "Core Implementation",
      tasks: [
        "Core functionality development",
        "Integration with existing systems",
        "Unit testing",
        "Code reviews"
      ],
      estimatedTime: "2-4 weeks",
      dependencies: ["Planning & Analysis"],
      risks: ["Technical challenges", "Integration issues", "Performance problems"]
    });
    
    // Testing and validation
    phases.push({
      phase: "Testing & Validation",
      tasks: [
        "Integration testing",
        "Performance testing",
        "Security testing",
        "User acceptance testing"
      ],
      estimatedTime: "1-2 weeks",
      dependencies: ["Core Implementation"],
      risks: ["Test environment issues", "Performance bottlenecks", "Security vulnerabilities"]
    });
    
    // Deployment
    phases.push({
      phase: "Deployment & Monitoring",
      tasks: [
        "Production deployment",
        "Monitoring setup",
        "Documentation",
        "Training"
      ],
      estimatedTime: "1 week",
      dependencies: ["Testing & Validation"],
      risks: ["Deployment issues", "Production environment differences", "User adoption"]
    });
    
    return {
      phases,
      codeExamples: this.generateCodeExamples(context),
      architecturalChanges: this.identifyArchitecturalChanges(context),
      testingStrategy: this.defineTestingStrategy(context)
    };
  }

  private defineValidationStrategy(context: ProblemContext, implementation: any): any {
    return {
      successCriteria: [
        `Meets all specified goals: ${context.goals.join(', ')}`,
        "Operates within defined constraints",
        "Passes all test cases",
        "Achieves performance benchmarks",
        "Maintains system stability"
      ],
      testCases: [
        "Happy path scenarios",
        "Edge cases and boundary conditions",
        "Error handling scenarios",
        "Performance under load",
        "Security vulnerability tests"
      ],
      metrics: [
        "Functional correctness (100%)",
        "Performance benchmarks",
        "Code coverage (>90%)",
        "Security score",
        "Maintainability index"
      ],
      rollbackPlan: "Maintain previous version; automated rollback on critical failures; gradual rollout with canary deployment"
    };
  }

  private calculateSolutionConfidence(steps: ReasoningStep[], alternatives: Alternative[], implementation: any): number {
    const avgStepConfidence = steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length;
    const implementationComplexity = implementation.phases.length / 10; // Normalized complexity
    const alternativesFeasibility = alternatives.reduce((sum, alt) => sum + alt.feasibility, 0) / alternatives.length;
    
    return Math.round((avgStepConfidence * 0.5 + alternativesFeasibility * 0.3 + (1 - implementationComplexity) * 0.2) * 100) / 100;
  }

  private generateLearningNotes(context: ProblemContext, steps: ReasoningStep[], alternatives: Alternative[]): string[] {
    return [
      `${context.domain} domain problem with ${context.complexity} complexity`,
      `Used reasoning approach with ${steps.length} steps`,
      `Considered ${alternatives.length} alternative approaches`,
      `Key constraints: ${context.constraints.slice(0, 3).join(', ')}`,
      `Primary goals: ${context.goals.slice(0, 3).join(', ')}`
    ];
  }

  private generateConclusion(steps: ReasoningStep[], context: ProblemContext): string {
    const primaryApproach = steps[steps.length - 1].description;
    return `Based on ${steps.length}-step reasoning process, the recommended solution focuses on ${primaryApproach} while addressing the core ${context.domain} challenges within the specified constraints.`;
  }

  private describeSolutionApproach(steps: ReasoningStep[]): string {
    return `Multi-step ${steps[0].reasoning.includes('pattern') ? 'pattern-based' : 'analytical'} approach with ${steps.length} reasoning phases`;
  }

  private storeSolution(domain: string, solution: ReasoningSolution): void {
    if (!this.solutionHistory.has(domain)) {
      this.solutionHistory.set(domain, []);
    }
    this.solutionHistory.get(domain)!.push(solution);
    
    // Keep only last 10 solutions per domain
    const solutions = this.solutionHistory.get(domain)!;
    if (solutions.length > 10) {
      solutions.shift();
    }
  }

  private parseTimeConstraint(timeline: string): string | null {
    // Simple parsing for common time expressions
    if (timeline.includes('urgent') || timeline.includes('ASAP')) return 'urgent';
    if (timeline.includes('week')) return 'weeks';
    if (timeline.includes('month')) return 'months';
    return timeline;
  }

  private generateCodeExamples(context: ProblemContext): string[] {
    const examples: string[] = [];
    
    switch (context.domain) {
      case 'architecture':
        examples.push(`
// Example: Modular architecture pattern
class ServiceRegistry {
  private services = new Map();
  
  register(name: string, service: any) {
    this.services.set(name, service);
  }
  
  get<T>(name: string): T {
    return this.services.get(name);
  }
}`);
        break;
        
      case 'performance':
        examples.push(`
// Example: Performance optimization with caching
class CacheManager {
  private cache = new Map();
  
  async get(key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = await this.fetchData(key);
    this.cache.set(key, value);
    return value;
  }
}`);
        break;
    }
    
    return examples;
  }

  private identifyArchitecturalChanges(context: ProblemContext): string[] {
    const changes: string[] = [];
    
    if (context.domain === 'scalability') {
      changes.push("Implement horizontal scaling capabilities");
      changes.push("Add load balancing layer");
      changes.push("Design for microservices architecture");
    }
    
    if (context.domain === 'security') {
      changes.push("Add authentication and authorization layers");
      changes.push("Implement input validation and sanitization");
      changes.push("Add audit logging and monitoring");
    }
    
    return changes;
  }

  private defineTestingStrategy(context: ProblemContext): string {
    return `Comprehensive testing strategy including unit tests (90%+ coverage), integration tests, ${context.domain}-specific tests, and automated regression testing with CI/CD pipeline integration.`;
  }

  // Public method to get reasoning history for learning
  getReasoningHistory(domain?: string): ReasoningSolution[] {
    if (domain && this.solutionHistory.has(domain)) {
      return [...this.solutionHistory.get(domain)!];
    }
    
    const allSolutions: ReasoningSolution[] = [];
    this.solutionHistory.forEach(solutions => {
      allSolutions.push(...solutions);
    });
    
    return allSolutions;
  }
}

export const advancedReasoningSkill = new AdvancedReasoningSkill();