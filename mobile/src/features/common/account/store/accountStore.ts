import { create } from "zustand";

interface AccountUIState {
    isEditModalVisible: boolean;
    setEditModalVisible: (visible: boolean) => void;

    isPasswordSheetVisible: boolean;
    setPasswordSheetVisible: (visible: boolean) => void;
}

export const useAccountStore = create<AccountUIState>((set) => ({
    isEditModalVisible: false,
    setEditModalVisible: (visible) => set({ isEditModalVisible: visible }),

    isPasswordSheetVisible: false,
    setPasswordSheetVisible: (visible) =>
        set({ isPasswordSheetVisible: visible }),
}));
