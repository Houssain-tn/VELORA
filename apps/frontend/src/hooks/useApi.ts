import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { toast } from '@/components/ui/Toaster';
import { useSocketStore } from '@/stores/useSocketStore';

// Utility to clean up query parameters (removes null, undefined, and NaN)
const cleanParams = (params: any) => {
  if (!params) return params;
  const cleaned = { ...params };
  Object.keys(cleaned).forEach(key => {
    const val = cleaned[key];
    if (val === null || val === undefined || val === 'undefined' || val === 'null' || (typeof val === 'number' && isNaN(val))) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

export const useGlobalSearch = (query: string) => useQuery({
  queryKey: ['search', query],
  queryFn: async () => {
    if (!query || query.length < 2) return [];
    const { data } = await api.get('/search', { params: { q: query } });
    return data;
  },
  enabled: query.length >= 2,
});

// --- SQUADS ---
export const useSquads = () => useQuery({
  queryKey: ['squads'],
  queryFn: async () => {
    const { data } = await api.get('/squads');
    return data;
  },
});

export const useSquad = (id: number | string | undefined) => useQuery({
  queryKey: ['squad', id],
  queryFn: async () => {
    if (!id) return null;
    const { data } = await api.get(`/squads/${id}`);
    return data;
  },
  enabled: !!id,
});

export const useCreateSquad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSquad: any) => api.post('/squads', newSquad),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['squads'] }),
  });
};

export const useUpdateSquad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/squads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads'] });
      queryClient.invalidateQueries({ queryKey: ['squad'] });
    },
  });
};

export const useDeleteSquad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/squads/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['squads'] }),
  });
};

// --- SITES ---
export const useSites = () => useQuery({
  queryKey: ['sites'],
  queryFn: async () => {
    const { data } = await api.get('/sites');
    return data;
  },
  staleTime: 30000, // 30s — sites don't change frequently
});

export const useCreateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSite: any) => api.post('/sites', newSite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/sites/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

// --- CONTRACTS ---
export const useContracts = () => useQuery({
  queryKey: ['contracts'],
  queryFn: async () => {
    const { data } = await api.get('/contracts');
    return data;
  },
});

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newContract: any) => api.post('/contracts', newContract),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/contracts/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/contracts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
};

