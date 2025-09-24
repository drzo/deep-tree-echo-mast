import { z } from "zod";

/**
 * Code Analysis Skill - Cognitive Code Intelligence
 * Adapted from ai-opencog's CodeAnalysisAgent
 * 
 * Provides intelligent code analysis with pattern recognition,
 * quality metrics, and cognitive reasoning capabilities.
 */

export const codeAnalysisSchema = z.object({
  code: z.string().describe("The code to analyze"),
  language: z.string().optional().describe("Programming language (auto-detected if not provided)"),
  context: z.object({
    filename: z.string().optional(),
    project: z.string().optional(),
    framework: z.string().optional()
  }).optional().describe("Context information for better analysis")
});

export type CodeAnalysisInput = z.infer<typeof codeAnalysisSchema>;

export interface QualityMetrics {
  score: number;
  complexity: number;
  maintainability: number;
  performance: number;
}

export interface CodeIssue {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface PatternRecognition {
  name: string;
  confidence: number;
  description: string;
  category: 'design-pattern' | 'anti-pattern' | 'best-practice' | 'code-smell';
}

export interface CodeAnalysisResult {
  qualityMetrics: QualityMetrics;
  issues: CodeIssue[];
  patterns: PatternRecognition[];
  recommendations: string[];
  cognitiveInsights: {
    complexity: string;
    readability: string;
    maintainability: string;
    suggestions: string[];
  };
}

export class CodeAnalysisSkill {
  
  async analyzeCode(input: CodeAnalysisInput): Promise<CodeAnalysisResult> {
    const { code, language, context } = input;
    const detectedLanguage = language || this.detectLanguage(context?.filename || '');
    
    // Analyze code patterns
    const patterns = await this.recognizePatterns(code, detectedLanguage);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(code, patterns);
    
    // Detect issues
    const issues = this.detectIssues(code, patterns, detectedLanguage);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(code, patterns, issues);
    
    // Generate cognitive insights
    const cognitiveInsights = this.generateCognitiveInsights(code, patterns, qualityMetrics);
    
    return {
      qualityMetrics,
      issues,
      patterns,
      recommendations,
      cognitiveInsights
    };
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby'
    };
    
    return languageMap[ext] || 'javascript';
  }

  private async recognizePatterns(code: string, language: string): Promise<PatternRecognition[]> {
    const patterns: PatternRecognition[] = [];
    
    // Design Pattern Recognition
    if (this.hasObserverPattern(code)) {
      patterns.push({
        name: 'Observer Pattern',
        confidence: 0.92,
        description: 'Event-driven pattern detected in component architecture',
        category: 'design-pattern'
      });
    }
    
    if (this.hasFactoryPattern(code)) {
      patterns.push({
        name: 'Factory Pattern', 
        confidence: 0.78,
        description: 'Object creation pattern used for service instantiation',
        category: 'design-pattern'
      });
    }
    
    if (this.hasSingletonPattern(code)) {
      patterns.push({
        name: 'Singleton Pattern',
        confidence: 0.85,
        description: 'Single instance pattern detected',
        category: 'design-pattern'
      });
    }
    
    // Anti-pattern Detection
    if (this.hasGodObjectAntiPattern(code)) {
      patterns.push({
        name: 'God Object',
        confidence: 0.75,
        description: 'Class with too many responsibilities detected',
        category: 'anti-pattern'
      });
    }
    
    // Language-specific patterns
    if (language === 'typescript' || language === 'javascript') {
      patterns.push(...this.recognizeJavaScriptPatterns(code));
    }
    
    return patterns;
  }

  private recognizeJavaScriptPatterns(code: string): PatternRecognition[] {
    const patterns: PatternRecognition[] = [];
    
    // React Hooks
    if (code.includes('useState') || code.includes('useEffect')) {
      patterns.push({
        name: 'React Hooks',
        confidence: 0.95,
        description: 'React functional component patterns detected',
        category: 'best-practice'
      });
    }
    
    // Async/Await
    if (code.includes('async') && code.includes('await')) {
      patterns.push({
        name: 'Async/Await Pattern',
        confidence: 0.9,
        description: 'Modern asynchronous JavaScript pattern',
        category: 'best-practice'
      });
    }
    
    // Promise chains
    if (code.includes('.then(') && code.includes('.catch(')) {
      patterns.push({
        name: 'Promise Chain',
        confidence: 0.8,
        description: 'Promise-based asynchronous handling',
        category: 'best-practice'
      });
    }
    
    return patterns;
  }

