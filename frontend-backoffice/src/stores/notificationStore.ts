import { create } from 'zustand';

// Định nghĩa kiểu dữ liệu cho Notification
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  showNotification: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  closeNotification: () => void;
}

// Store quản lý thông báo toàn cục
export const useNotificationStore = create<NotificationState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  showNotification: (message, severity = 'info') => set({ open: true, message, severity }),
  closeNotification: () => set({ open: false }),
}));
