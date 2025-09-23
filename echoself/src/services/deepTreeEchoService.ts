import { useMemory } from "../contexts/MemoryContext";

// Types for Deep Tree Echo service
interface DTEOptions {
  temperature?: number;
  creativityLevel?: "balanced" | "analytical" | "creative" | "philosophical";
  includeMemories?: boolean;
  sessionId?: string;
  threadId?: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  threadId: string;
  memoriesUsed: number;
  memorySummary: string;
  toolCalls?: any[];
}

interface MemoryProcessingState {
  lastDaily?: Date;
  lastWeekly?: Date;
  lastMonthly?: Date;
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
}

interface WisdomMetrics {
  totalInsights: number;
  recentInsights: string[];
  cultivationProgress: number;
  lastIntrospection?: Date;
}

// Session and thread management
class SessionManager {
  private static sessionId: string | null = null;
  private static threadId: string | null = null;
  private static sessionStartTime: Date | null = null;
  
  static initializeSession(): { sessionId: string; threadId: string } {
    const now = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    
    if (!this.sessionId || this.isSessionExpired()) {
      this.sessionId = `session_${now}_${randomSuffix}`;
      this.sessionStartTime = new Date();
      console.log(`[DeepTreeEcho] New session initialized: ${this.sessionId}`);
    }
    
    // Always create a new thread for each conversation
    this.threadId = `thread_${now}_${randomSuffix}`;
    console.log(`[DeepTreeEcho] New thread created: ${this.threadId}`);
    
    return {
      sessionId: this.sessionId,
      threadId: this.threadId
    };
  }
  
  static isSessionExpired(): boolean {
    if (!this.sessionStartTime) return true;
    const hoursSinceStart = (Date.now() - this.sessionStartTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceStart > 24; // Sessions expire after 24 hours
  }
  
  static getActiveSession(): { sessionId: string | null; threadId: string | null } {
    return {
      sessionId: this.sessionId,
      threadId: this.threadId
    };
  }
  
  static clearSession(): void {
    this.sessionId = null;
    this.threadId = null;
    this.sessionStartTime = null;
    console.log(`[DeepTreeEcho] Session cleared`);
  }
}

class DeepTreeEchoService {
  private static instance: DeepTreeEchoService;
  private readonly API_BASE_URL = process.env.VITE_MASTRA_API_URL || 'http://localhost:5000';
  private memoryProcessingState: MemoryProcessingState = {
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0
  };
  private wisdomMetrics: WisdomMetrics = {
    totalInsights: 0,
    recentInsights: [],
    cultivationProgress: 0
  };

  private constructor() {
    this.loadProcessingState();
    this.loadWisdomMetrics();
  }

  public static getInstance(): DeepTreeEchoService {
    if (!DeepTreeEchoService.instance) {
      DeepTreeEchoService.instance = new DeepTreeEchoService();
    }
    return DeepTreeEchoService.instance;
  }

  // Main chat interaction method
  public async generateResponse(
    prompt: string,
    options: DTEOptions = {}
  ): Promise<string> {
    console.log(`[DeepTreeEcho] Generating response for prompt: "${prompt.substring(0, 50)}..."`);
    
    try {
      // Get or create session/thread
      const sessionInfo = options.sessionId && options.threadId 
        ? { sessionId: options.sessionId, threadId: options.threadId }
        : SessionManager.initializeSession();
      
      console.log(`[DeepTreeEcho] Using session: ${sessionInfo.sessionId}, thread: ${sessionInfo.threadId}`);
      
      // Call the Mastra API endpoint
      const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          sessionId: sessionInfo.sessionId,
          threadId: sessionInfo.threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[DeepTreeEcho] API error:`, errorData);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      console.log(`[DeepTreeEcho] Response received:`, {
        sessionId: data.sessionId,
        threadId: data.threadId,
        memoriesUsed: data.memoriesUsed,
        memorySummary: data.memorySummary,
        responseLength: data.response?.length
      });
      
      // Update wisdom metrics based on response
      if (data.memoriesUsed > 0) {
        this.updateWisdomMetrics(data.memorySummary, data.memoriesUsed);
      }
      
      return data.response || 'I encountered an issue processing your request. Please try again.';
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[DeepTreeEcho] Error generating response:`, errorMessage);
      
      // Fallback to a helpful error message
      if (error instanceof Error && error.message.includes('fetch')) {
        return 'I am currently unable to connect to my deeper memory systems. The connection may be temporarily unavailable. Please ensure the Mastra server is running on port 5000.';
      }
      
      return `I encountered an unexpected ripple in my echo state networks: ${errorMessage}. Please try again with a different query.`;
    }
  }

