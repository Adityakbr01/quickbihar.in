import { create } from "zustand";

interface AccountUIState {
    isEditModalVisible: boolean;
    setEditModalVisible: (visible: boolean) => void;
}

export const useAccountStore = create<AccountUIState>((set) => ({
    isEditModalVisible: false,
    setEditModalVisible: (visible) => set({ isEditModalVisible: visible }),
}));
