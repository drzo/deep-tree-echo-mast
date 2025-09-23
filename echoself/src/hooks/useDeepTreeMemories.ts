import { useState, useEffect, useCallback, useRef } from "react";
import {
  MemorySyncService,
  createMemorySyncService,
  DeepTreeMemory,
  EchoselfMemory,
  TemporalState,
  MEMORY_TYPE_MAPPING,
} from "../services/memorySyncService";

export interface UseDeepTreeMemoriesOptions {
  userId: string;
  autoSync?: boolean;
  syncInterval?: number; // milliseconds
  memoryTypes?: Array<"semantic" | "episodic" | "wisdom" | "working">;
}

export interface DeepTreeMemoriesState {
  memories: {
    semantic: DeepTreeMemory[];
    episodic: DeepTreeMemory[];
    wisdom: DeepTreeMemory[];
    working: DeepTreeMemory[];
  };
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSync: string | null;
  syncStatus: {
    pendingPostgres: number;
    pendingSupabase: number;
    totalSynced: number;
  };
}

export interface DeepTreeMemoriesActions {
  syncFromPostgres: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  performBidirectionalSync: () => Promise<void>;
  searchMemories: (query: string, types?: Array<keyof typeof MEMORY_TYPE_MAPPING>) => Promise<DeepTreeMemory[]>;
  updateTemporalState: (memoryId: string, state: TemporalState) => Promise<void>;
  refreshMemories: () => Promise<void>;
}

export function useDeepTreeMemories(
  options: UseDeepTreeMemoriesOptions
): [DeepTreeMemoriesState, DeepTreeMemoriesActions] {
  const [state, setState] = useState<DeepTreeMemoriesState>({
    memories: {
      semantic: [],
      episodic: [],
      wisdom: [],
      working: [],
    },
    isLoading: false,
    isSyncing: false,
    error: null,
    lastSync: null,
    syncStatus: {
      pendingPostgres: 0,
      pendingSupabase: 0,
      totalSynced: 0,
    },
  });

  const syncServiceRef = useRef<MemorySyncService | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sync service
  useEffect(() => {
    try {
      syncServiceRef.current = createMemorySyncService(options.userId);
      
      // Initial load
      refreshMemories();

      // Set up auto-sync if enabled
      if (options.autoSync && options.syncInterval) {
        syncIntervalRef.current = setInterval(() => {
          performBidirectionalSync();
        }, options.syncInterval);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to initialize memory sync service",
      }));
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (syncServiceRef.current) {
        syncServiceRef.current.cleanup();
      }
    };
  }, [options.userId, options.autoSync, options.syncInterval]);

  // Refresh memories from local storage
  const refreshMemories = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // This would fetch from your local state management or cache
      // For now, we'll just update the sync status
      if (syncServiceRef.current) {
        const status = await syncServiceRef.current.getSyncStatus();
        setState(prev => ({
          ...prev,
          lastSync: status.lastSync,
          syncStatus: {
            pendingPostgres: status.pendingPostgres,
            pendingSupabase: status.pendingSupabase,
            totalSynced: status.totalSynced,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to refresh memories",
        isLoading: false,
      }));
    }
  }, []);

  // Sync from PostgreSQL to Supabase
  const syncFromPostgres = useCallback(async () => {
    if (!syncServiceRef.current) return;

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await syncServiceRef.current.syncFromPostgresToSupabase(
        options.memoryTypes,
        100
      );

      if (!result.success && result.errors.length > 0) {
        throw new Error(result.errors.join("; "));
      }

      await refreshMemories();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date().toISOString(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sync from PostgreSQL failed",
        isSyncing: false,
      }));
    }
  }, [options.memoryTypes, refreshMemories]);

  // Sync from Supabase to PostgreSQL
  const syncFromSupabase = useCallback(async () => {
    if (!syncServiceRef.current) return;

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await syncServiceRef.current.syncFromSupabaseToPostgres(100);

      if (!result.success && result.errors.length > 0) {
        throw new Error(result.errors.join("; "));
      }

      await refreshMemories();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date().toISOString(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sync from Supabase failed",
        isSyncing: false,
      }));
    }
  }, [refreshMemories]);

  // Perform bidirectional sync
  const performBidirectionalSync = useCallback(async () => {
    if (!syncServiceRef.current) return;

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await syncServiceRef.current.performBidirectionalSync({
        memoryTypes: options.memoryTypes,
        postgresLimit: 100,
        supabaseLimit: 100,
      });

      if (!result.success) {
        const errors = [
          ...result.postgresSync.errors,
          ...result.supabaseSync.errors,
        ];
        if (errors.length > 0) {
          throw new Error(errors.join("; "));
        }
      }

      await refreshMemories();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date().toISOString(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Bidirectional sync failed",
        isSyncing: false,
      }));
    }
  }, [options.memoryTypes, refreshMemories]);

  // Search memories
  const searchMemories = useCallback(async (
    query: string,
    types: Array<keyof typeof MEMORY_TYPE_MAPPING> = ["semantic", "episodic", "wisdom", "working"]
  ): Promise<DeepTreeMemory[]> => {
    // This would integrate with the memory query tool
    // For now, returning empty array
    console.log("Searching memories:", query, types);
    return [];
  }, []);

  // Update temporal state
  const updateTemporalState = useCallback(async (
    memoryId: string,
    state: TemporalState
  ) => {
    if (!syncServiceRef.current) return;

    try {
      await syncServiceRef.current.updateTemporalState(memoryId, state, "supabase");
      await refreshMemories();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to update temporal state",
      }));
    }
  }, [refreshMemories]);

  const actions: DeepTreeMemoriesActions = {
    syncFromPostgres,
    syncFromSupabase,
    performBidirectionalSync,
    searchMemories,
    updateTemporalState,
    refreshMemories,
  };

  return [state, actions];
}