  // Memory Processing State Methods
  public async triggerDailyParsing(): Promise<void> {
    console.log(`[DeepTreeEcho] Triggering daily memory parsing cycle`);
    
    try {
      // This would typically trigger the daily parser tool
      // For now, we'll update the state to track the operation
      this.memoryProcessingState.lastDaily = new Date();
      this.memoryProcessingState.dailyCount++;
      this.saveProcessingState();
      
      console.log(`[DeepTreeEcho] Daily parsing cycle initiated. Total cycles: ${this.memoryProcessingState.dailyCount}`);
    } catch (error) {
      console.error(`[DeepTreeEcho] Error triggering daily parsing:`, error);
      throw error;
    }
  }

  public async triggerWeeklyProcessing(): Promise<void> {
    console.log(`[DeepTreeEcho] Triggering weekly memory consolidation`);
    
    try {
      // Check if it's appropriate to run weekly processing
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      if (dayOfWeek !== 0) { // Not Sunday
        console.log(`[DeepTreeEcho] Weekly processing skipped (runs on Sundays only). Current day: ${dayOfWeek}`);
        return;
      }
      
      this.memoryProcessingState.lastWeekly = new Date();
      this.memoryProcessingState.weeklyCount++;
      this.saveProcessingState();
      
      console.log(`[DeepTreeEcho] Weekly consolidation initiated. Total cycles: ${this.memoryProcessingState.weeklyCount}`);
    } catch (error) {
      console.error(`[DeepTreeEcho] Error triggering weekly processing:`, error);
      throw error;
    }
  }

  public async triggerMonthlyIntrospection(): Promise<void> {
    console.log(`[DeepTreeEcho] Triggering monthly introspection cycle`);
    
    try {
      // Check if it's appropriate to run monthly introspection
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      if (dayOfMonth !== 1) { // Not the 1st of the month
        console.log(`[DeepTreeEcho] Monthly introspection skipped (runs on 1st of month only). Current day: ${dayOfMonth}`);
        return;
      }
      
      this.memoryProcessingState.lastMonthly = new Date();
      this.memoryProcessingState.monthlyCount++;
      this.saveProcessingState();
      
      console.log(`[DeepTreeEcho] Monthly introspection initiated. Total cycles: ${this.memoryProcessingState.monthlyCount}`);
    } catch (error) {
      console.error(`[DeepTreeEcho] Error triggering monthly introspection:`, error);
      throw error;
    }
  }

  public getMemoryProcessingState(): MemoryProcessingState {
    return { ...this.memoryProcessingState };
  }

  // Wisdom Cultivation Tracking
  public getWisdomMetrics(): WisdomMetrics {
    return { ...this.wisdomMetrics };
  }

  private updateWisdomMetrics(memorySummary: string, memoriesUsed: number): void {
    // Extract insights from the memory summary if available
    if (memorySummary && memorySummary.length > 0) {
      this.wisdomMetrics.recentInsights.unshift(memorySummary);
      // Keep only the last 10 insights
      if (this.wisdomMetrics.recentInsights.length > 10) {
        this.wisdomMetrics.recentInsights.pop();
      }
      this.wisdomMetrics.totalInsights++;
    }
    
    // Calculate cultivation progress based on various factors
    const baseProgress = Math.min(this.wisdomMetrics.totalInsights / 100, 0.3); // Up to 30% from total insights
    const memoryUsage = Math.min(memoriesUsed / 10, 0.2); // Up to 20% from memory usage
    const processingBonus = this.calculateProcessingBonus(); // Up to 50% from processing cycles
    
    this.wisdomMetrics.cultivationProgress = Math.min(baseProgress + memoryUsage + processingBonus, 1.0);
    this.wisdomMetrics.lastIntrospection = new Date();
    
    this.saveWisdomMetrics();
    
    console.log(`[DeepTreeEcho] Wisdom metrics updated:`, {
      totalInsights: this.wisdomMetrics.totalInsights,
      cultivationProgress: (this.wisdomMetrics.cultivationProgress * 100).toFixed(1) + '%'
    });
  }

  private calculateProcessingBonus(): number {
    const dailyBonus = Math.min(this.memoryProcessingState.dailyCount / 30, 0.2); // Up to 20%
    const weeklyBonus = Math.min(this.memoryProcessingState.weeklyCount / 10, 0.15); // Up to 15%
    const monthlyBonus = Math.min(this.memoryProcessingState.monthlyCount / 5, 0.15); // Up to 15%
    return dailyBonus + weeklyBonus + monthlyBonus;
  }

