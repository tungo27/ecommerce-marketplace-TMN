import { create } from 'zustand';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

export const useAuth = create<AuthStore>((set) => {
  // Start with null user (matches SSR state) - hydrate after mount
  return {
    user: null,
    isHydrated: false,
    isLoading: false,
    error: null,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
      set({ user: null });
    },
  };
});

// Hydrate the store from localStorage after the component mounts on the client
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      useAuth.setState({ user: JSON.parse(storedUser), isHydrated: true });
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      useAuth.setState({ isHydrated: true });
    }
  } else {
    useAuth.setState({ isHydrated: true });
  }
}
