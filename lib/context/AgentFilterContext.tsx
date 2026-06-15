"use client";

import React, { createContext, useContext, useState } from 'react';

interface AgentFilterContextValue {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
}

const AgentFilterContext = createContext<AgentFilterContextValue>({
  statusFilter: 'all',
  setStatusFilter: () => {},
});

export function AgentFilterProvider({ children }: { children: React.ReactNode }) {
  const [statusFilter, setStatusFilter] = useState('all');
  return (
    <AgentFilterContext.Provider value={{ statusFilter, setStatusFilter }}>
      {children}
    </AgentFilterContext.Provider>
  );
}

export function useAgentFilter() {
  return useContext(AgentFilterContext);
}