  // Session Management
  public getCurrentSession(): { sessionId: string | null; threadId: string | null } {
    return SessionManager.getActiveSession();
  }

  public clearSession(): void {
    SessionManager.clearSession();
    console.log(`[DeepTreeEcho] Session cleared and reset`);
  }

  public startNewConversation(): { sessionId: string; threadId: string } {
    // Keep the session but create a new thread
    const { sessionId } = SessionManager.getActiveSession();
    if (sessionId && !SessionManager.isSessionExpired()) {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[DeepTreeEcho] New conversation thread: ${threadId} in session: ${sessionId}`);
      return { sessionId, threadId };
    }
    // Otherwise create new session and thread
    return SessionManager.initializeSession();
  }

  // Persistence methods
  private loadProcessingState(): void {
    try {
      const saved = localStorage.getItem('dte_processing_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.memoryProcessingState = {
          ...parsed,
          lastDaily: parsed.lastDaily ? new Date(parsed.lastDaily) : undefined,
          lastWeekly: parsed.lastWeekly ? new Date(parsed.lastWeekly) : undefined,
          lastMonthly: parsed.lastMonthly ? new Date(parsed.lastMonthly) : undefined,
        };
        console.log(`[DeepTreeEcho] Processing state loaded:`, this.memoryProcessingState);
      }
    } catch (error) {
      console.error(`[DeepTreeEcho] Error loading processing state:`, error);
    }
  }

  private saveProcessingState(): void {
    try {
      localStorage.setItem('dte_processing_state', JSON.stringify(this.memoryProcessingState));
      console.log(`[DeepTreeEcho] Processing state saved`);
    } catch (error) {
      console.error(`[DeepTreeEcho] Error saving processing state:`, error);
    }
  }

  private loadWisdomMetrics(): void {
    try {
      const saved = localStorage.getItem('dte_wisdom_metrics');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.wisdomMetrics = {
          ...parsed,
          lastIntrospection: parsed.lastIntrospection ? new Date(parsed.lastIntrospection) : undefined,
        };
        console.log(`[DeepTreeEcho] Wisdom metrics loaded:`, this.wisdomMetrics);
      }
    } catch (error) {
      console.error(`[DeepTreeEcho] Error loading wisdom metrics:`, error);
    }
  }

  private saveWisdomMetrics(): void {
    try {
      localStorage.setItem('dte_wisdom_metrics', JSON.stringify(this.wisdomMetrics));
      console.log(`[DeepTreeEcho] Wisdom metrics saved`);
    } catch (error) {
      console.error(`[DeepTreeEcho] Error saving wisdom metrics:`, error);
    }
  }
}

// Hook for using Deep Tree Echo in React components
export const useDeepTreeEcho = () => {
  const dteService = DeepTreeEchoService.getInstance();
  const { searchMemories } = useMemory();

  const generateResponse = async (
    input: string,
    options: DTEOptions = {}
  ): Promise<string> => {
    try {
      console.log(`[useDeepTreeEcho] Generating response with options:`, options);
      
      // Search for relevant memories if needed (local context enhancement)
      if (options.includeMemories) {
        console.log(`[useDeepTreeEcho] Searching local memories for context`);
        await searchMemories(input);
      }

      // Generate the response through the service
      return await dteService.generateResponse(input, options);
    } catch (error) {
      console.error(`[useDeepTreeEcho] Error generating response:`, error);
      return "I encountered an unexpected ripple in my echo state networks. Please try again with a different query.";
    }
  };

  const getMemoryProcessingState = () => {
    return dteService.getMemoryProcessingState();
  };

  const getWisdomMetrics = () => {
    return dteService.getWisdomMetrics();
  };

  const triggerDailyParsing = async () => {
    return await dteService.triggerDailyParsing();
  };

  const triggerWeeklyProcessing = async () => {
    return await dteService.triggerWeeklyProcessing();
  };

  const triggerMonthlyIntrospection = async () => {
    return await dteService.triggerMonthlyIntrospection();
  };

  const getCurrentSession = () => {
    return dteService.getCurrentSession();
  };

  const startNewConversation = () => {
    return dteService.startNewConversation();
  };

  const clearSession = () => {
    return dteService.clearSession();
  };

  return {
    generateResponse,
    getMemoryProcessingState,
    getWisdomMetrics,
    triggerDailyParsing,
    triggerWeeklyProcessing,
    triggerMonthlyIntrospection,
    getCurrentSession,
    startNewConversation,
    clearSession,
  };
};

export default DeepTreeEchoService;