// --- EQUIPMENT ---
export const useEquipment = () => useQuery({
  queryKey: ['equipment'],
  queryFn: async () => {
    const { data } = await api.get('/equipment');
    return data;
  },
  staleTime: 30000, // 30s — equipment inventory doesn't change per-second
});

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEquip: any) => api.post('/equipment', newEquip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/equipment/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/equipment/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useEquipmentById = (id: number | string) => useQuery({
  queryKey: ['equipment', id],
  queryFn: async () => {
    const { data } = await api.get(`/equipment/${id}`);
    return data;
  },
  enabled: !!id,
});


// --- INTERVENTIONS ---
export const useInterventions = (query?: any) => useQuery({
  queryKey: ['interventions', query],
  queryFn: async () => {
    const { data } = await api.get('/interventions', { params: cleanParams(query) });
    return data;
  },
  staleTime: 15000, // 15s — interventions update often but WebSocket handles live changes
});

export const useIntervention = (id: number | string) => useQuery({
  queryKey: ['interventions', id],
  queryFn: async () => {
    const { data } = await api.get(`/interventions/${id}`);
    return data;
  },
  enabled: !!id,
});

export const useCreateIntervention = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newIntervention: any) => api.post('/interventions', newIntervention),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateIntervention = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => {
      // Use explicit mode flag to route to the correct endpoint.
      // Pass { mode: 'status', status: '...' } for status-only transitions.
      // Pass full intervention data (no mode) for full updates via PUT.
      if (data.mode === 'status') {
        const { mode, ...payload } = data;
        return api.patch(`/interventions/${id}/status`, payload);
      }
      return api.put(`/interventions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteIntervention = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/interventions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

// --- TASKS ---
export const useTasks = (query?: any) => useQuery({
  queryKey: ['tasks', query],
  queryFn: async () => {
    const { data } = await api.get('/tasks', { params: cleanParams(query) });
    return data;
  },
});

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTask: any) => api.post('/tasks', newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      toast.success('Tâche mise à jour');
    },
    onError: (err: any) => {
      console.error('Update Task error:', err);
      toast.error(err.response?.data?.message || "Échec de la mise à jour");
    },
    onSettled: () => {
      // Always refetch after error or success to keep server sync
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Tâche supprimée avec succès');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Échec de la suppression");
    }
  });
};
export const useProjects = () => useQuery({
  queryKey: ['projects'],
  queryFn: async () => {
    const { data } = await api.get('/projects');
    return data;
  },
});

export const useProject = (id: number | string | null) => useQuery({
  queryKey: ['projects', id],
  queryFn: async () => {
    if (!id) return null;
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },
  enabled: !!id,
});

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProject: any) => api.post('/projects', newProject),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/projects/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
};

// --- PHASES ---
export const useUpdatePhase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/phases/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// --- USERS ---
export const useUsers = (includeInactive = false) => useQuery({
  queryKey: ['users', includeInactive],
  queryFn: async () => {
    const { data } = await api.get('/users', { 
      params: { includeInactive: includeInactive ? 'true' : 'false' } 
    });
    return data;
  },
});

// --- TENANTS ---
export const useTenants = () => useQuery({
  queryKey: ['tenants'],
  queryFn: async () => {
    const { data } = await api.get('/tenants');
    return data;
  },
});

// --- COMPANIES ---
export const useCompanies = () => useQuery({
  queryKey: ['companies'],
  queryFn: async () => {
    const { data } = await api.get('/companies');
    return data;
  },
});

export const useCompany = (id: number | string | null) => useQuery({
  queryKey: ['companies', id],
  queryFn: async () => {
    if (!id) return null;
    const { data } = await api.get(`/companies/${id}`);
    return data;
  },
  enabled: !!id,
});

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCompany: any) => api.post('/companies', newCompany),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/companies/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/companies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
};

// --- DOCUMENTS ---
export const useDocuments = () => useQuery({
  queryKey: ['documents'],
  queryFn: async () => {
    const { data } = await api.get('/documents');
    return data;
  },
});

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document supprimé avec succès');
    },
  });
};

// --- COMMENTS ---
export const useComments = (type: 'intervention' | 'task', id: number | string) => useQuery({
  queryKey: ['comments', type, id],
  queryFn: async () => {
    const { data } = await api.get(`/comments/${type}/${id}`);
    return data;
  },
  enabled: !!id,
});

export const useCreateComment = (type: 'intervention' | 'task', id: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      const payload: any = { content };
      if (type === 'intervention') payload.interventionId = id;
      else payload.taskId = id;
      return api.post('/comments', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', type, id] }),
  });
};

// --- USER MANAGEMENT (ADMIN) ---
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.post(`/users/${id}/revoke-session`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Session utilisateur révoquée avec succès');
    },
    onError: (err: any) => {
      console.error('Revoke Session error:', err);
      toast.error(err.response?.data?.message || 'Échec de la révocation de session');
    }
  });
};
// --- NOTIFICATIONS ---
export const useNotifications = () => useQuery({
  queryKey: ['notifications'],
  queryFn: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },
});

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      useSocketStore.getState().syncUnreadCount();
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      useSocketStore.getState().syncUnreadCount();
    },
  });
};

// ─────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────

export const useInvoices = (query?: any) => {
  return useQuery({
    queryKey: ['invoices', query],
    queryFn: () => api.get('/invoices', { params: query }).then((res) => res.data),
  });
};

export const useInvoice = (id: number | string) => {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.get(`/invoices/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/invoices', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/invoices/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/invoices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

// --- AUDIT LOGS ---
export const useAuditLogs = (page: number = 1, limit: number = 50) => useQuery({
  queryKey: ['audit-logs', page, limit],
  queryFn: async () => {
    const { data } = await api.get('/audit', { params: { page, limit } });
    return data;
  },
});

// ─────────────────────────────────────────────
// ANALYTICS & MAINTENANCE
// ─────────────────────────────────────────────

export const useAnalytics = (companyId?: number) => useQuery({
  queryKey: ['analytics', companyId],
  queryFn: async () => {
    const { data } = await api.get('/analytics/dashboard', { params: { companyId } });
    return data;
  },
  refetchInterval: 60000, // Poll every 60s — WebSocket pushes live changes anyway
  staleTime: 30000,       // Consider data fresh for 30s to avoid redundant fetches
});

export const useSchedules = () => useQuery({
  queryKey: ['maintenance-schedules'],
  queryFn: async () => {
    const { data } = await api.get('/maintenance-schedules');
    return data;
  },
});

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/maintenance-schedules', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] }),
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/maintenance-schedules/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] }),
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/maintenance-schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Planning de maintenance supprimé');
    },
  });
};

