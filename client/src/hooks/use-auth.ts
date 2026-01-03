import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export interface User {
  id: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  githubUsername: string | null;
  githubAvatarUrl: string | null;
  role: string;
  subscriptionTier: string | null;
}

export interface Session {
  user: User;
}

// Fetch current session
async function fetchSession(): Promise<Session> {
  const res = await fetch("/api/auth/session", {
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Not authenticated");
  }
  
  return res.json();
}

// Logout
async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Logout failed");
  }
}

// Hook to get current user session
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for logout
export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["session"], null);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setLocation("/");
    },
  });
}

// Hook to check if user is authenticated
export function useAuth() {
  const { data: session, isLoading, error } = useSession();
  
  return {
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isLoading,
    error,
  };
}

// Initiate GitHub OAuth login
export function loginWithGitHub() {
  window.location.href = "/api/auth/github";
}
