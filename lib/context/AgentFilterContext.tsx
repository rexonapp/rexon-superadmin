"use client";

import React, { createContext, useContext, useState } from 'react';

interface AgentFilterContextValue {
  // Agents list status filter
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  // Properties (warehouses) list status filter
  warehouseFilter: string;
  setWarehouseFilter: (s: string) => void;
}

const AgentFilterContext = createContext<AgentFilterContextValue>({
  statusFilter: 'all',
  setStatusFilter: () => {},
  warehouseFilter: 'all',
  setWarehouseFilter: () => {},
});

export function AgentFilterProvider({ children }: { children: React.ReactNode }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  return (
    <AgentFilterContext.Provider value={{ statusFilter, setStatusFilter, warehouseFilter, setWarehouseFilter }}>
      {children}
    </AgentFilterContext.Provider>
  );
}

export function useAgentFilter() {
  return useContext(AgentFilterContext);
}