export const useTriggerPPM = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/maintenance-schedules/trigger-manual'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      toast.success('Génération des interventions PPM lancée avec succès');
    },
  });
};

// --- PURCHASES (DEMANDES D'ACHAT) ---
export const usePurchaseRequests = () => useQuery({
  queryKey: ['purchaseRequests'],
  queryFn: async () => {
    const { data } = await api.get('/purchases');
    return data;
  },
});

export const usePurchaseRequest = (id: number | string | undefined) => useQuery({
  queryKey: ['purchaseRequest', id],
  queryFn: async () => {
    if (!id) return null;
    const { data } = await api.get(`/purchases/${id}`);
    return data;
  },
  enabled: !!id,
});

export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newRequest: any) => api.post('/purchases', newRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      toast.success('Demande d\'achat créée avec succès');
    },
  });
};

export const useValidateCommercialPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) => 
      api.patch(`/purchases/${id}/validate-commercial`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest'] });
      toast.success('Demande validée commercialement');
    },
  });
};

export const useValidateDirectorPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) => 
      api.patch(`/purchases/${id}/validate-director`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest'] });
      toast.success('Demande acceptée par la Direction');
    },
  });
};

export const useProcessPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/purchases/${id}/process`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest'] });
      toast.success('Demande en cours d\'approvisionnement');
    },
  });
};

export const useCompletePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actualCost, convertToAsset, assetType, assetData }: { id: number; actualCost: number; convertToAsset?: boolean; assetType?: string; assetData?: any }) => 
      api.patch(`/purchases/${id}/complete`, { actualCost, convertToAsset, assetType, assetData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest'] });
      queryClient.invalidateQueries({ queryKey: ['immobilisations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['officeSupplies'] });
      toast.success('Achat finalisé avec le coût réel enregistré');
    },
  });
};

export const useRejectPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) => 
      api.patch(`/purchases/${id}/reject`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest'] });
      toast.error('Demande d\'achat refusée');
    },
  });
};

export const useUpdatePurchaseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/purchases/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest'] });
      toast.success('Demande d\'achat mise à jour');
    },
  });
};

export const useDeletePurchaseRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      toast.success('Demande d\'achat supprimée');
    },
  });
};

// --- IMMOBILISATIONS ---
export const useImmobilisations = (query?: any) => useQuery({
  queryKey: ['immobilisations', query],
  queryFn: async () => {
    const { data } = await api.get('/immobilisations', { params: cleanParams(query) });
    return data;
  },
});

export const useImmobilisationsStats = () => useQuery({
  queryKey: ['immobilisations-stats'],
  queryFn: async () => {
    const { data } = await api.get('/immobilisations/stats');
    return data;
  },
});

export const useCreateImmobilisation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/immobilisations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immobilisations'] });
      queryClient.invalidateQueries({ queryKey: ['immobilisations-stats'] });
      toast.success('Immobilisation créée avec succès');
    },
  });
};

export const useUpdateImmobilisation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/immobilisations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immobilisations'] });
      queryClient.invalidateQueries({ queryKey: ['immobilisations-stats'] });
      toast.success('Immobilisation mise à jour');
    },
  });
};

export const useDeleteImmobilisation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/immobilisations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immobilisations'] });
      queryClient.invalidateQueries({ queryKey: ['immobilisations-stats'] });
      toast.success('Immobilisation supprimée');
    },
  });
};

// --- PARC AUTOMOBILE ---
export const useVehicles = (query?: any) => useQuery({
  queryKey: ['vehicles', query],
  queryFn: async () => {
    const { data } = await api.get('/parc-auto/vehicles', { params: cleanParams(query) });
    return data;
  },
});

export const useFleetStats = () => useQuery({
  queryKey: ['fleet-stats'],
  queryFn: async () => {
    const { data } = await api.get('/parc-auto/vehicles/stats');
    return data;
  },
});

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/parc-auto/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.success('Véhicule ajouté à la flotte');
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/parc-auto/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.success('Véhicule mis à jour');
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/parc-auto/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.success('Véhicule retiré de la flotte');
    },
  });
};

// --- MOYENS GENERAUX ---
export const useServiceRequests = (query?: any) => useQuery({
  queryKey: ['service-requests', query],
  queryFn: async () => {
    const { data } = await api.get('/moyens-generaux/requests', { params: cleanParams(query) });
    return data;
  },
});

export const useMoyensGenerauxStats = () => useQuery({
  queryKey: ['mg-stats'],
  queryFn: async () => {
    const { data } = await api.get('/moyens-generaux/stats');
    return data;
  },
});

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/moyens-generaux/requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Demande de service créée');
    },
  });
};

export const useUpdateServiceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/moyens-generaux/requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Demande de service mise à jour');
    },
  });
};

export const useDeleteServiceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/moyens-generaux/requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Demande de service supprimée');
    },
  });
};

// --- PARC AUTO: FUEL LOGS ---
export const useFuelLogs = (vehicleId?: number) => useQuery({
  queryKey: ['fuel-logs', vehicleId],
  queryFn: async () => {
    const { data } = await api.get('/parc-auto/fuel', { params: vehicleId ? { vehicleId } : undefined });
    return data;
  },
});

export const useCreateFuelLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/parc-auto/fuel', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.success('Plein de carburant enregistré');
    },
  });
};

export const useDeleteFuelLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/parc-auto/fuel/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.success('Entrée carburant supprimée');
    },
  });
};

// --- PARC AUTO: MISSIONS ---
export const useVehicleMissions = (vehicleId?: number) => useQuery({
  queryKey: ['vehicle-missions', vehicleId],
  queryFn: async () => {
    const { data } = await api.get('/parc-auto/missions', { params: vehicleId ? { vehicleId } : undefined });
    return data;
  },
});

export const useCreateVehicleMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/parc-auto/missions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-missions'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Mission créée avec succès');
    },
  });
};

export const useUpdateVehicleMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/parc-auto/missions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-missions'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Mission mise à jour');
    },
  });
};

export const useDeleteVehicleMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/parc-auto/missions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-missions'] });
      toast.success('Mission supprimée');
    },
  });
};

// --- MOYENS GENERAUX: SUPPLIERS ---
export const useSuppliers = (contractStatus?: string) => useQuery({
  queryKey: ['mg-suppliers', contractStatus],
  queryFn: async () => {
    const { data } = await api.get('/moyens-generaux/suppliers', { params: contractStatus ? { contractStatus } : undefined });
    return data;
  },
});

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/moyens-generaux/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Prestataire ajouté avec succès');
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/moyens-generaux/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Prestataire mis à jour');
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/moyens-generaux/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Prestataire supprimé');
    },
  });
};

// --- MOYENS GENERAUX: OFFICE SUPPLIES ---
export const useOfficeSupplies = (lowStockOnly?: boolean) => useQuery({
  queryKey: ['mg-supplies', lowStockOnly],
  queryFn: async () => {
    const { data } = await api.get('/moyens-generaux/supplies', { params: lowStockOnly ? { lowStockOnly: 'true' } : undefined });
    return data;
  },
});

export const useCreateOfficeSupply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/moyens-generaux/supplies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-supplies'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Article ajouté au stock');
    },
  });
};

export const useUpdateOfficeSupply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/moyens-generaux/supplies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-supplies'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Stock mis à jour');
    },
  });
};

export const useDeleteOfficeSupply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/moyens-generaux/supplies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-supplies'] });
      toast.success('Article supprimé du stock');
    },
  });
};

// --- MOYENS GENERAUX: COMPANY SPACES ---
export const useCompanySpaces = (params?: { type?: string; status?: string }) => useQuery({
  queryKey: ['mg-spaces', params],
  queryFn: async () => {
    const { data } = await api.get('/moyens-generaux/spaces', { params: cleanParams(params) });
    return data;
  },
});

export const useCreateCompanySpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/moyens-generaux/spaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['mg-stats'] });
      toast.success('Espace ajouté avec succès');
    },
  });
};

export const useUpdateCompanySpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/moyens-generaux/spaces/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-spaces'] });
      toast.success('Espace mis à jour');
    },
  });
};

export const useDeleteCompanySpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/moyens-generaux/spaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mg-spaces'] });
      toast.success('Espace supprimé');
    },
  });
};

// --- ROLE PERMISSIONS ---
export const useRolePermissions = () => useQuery({
  queryKey: ['role-permissions'],
  queryFn: async () => {
    const { data } = await api.get('/users/permissions');
    return data;
  },
  staleTime: 300000, // 5 min cache
});

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/users/permissions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Matrice de permissions mise à jour avec succès');
    },
    onError: (err: any) => {
      console.error('Update Role Permissions error:', err);
      toast.error(err.response?.data?.message || "Échec de la mise à jour");
    }
  });
};

// --- CUSTOM ROLES ---
export const useCustomRoles = (tenantId?: string) => useQuery({
  queryKey: ['custom-roles', tenantId],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    const { data } = await api.get(`/users/custom-roles?${params.toString()}`);
    return data;
  },
});

export const useCreateCustomRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/users/custom-roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Rôle personnalisé créé avec succès');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du rôle');
    }
  });
};

export const useUpdateCustomRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.patch(`/users/custom-roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Rôle personnalisé mis à jour');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  });
};

export const useDeleteCustomRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/users/custom-roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Rôle personnalisé supprimé');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  });
};

// --- MEETINGS ---
export const useMeetings = () => useQuery({
  queryKey: ['meetings'],
  queryFn: async () => {
    const { data } = await api.get('/meetings');
    return data;
  },
});

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newMeeting: any) => api.post('/meetings', newMeeting),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/meetings/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/meetings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useConvertMeetingToTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.post(`/meetings/${id}/convert-to-task`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// --- ADDITIONAL USER HOOKS ---
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newUser: any) => api.post('/users', newUser),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

// --- ADDITIONAL TENANT HOOKS ---
export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTenant: any) => api.post('/tenants', newTenant),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => api.patch(`/tenants/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.delete(`/tenants/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

// --- BACKUPS ---
export const useBackups = () => useQuery({
  queryKey: ['backups'],
  queryFn: async () => {
    const { data } = await api.get('/backup');
    return data;
  },
});

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/backup'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backups'] }),
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => api.delete(`/backup/${filename}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backups'] }),
  });
};

// --- COPILOT IA ---
export const useAskCopilot = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      const { data } = await api.post('/copilot/ask', { query });
      return data as { text: string; suggestions?: string[] };
    },
  });
};