// Hook for accessing specific memory type
export function useMemoryType<T extends keyof DeepTreeMemoriesState["memories"]>(
  memoryType: T,
  userId: string,
  autoSync: boolean = false
): {
  memories: DeepTreeMemoriesState["memories"][T];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [state, actions] = useDeepTreeMemories({
    userId,
    autoSync,
    memoryTypes: [memoryType],
  });

  return {
    memories: state.memories[memoryType],
    isLoading: state.isLoading,
    error: state.error,
    refresh: actions.refreshMemories,
  };
}

// Hook for sync status monitoring
export function useMemorySyncStatus(
  userId: string
): {
  isSyncing: boolean;
  lastSync: string | null;
  syncStatus: DeepTreeMemoriesState["syncStatus"];
  performSync: () => Promise<void>;
} {
  const [state, actions] = useDeepTreeMemories({
    userId,
    autoSync: false,
  });

  return {
    isSyncing: state.isSyncing,
    lastSync: state.lastSync,
    syncStatus: state.syncStatus,
    performSync: actions.performBidirectionalSync,
  };
}

// Hook for temporal state management
export function useTemporalMemoryState(
  userId: string
): {
  updateState: (memoryId: string, state: TemporalState) => Promise<void>;
  getMemoriesByState: (state: TemporalState) => DeepTreeMemory[];
} {
  const [memoriesState, actions] = useDeepTreeMemories({
    userId,
    autoSync: false,
  });

  const getMemoriesByState = useCallback((state: TemporalState): DeepTreeMemory[] => {
    const allMemories = [
      ...memoriesState.memories.semantic,
      ...memoriesState.memories.episodic,
      ...memoriesState.memories.wisdom,
      ...memoriesState.memories.working,
    ];

    return allMemories.filter(memory => memory.temporal_state === state);
  }, [memoriesState.memories]);

  return {
    updateState: actions.updateTemporalState,
    getMemoriesByState,
  };
}