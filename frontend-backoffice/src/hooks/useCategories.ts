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

const isCategoryOption = (value: unknown): value is CategoryOption => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<CategoryOption>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
};

const toOptions = (value: unknown): CategoryOption[] =>
  Array.isArray(value) ? value.filter(isCategoryOption) : [];

/**
 * The public endpoint returns a plain array, but older/proxied deployments may
 * wrap it in `{ data: [...] }` or `{ categories: [...] }`. Accept every shape so
 * the seller form never renders an empty list because of an envelope mismatch.
 */
const extractCategories = (payload: unknown): CategoryOption[] => {
  if (Array.isArray(payload)) {
    return toOptions(payload);
  }
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const envelope = payload as { data?: unknown; categories?: unknown };
  const nested = envelope.data;

  if (typeof nested === 'object' && nested !== null) {
    const inner = nested as { data?: unknown; categories?: unknown };
    return [...toOptions(inner.data), ...toOptions(inner.categories)];
  }

  return [...toOptions(nested), ...toOptions(envelope.categories)];
};

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
      const response = await apiClient.get<unknown>('/categories');
      setCategories(extractCategories(response.data));
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
