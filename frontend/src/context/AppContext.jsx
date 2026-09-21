import React, { createContext, useContext, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_USER_ID_KEY } from '../utils/constants';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [userId] = useLocalStorage(
    LOCAL_STORAGE_USER_ID_KEY,
    () => crypto.randomUUID()
  );

  const [selectedRequirementId, setSelectedRequirementId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        userId,
        selectedRequirementId,
        setSelectedRequirementId,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
