import { useAuthStore } from '../stores/authStore';
import { authApi } from '../utils/api';

export const useAuthApi = () => {
  const { setUser, setLoading, setError } = useAuthStore();

  const register = async (email: string, password: string, name: string, role: 'SELLER' | 'CUSTOMER') => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register({ email, password, name, role });
      setUser(response.data);
      setLoading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setLoading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  return { register, login };
};
