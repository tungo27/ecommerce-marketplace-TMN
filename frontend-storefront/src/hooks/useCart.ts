'use client';

import { create } from 'zustand';
import { apiClient } from '@/utils/api';
import { AxiosError } from 'axios';

// Types

/**
 * CartItem - Cấu trúc một sản phẩm trong giỏ hàng (đồng bộ với backend CartItem).
 */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  stock: number;
  subtotal?: number;
}

/**
 * GuestCartItem - Cấu trúc item lưu trong LocalStorage của guest.
 * Nhẹ hơn CartItem, chỉ lưu thông tin cần thiết để sync.
 */
export interface GuestCartItem {
  productId: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  stock: number;
}

/**
 * CartState - Toàn bộ trạng thái giỏ hàng quản lý bởi Zustand store.
 */
interface CartState {
  // Danh sách items hiện tại trong giỏ hàng
  items: CartItem[];
  // Tổng tiền toàn bộ giỏ
  totalCartPrice: number;
  // Tổng số lượng tất cả items
  totalItems: number;
  // Trạng thái loading cho các thao tác async
  isLoading: boolean;
  // Toast notification (null = ẩn)
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // ─── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Thêm sản phẩm vào giỏ hàng.
   * - Guest: Lưu LocalStorage + cập nhật store.
   * - User: Gọi API POST /api/cart/update.
   *
   * @param product - Thông tin sản phẩm cần thêm.
   * @param quantity - Số lượng thêm vào (mặc định 1).
   * @param isAuthenticated - True nếu user đã đăng nhập.
   */
  addToCart: (
    product: Omit<GuestCartItem, 'quantity'>,
    quantity: number,
    isAuthenticated: boolean,
  ) => Promise<void>;

  /**
   * Cập nhật số lượng chính xác của một item trong giỏ (dùng cho nút +/-).
   * - Guest: Cập nhật LocalStorage + store.
   * - User: Gọi API PATCH /api/cart/:productId.
   *
   * @param productId - ID sản phẩm cần cập nhật.
   * @param newQuantity - Số lượng mới (phải >= 1).
   * @param isAuthenticated - True nếu user đã đăng nhập.
   */
  setQuantity: (
    productId: string,
    newQuantity: number,
    isAuthenticated: boolean,
  ) => Promise<void>;

  /**
   * Xóa một sản phẩm khỏi giỏ hàng.
   * - Guest: Cập nhật LocalStorage + store.
   * - User: Gọi API DELETE /api/cart/:productId.
   *
   * @param productId - ID sản phẩm cần xóa.
   * @param isAuthenticated - True nếu user đã đăng nhập.
   */
  removeItem: (productId: string, isAuthenticated: boolean) => Promise<void>;

  /**
   * Tải giỏ hàng từ nguồn phù hợp.
   * - Guest: Đọc từ LocalStorage.
   * - User: Gọi API GET /api/cart.
   *
   * @param isAuthenticated - True nếu user đã đăng nhập.
   */
  loadCart: (isAuthenticated: boolean) => Promise<void>;

  /**
   * Đồng bộ guest cart (từ LocalStorage) lên Redis sau khi đăng nhập thành công.
   * Gọi sau khi lưu accessToken vào LocalStorage.
   * Tự động xóa guest_cart khỏi LocalStorage sau khi sync thành công.
   */
  syncGuestCartAfterLogin: () => Promise<void>;

  /**
   * Xóa toàn bộ giỏ hàng (client-side và server-side nếu đã đăng nhập).
   *
   * @param isAuthenticated - True nếu user đã đăng nhập.
   */
  clearCart: (isAuthenticated: boolean) => Promise<void>;

  /**
   * Hiển thị toast notification và tự động ẩn sau 3 giây.
   */
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => void;

  /**
   * Ẩn toast notification ngay lập tức.
   */
  hideToast: () => void;
}

// ─── LocalStorage Helpers ──────────────────────────────────────────────────────

const GUEST_CART_KEY = 'guest_cart';

/**
 * Đọc guest cart từ LocalStorage. Trả về mảng rỗng nếu không có hoặc lỗi parse.
 */
function readGuestCartFromStorage(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GuestCartItem[];
  } catch {
    return [];
  }
}

/**
 * Ghi guest cart vào LocalStorage.
 */
function writeGuestCartToStorage(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[useCart] Lỗi ghi guest_cart vào LocalStorage:', error);
  }
}

/**
 * Xóa guest cart khỏi LocalStorage.
 */
function clearGuestCartFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

// ─── Cart Calculation Helpers ──────────────────────────────────────────────────

