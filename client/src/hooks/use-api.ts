import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Analysis {
  id: string;
  url: string;
  status: 'analyzing' | 'completed' | 'failed';
  created_at: string;
  project_id?: string;
  project_name?: string;
  project_color?: string;
  tags?: string[];
  notes?: string;
  is_favorite?: boolean;
  view_count?: number;
  consensus_score?: number;
  responsive_score?: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  analysis_count?: number;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'system' | 'light' | 'dark';
  compact_mode: boolean;
  email_notifications: boolean;
  analysis_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  scopes: string;
  last_used_at?: string;
  created_at: string;
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function apiFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============================================
// ANALYSIS HISTORY HOOKS
// ============================================

export function useAnalysisHistory(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    projectId?: string;
  }
) {
  return useQuery({
    queryKey: ['analyses', userId, options],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(options?.page || 1),
        limit: String(options?.limit || 50),
        search: options?.search || '',
        status: options?.status || '',
        projectId: options?.projectId || '',
      });

      return apiFetch(`/api/users/${userId}/analyses?${params}`);
    },
    enabled: !!userId,
  });
}

// ============================================
// PROJECTS HOOKS
// ============================================

export function useProjects(userId: string) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      return apiFetch(`/api/projects?userId=${userId}`);
    },
    enabled: !!userId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    }) => {
      return apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.userId] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      ...data
    }: {
      projectId: string;
      userId: string;
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    }) => {
      return apiFetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.userId] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      return apiFetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.userId] });
    },
  });
}

// ============================================
// USER PROFILE HOOKS
// ============================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      displayName,
      bio,
    }: {
      userId: string;
      displayName: string;
      bio?: string;
    }) => {
      return apiFetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify({ displayName, bio }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

// ============================================
// USER PREFERENCES HOOKS
// ============================================

export function usePreferences(userId: string) {
  return useQuery({
    queryKey: ['preferences', userId],
    queryFn: async () => {
      return apiFetch(`/api/users/${userId}/preferences`);
    },
    enabled: !!userId,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      ...preferences
    }: {
      userId: string;
      theme?: 'system' | 'light' | 'dark';
      compactMode?: boolean;
      emailNotifications?: boolean;
      analysisNotifications?: boolean;
    }) => {
      return apiFetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['preferences', variables.userId] });
    },
  });
}

// ============================================
// API KEYS HOOKS
// ============================================

export function useApiKeys(userId: string) {
  return useQuery({
    queryKey: ['apiKeys', userId],
    queryFn: async () => {
      return apiFetch(`/api/api-keys?userId=${userId}`);
    },
    enabled: !!userId,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      name,
      scopes,
    }: {
      userId: string;
      name: string;
      scopes?: string;
    }) => {
      return apiFetch('/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ userId, name, scopes }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', variables.userId] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, userId }: { keyId: string; userId: string }) => {
      return apiFetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', variables.userId] });
    },
  });
}
