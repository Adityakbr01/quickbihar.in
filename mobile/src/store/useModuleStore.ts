import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_MODULES, AppModule, ModuleId } from "../constants/modules";

interface ModuleState {
  currentModuleId: ModuleId;
  currentModule: AppModule;
  isHydrated: boolean;
  switchModule: () => AppModule;
  setModule: (id: ModuleId) => void;
  setHydrated: (state: boolean) => void;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set, get) => ({
      currentModuleId: "clothing",
      currentModule: APP_MODULES[0],
      isHydrated: false,

      switchModule: () => {
        const currentIndex = APP_MODULES.findIndex(
          (m) => m.id === get().currentModuleId
        );
        const nextIndex = (currentIndex + 1) % APP_MODULES.length;
        const nextModule = APP_MODULES[nextIndex];
        set({ currentModuleId: nextModule.id, currentModule: nextModule });
        return nextModule;
      },

      setModule: (id: ModuleId) => {
        const module = APP_MODULES.find((m) => m.id === id) || APP_MODULES[0];
        set({ currentModuleId: module.id, currentModule: module });
      },

      setHydrated: (state: boolean) => set({ isHydrated: state }),
    }),
    {
      name: "active-app-module-v1",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
