import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../utils/api';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface UseCategoriesResult {
  categories: CategoryOption[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads the public category list used by seller product forms.
 * Product APIs expect `categoryId`, not the legacy category enum name.
 */
export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<CategoryOption[]>('/categories');
      setCategories(response.data);
      setError(null);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Unable to load categories.';
      setError(typeof message === 'string' ? message : 'Unable to load categories.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, isLoading, error, reload };
};
