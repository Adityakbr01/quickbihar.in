/**
 * App-config business logic.
 *
 * Reads and updates the single application configuration document, guaranteeing a config
 * always exists on read (lazily seeding defaults) and surfacing write failures as `ApiError`s.
 * All persistence is delegated to `AppConfigDAO`.
 */
import * as AppConfigDAO from "./appConfig.dao";
import type { UpdateAppConfigBody } from "./appConfig.validation";
import { ApiError } from "../../utils/ApiError";

/**
 * Return the current app config, lazily seeding a defaults document the first time it is
 * requested so callers never have to handle a missing configuration.
 */
export async function getConfig() {
    const config = await AppConfigDAO.getConfig();
    if (!config) {
        // Return defaults via a fresh object if not found,
        // but usually we should have one seeded or created on first fetch.
        // For now, let's just create one with defaults.
        return await AppConfigDAO.updateConfig({});
    }
    return config;
}

/** Apply an admin config update, stamping the acting user, and fail loudly if the write is rejected. */
export async function updateConfig(data: UpdateAppConfigBody, userId: string) {
    const updatedConfig = await AppConfigDAO.updateConfig({ ...data, updatedBy: userId });
    if (!updatedConfig) {
        throw new ApiError(500, "Failed to update application configuration");
    }
    return updatedConfig;
}
