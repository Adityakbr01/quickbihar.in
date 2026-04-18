import { AppConfig } from "./appConfig.model";
import type { UpdateAppConfigBody } from "./appConfig.validation";

export class AppConfigDAO {
    static async getConfig() {
        // We always fetch the first document. 
        // If it doesn't exist, we return null (service will handle initial creation).
        return await AppConfig.findOne();
    }

    static async updateConfig(data: UpdateAppConfigBody & { updatedBy?: string }) {
        // Find existing or create new if not exists (upsert)
        // Since we don't have a unique key other than _id, 
        // we'll findOne and if exists update it, else create it.
        const config = await AppConfig.findOne();
        if (config) {
            return await AppConfig.findByIdAndUpdate(config._id, data, { new: true });
        } else {
            return await AppConfig.create(data);
        }
    }
}
