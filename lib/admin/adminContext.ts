'use client';
import { createContext, useContext } from 'react';

export interface AdminEditCtx {
  editMode:   boolean;
  saveConfig: (key: string, value: any) => Promise<void>;
  config:     Record<string, any>;
}

export const AdminEditContext = createContext<AdminEditCtx>({
  editMode:   false,
  saveConfig: async () => {},
  config:     {},
});

export const useAdminEdit = () => useContext(AdminEditContext);