/**
 * Tính tổng tiền và tổng items từ danh sách CartItem.
 */
function calculateTotals(items: CartItem[]): {
  totalCartPrice: number;
  totalItems: number;
} {
  const totalCartPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  return {
    totalCartPrice: Math.round(totalCartPrice * 100) / 100,
    totalItems,
  };
}

/**
 * Chuyển đổi GuestCartItem thành CartItem với subtotal.
 */
function toCartItems(guestItems: GuestCartItem[]): CartItem[] {
  return guestItems.map((item) => ({
    ...item,
    subtotal: Math.round(item.price * item.quantity * 100) / 100,
  }));
}

// ─── Zustand Store ─────────────────────────────────────────────────────────────

export const useCart = create<CartState>((set, get) => ({
  items: [],
  totalCartPrice: 0,
  totalItems: 0,
  isLoading: false,
  toast: null,

  // ─── showToast / hideToast ──────────────────────────────────────────────────

  showToast: (message, type) => {
    set({ toast: { message, type } });
    // Tự động ẩn toast sau 3 giây
    setTimeout(() => {
      set((state) => {
        // Chỉ ẩn nếu đây vẫn là toast hiện tại (tránh ẩn nhầm toast mới)
        if (state.toast?.message === message) {
          return { toast: null };
        }
        return state;
      });
    }, 3000);
  },

  hideToast: () => set({ toast: null }),

  // ─── loadCart ──────────────────────────────────────────────────────────────

  loadCart: async (isAuthenticated) => {
    set({ isLoading: true });
    try {
      if (isAuthenticated) {
        // User: lấy giỏ hàng từ Redis qua API
        const response = await apiClient.get<{
          items: CartItem[];
          totalCartPrice: number;
          totalItems: number;
        }>('/cart');

        const { items, totalCartPrice, totalItems } = response.data;
        set({ items, totalCartPrice, totalItems });
      } else {
        // Guest: đọc từ LocalStorage
        const guestItems = readGuestCartFromStorage();
        const cartItems = toCartItems(guestItems);
        const totals = calculateTotals(cartItems);
        set({ items: cartItems, ...totals });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message || 'Không thể tải giỏ hàng.';
      get().showToast(message, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── addToCart ─────────────────────────────────────────────────────────────

  addToCart: async (product, quantity, isAuthenticated) => {
    set({ isLoading: true });
    try {
      if (isAuthenticated) {
        // User: gọi API backend
        const response = await apiClient.post<{
          items: CartItem[];
          totalCartPrice: number;
          totalItems: number;
          requiresLocalStorage?: boolean;
        }>('/cart/update', {
          productId: product.productId,
          quantity,
        });

        const data = response.data;

        // Trường hợp hiếm: server trả về requiresLocalStorage (token hết hạn mid-session)
        if (data.requiresLocalStorage) {
          throw new Error('Session đã hết hạn. Vui lòng đăng nhập lại.');
        }

        set({
          items: data.items,
          totalCartPrice: data.totalCartPrice,
          totalItems: data.totalItems,
        });
        get().showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
      } else {
        // Guest: cập nhật LocalStorage
        const currentGuestItems = readGuestCartFromStorage();
        const existingIndex = currentGuestItems.findIndex(
          (item) => item.productId === product.productId,
        );

        if (existingIndex !== -1) {
          const currentQty = currentGuestItems[existingIndex].quantity;
          const newTotalQty = currentQty + quantity;

          // Kiểm tra tồn kho phía client
          if (newTotalQty > product.stock) {
            get().showToast('Requested quantity exceeds available stock', 'error');
            return;
          }

          currentGuestItems[existingIndex] = {
            ...currentGuestItems[existingIndex],
            quantity: newTotalQty,
            stock: product.stock,
          };
        } else {
          // Kiểm tra số lượng thêm mới
          if (quantity > product.stock) {
            get().showToast('Requested quantity exceeds available stock', 'error');
            return;
          }

          currentGuestItems.push({
            productId: product.productId,
            name: product.name,
            price: product.price,
            images: product.images,
            quantity,
            stock: product.stock,
          });
        }

        writeGuestCartToStorage(currentGuestItems);
        const cartItems = toCartItems(currentGuestItems);
        const totals = calculateTotals(cartItems);
        set({ items: cartItems, ...totals });
        get().showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        (error instanceof Error ? error.message : 'Không thể thêm vào giỏ hàng.');
      get().showToast(message, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── setQuantity ───────────────────────────────────────────────────────────

  setQuantity: async (productId, newQuantity, isAuthenticated) => {
    // Validate phía client trước để phản hồi ngay lập tức
    if (newQuantity <= 0) {
      get().showToast('Số lượng phải lớn hơn 0.', 'error');
      return;
    }

    // Kiểm tra tồn kho phía client (tránh gọi API khi rõ ràng vượt stock)
    const currentItem = get().items.find((item) => item.productId === productId);
    if (currentItem && newQuantity > currentItem.stock) {
      get().showToast('Requested quantity exceeds available stock', 'error');
      return;
    }

    set({ isLoading: true });
    try {
      if (isAuthenticated) {
        // User: gọi API PATCH
        const response = await apiClient.patch<{
          items: CartItem[];
          totalCartPrice: number;
          totalItems: number;
        }>(`/cart/${productId}`, { quantity: newQuantity });

        const { items, totalCartPrice, totalItems } = response.data;
        set({ items, totalCartPrice, totalItems });
      } else {
        // Guest: cập nhật LocalStorage
        const currentGuestItems = readGuestCartFromStorage();
        const itemIndex = currentGuestItems.findIndex(
          (item) => item.productId === productId,
        );

        if (itemIndex === -1) {
          get().showToast('Sản phẩm không có trong giỏ hàng.', 'error');
          return;
        }

        // Kiểm tra tồn kho
        if (newQuantity > currentGuestItems[itemIndex].stock) {
          get().showToast('Requested quantity exceeds available stock', 'error');
          return;
        }

        currentGuestItems[itemIndex] = {
          ...currentGuestItems[itemIndex],
          quantity: newQuantity,
        };

        writeGuestCartToStorage(currentGuestItems);
        const cartItems = toCartItems(currentGuestItems);
        const totals = calculateTotals(cartItems);
        set({ items: cartItems, ...totals });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message || 'Không thể cập nhật số lượng.';
      get().showToast(message, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── removeItem ────────────────────────────────────────────────────────────

  removeItem: async (productId, isAuthenticated) => {
    set({ isLoading: true });
    try {
      if (isAuthenticated) {
        // User: gọi API DELETE
        const response = await apiClient.delete<{
          items: CartItem[];
          totalCartPrice: number;
          totalItems: number;
        }>(`/cart/${productId}`);

        const { items, totalCartPrice, totalItems } = response.data;
        set({ items, totalCartPrice, totalItems });
      } else {
        // Guest: cập nhật LocalStorage
        const currentGuestItems = readGuestCartFromStorage();
        const filteredItems = currentGuestItems.filter(
          (item) => item.productId !== productId,
        );
        writeGuestCartToStorage(filteredItems);
        const cartItems = toCartItems(filteredItems);
        const totals = calculateTotals(cartItems);
        set({ items: cartItems, ...totals });
      }
      get().showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'info');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message || 'Không thể xóa sản phẩm.';
      get().showToast(message, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── syncGuestCartAfterLogin ───────────────────────────────────────────────

  syncGuestCartAfterLogin: async () => {
    const guestItems = readGuestCartFromStorage();

    // Nếu không có guest items, không cần sync
    if (guestItems.length === 0) {
      // Tải giỏ hàng user từ Redis
      await get().loadCart(true);
      return;
    }

    set({ isLoading: true });
    try {
      // Gửi toàn bộ guest items lên API /cart/sync
      const syncPayload = guestItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await apiClient.post<{
        items: CartItem[];
        totalCartPrice: number;
        totalItems: number;
      }>('/cart/sync', { items: syncPayload });

      const { items, totalCartPrice, totalItems } = response.data;

      // Xóa guest cart khỏi LocalStorage sau khi sync thành công
      clearGuestCartFromStorage();

      set({ items, totalCartPrice, totalItems });
      get().showToast(
        `Đã đồng bộ ${guestItems.length} sản phẩm từ giỏ hàng tạm lên tài khoản!`,
        'success',
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        'Không thể đồng bộ giỏ hàng. Vui lòng thử lại.';
      get().showToast(message, 'error');

      // Dù sync thất bại, vẫn tải giỏ hàng user từ Redis
      await get().loadCart(true);
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── clearCart ─────────────────────────────────────────────────────────────

  clearCart: async (isAuthenticated) => {
    set({ isLoading: true });
    try {
      if (isAuthenticated) {
        await apiClient.delete('/cart');
      }
      // Dù là user hay guest, xóa cả LocalStorage
      clearGuestCartFromStorage();
      set({ items: [], totalCartPrice: 0, totalItems: 0 });
      get().showToast('Đã xóa toàn bộ giỏ hàng.', 'info');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message || 'Không thể xóa giỏ hàng.';
      get().showToast(message, 'error');
    } finally {
      set({ isLoading: false });
    }
  },
}));