  private calculateQualityMetrics(code: string, patterns: PatternRecognition[]): QualityMetrics {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Complexity calculation based on cyclomatic complexity approximation
    const complexityIndicators = [
      /if\s*\(/g, /else/g, /while\s*\(/g, /for\s*\(/g, 
      /switch\s*\(/g, /case\s/g, /catch\s*\(/g, /&&/g, /\|\|/g
    ];
    
    let complexity = 1; // Base complexity
    complexityIndicators.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    const normalizedComplexity = Math.min(complexity / nonEmptyLines.length, 1);
    
    // Calculate other metrics
    const maintainability = this.calculateMaintainability(code, patterns);
    const performance = this.calculatePerformanceScore(code, patterns);
    
    const overallScore = (1 - normalizedComplexity) * 0.3 + maintainability * 0.4 + performance * 0.3;
    
    return {
      score: Math.round(overallScore * 100) / 100,
      complexity: Math.round(normalizedComplexity * 100) / 100,
      maintainability: Math.round(maintainability * 100) / 100,
      performance: Math.round(performance * 100) / 100
    };
  }

  private calculateMaintainability(code: string, patterns: PatternRecognition[]): number {
    let score = 0.7; // Base score
    
    // Boost for good patterns
    patterns.forEach(pattern => {
      if (pattern.category === 'best-practice' || pattern.category === 'design-pattern') {
        score += 0.1 * pattern.confidence;
      } else if (pattern.category === 'anti-pattern' || pattern.category === 'code-smell') {
        score -= 0.15 * pattern.confidence;
      }
    });
    
    // Comments boost maintainability
    const commentLines = code.split('\n').filter(line => 
      line.trim().startsWith('//') || line.trim().startsWith('/*')
    ).length;
    const totalLines = code.split('\n').length;
    const commentRatio = commentLines / totalLines;
    score += commentRatio * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  private calculatePerformanceScore(code: string, patterns: PatternRecognition[]): number {
    let score = 0.75; // Base score
    
    // Performance anti-patterns
    const performanceIssues = [
      /\.innerHTML\s*=/g, // DOM manipulation
      /for\s*\(\s*var\s+\w+\s*=\s*0.*\.length/g, // Non-cached length in loops
      /setTimeout\s*\(\s*\w+\s*,\s*0\s*\)/g, // setTimeout(0) usage
    ];
    
    performanceIssues.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        score -= matches.length * 0.1;
      }
    });
    
    // Performance good practices
    if (code.includes('requestAnimationFrame')) {
      score += 0.1;
    }
    if (code.includes('useMemo') || code.includes('useCallback')) {
      score += 0.15;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private detectIssues(code: string, patterns: PatternRecognition[], language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');
    
    // Detect common issues
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Long lines
      if (line.length > 120) {
        issues.push({
          type: 'line-length',
          severity: 'warning',
          message: 'Line is too long, consider breaking it down',
          line: lineNum,
          suggestion: 'Break long lines for better readability'
        });
      }
      
      // Unused variables (simple detection)
      if (line.includes('var ') || line.includes('let ') || line.includes('const ')) {
        const varMatch = line.match(/(var|let|const)\s+(\w+)/);
        if (varMatch) {
          const varName = varMatch[2];
          const restOfCode = lines.slice(index + 1).join('\n');
          if (!restOfCode.includes(varName)) {
            issues.push({
              type: 'unused-variable',
              severity: 'warning',
              message: `Variable '${varName}' appears to be unused`,
              line: lineNum,
              suggestion: 'Remove unused variables or use them appropriately'
            });
          }
        }
      }
      
      // Potential null reference
      if (line.includes('.') && !line.includes('?.')) {
        const nullRefMatch = line.match(/(\w+)\.(\w+)/);
        if (nullRefMatch && !line.includes('if') && !line.includes('&&')) {
          issues.push({
            type: 'null-reference',
            severity: 'warning',
            message: 'Potential null reference, consider using optional chaining',
            line: lineNum,
            suggestion: `Use optional chaining: ${nullRefMatch[1]}?.${nullRefMatch[2]}`
          });
        }
      }
    });
    
    // Pattern-based issues
    patterns.forEach(pattern => {
      if (pattern.category === 'anti-pattern') {
        issues.push({
          type: 'anti-pattern',
          severity: 'error',
          message: `${pattern.name}: ${pattern.description}`,
          suggestion: 'Consider refactoring to avoid this anti-pattern'
        });
      }
    });
    
    return issues;
  }

  private generateRecommendations(code: string, patterns: PatternRecognition[], issues: CodeIssue[]): string[] {
    const recommendations: string[] = [];
    
    // High-level recommendations based on patterns
    const hasDesignPatterns = patterns.some(p => p.category === 'design-pattern');
    if (!hasDesignPatterns) {
      recommendations.push('Consider implementing appropriate design patterns for better code organization');
    }
    
    const hasAntiPatterns = patterns.some(p => p.category === 'anti-pattern');
    if (hasAntiPatterns) {
      recommendations.push('Refactor code to eliminate anti-patterns and improve maintainability');
    }
    
    // Issue-based recommendations
    const severityCount = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (severityCount.error > 0) {
      recommendations.push('Address critical errors to improve code reliability');
    }
    
    if (severityCount.warning > 3) {
      recommendations.push('Consider addressing warnings for better code quality');
    }
    
    // General recommendations
    if (!code.includes('//') && !code.includes('/*')) {
      recommendations.push('Add comments to improve code documentation');
    }
    
    if (code.includes('console.log')) {
      recommendations.push('Remove or replace console.log statements with proper logging');
    }
    
    return recommendations;
  }

  private generateCognitiveInsights(code: string, patterns: PatternRecognition[], metrics: QualityMetrics): any {
    const complexity = metrics.complexity > 0.7 ? 'high' : metrics.complexity > 0.4 ? 'medium' : 'low';
    const readability = metrics.maintainability > 0.7 ? 'good' : metrics.maintainability > 0.4 ? 'moderate' : 'poor';
    const maintainability = metrics.maintainability > 0.8 ? 'excellent' : metrics.maintainability > 0.6 ? 'good' : 'needs improvement';
    
    const suggestions = [];
    
    if (metrics.complexity > 0.6) {
      suggestions.push('Consider breaking down complex functions into smaller, more focused units');
    }
    
    if (metrics.maintainability < 0.6) {
      suggestions.push('Improve code organization and add more descriptive naming');
    }
    
    if (metrics.performance < 0.6) {
      suggestions.push('Optimize performance-critical sections and consider caching strategies');
    }
    
    const bestPracticePatterns = patterns.filter(p => p.category === 'best-practice').length;
    if (bestPracticePatterns === 0) {
      suggestions.push('Adopt more industry best practices for better code quality');
    }
    
    return {
      complexity,
      readability,
      maintainability,
      suggestions
    };
  }

  // Pattern detection helpers
  private hasObserverPattern(code: string): boolean {
    return (
      (code.includes('addEventListener') || code.includes('on(')) &&
      (code.includes('emit') || code.includes('trigger') || code.includes('dispatch'))
    );
  }

  private hasFactoryPattern(code: string): boolean {
    return (
      code.includes('create') && 
      (code.includes('factory') || code.includes('Factory') || 
       code.match(/create\w+\s*\(/))
    );
  }

  private hasSingletonPattern(code: string): boolean {
    return (
      code.includes('getInstance') ||
      (code.includes('class') && code.includes('static') && code.includes('instance'))
    );
  }

  private hasGodObjectAntiPattern(code: string): boolean {
    const methodCount = (code.match(/function\s+\w+|method\s+\w+|\w+\s*\(/g) || []).length;
    const lineCount = code.split('\n').length;
    return methodCount > 20 || lineCount > 500;
  }
}

export const codeAnalysisSkill = new CodeAnalysisSkill();