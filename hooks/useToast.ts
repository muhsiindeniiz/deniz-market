import { create } from 'zustand';

interface ToastState {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    showToast: (message, type = 'info', duration = 3000) => {
        set({ visible: true, message, type, duration });
    },
    hideToast: () => {
        set({ visible: false, message: '', type: 'info' });
    },
}));