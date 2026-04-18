import { AppConfigDAO } from "./appConfig.dao";
import type { UpdateAppConfigBody } from "./appConfig.validation";
import { ApiError } from "../../utils/ApiError";

export class AppConfigService {
    async getConfig() {
        const config = await AppConfigDAO.getConfig();
        if (!config) {
            // Return defaults via a fresh object if not found, 
            // but usually we should have one seeded or created on first fetch.
            // For now, let's just create one with defaults.
            return await AppConfigDAO.updateConfig({});
        }
        return config;
    }

    async updateConfig(data: UpdateAppConfigBody, userId: string) {
        const updatedConfig = await AppConfigDAO.updateConfig({ ...data, updatedBy: userId });
        if (!updatedConfig) {
            throw new ApiError(500, "Failed to update application configuration");
        }
        return updatedConfig;
    }
}

export const appConfigService = new AppConfigService();
