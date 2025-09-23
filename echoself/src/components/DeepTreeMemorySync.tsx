import React, { useEffect, useState } from "react";
import {
  useDeepTreeMemories,
  useMemorySyncStatus,
  useTemporalMemoryState,
} from "../hooks/useDeepTreeMemories";
import { TemporalState } from "../services/memorySyncService";

interface DeepTreeMemorySyncProps {
  userId: string;
}

export const DeepTreeMemorySync: React.FC<DeepTreeMemorySyncProps> = ({ userId }) => {
  const [selectedMemoryTypes, setSelectedMemoryTypes] = useState<
    Array<"semantic" | "episodic" | "wisdom" | "working">
  >(["semantic", "episodic", "wisdom", "working"]);
  
  const [state, actions] = useDeepTreeMemories({
    userId,
    autoSync: false,
    memoryTypes: selectedMemoryTypes,
  });

  const { isSyncing, lastSync, syncStatus, performSync } = useMemorySyncStatus(userId);
  const { updateState, getMemoriesByState } = useTemporalMemoryState(userId);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  // Handle memory search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await actions.searchMemories(searchQuery, selectedMemoryTypes);
      setSearchResults(results);
    }
  };

  // Handle temporal state update
  const handleTemporalStateUpdate = async (memoryId: string, newState: TemporalState) => {
    await updateState(memoryId, newState);
    await actions.refreshMemories();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Deep Tree Echo Memory Synchronization
        </h2>
        
        {/* Sync Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-600 mb-2">Last Sync</h3>
            <p className="text-lg font-medium text-gray-800">{formatDate(lastSync)}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-600 mb-2">Total Synced</h3>
            <p className="text-lg font-medium text-gray-800">{syncStatus.totalSynced}</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-600 mb-2">Pending</h3>
            <p className="text-lg font-medium text-gray-800">
              PG: {syncStatus.pendingPostgres} | SB: {syncStatus.pendingSupabase}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">Error: {state.error}</p>
          </div>
        )}

        {/* Memory Type Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Memory Types</h3>
          <div className="flex flex-wrap gap-3">
            {(["semantic", "episodic", "wisdom", "working"] as const).map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMemoryTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMemoryTypes([...selectedMemoryTypes, type]);
                    } else {
                      setSelectedMemoryTypes(selectedMemoryTypes.filter(t => t !== type));
                    }
                  }}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={actions.syncFromPostgres}
            disabled={isSyncing || state.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? "Syncing..." : "Sync from PostgreSQL"}
          </button>
          
          <button
            onClick={actions.syncFromSupabase}
            disabled={isSyncing || state.isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? "Syncing..." : "Sync from Supabase"}
          </button>
          
          <button
            onClick={performSync}
            disabled={isSyncing || state.isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? "Syncing..." : "Bidirectional Sync"}
          </button>
          
          <button
            onClick={actions.refreshMemories}
            disabled={state.isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Search Memories</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search across Deep Tree Echo memories..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Search Results</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {result.type}
                    </span>
                    {result.temporal_state && (
                      <select
                        value={result.temporal_state}
                        onChange={(e) => handleTemporalStateUpdate(result.id, e.target.value as TemporalState)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        {Object.values(TemporalState).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-gray-700">{result.content}</p>
                  {result.metadata && (
                    <div className="mt-2 text-sm text-gray-500">
                      <details>
                        <summary className="cursor-pointer">Metadata</summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Statistics */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">Memory Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(state.memories).map(([type, memories]) => (
              <div key={type} className="text-center">
                <p className="text-2xl font-bold text-gray-800">{memories.length}</p>
                <p className="text-sm text-gray-600 capitalize">{type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Temporal State Distribution */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Temporal Processing States</h3>
          <div className="space-y-2">
            {Object.values(TemporalState).map(state => {
              const memories = getMemoriesByState(state);
              return (
                <div key={state} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{state.replace(/_/g, " ").toUpperCase()}</span>
                  <span className="text-sm text-gray-600">{memories.length} memories</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};