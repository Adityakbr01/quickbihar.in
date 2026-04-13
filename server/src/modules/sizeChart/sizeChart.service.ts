import { SizeChartDAO } from "./sizeChart.dao";
import type { CreateSizeChartBody } from "./sizeChart.validation";

export class SizeChartService {
    static async createChart(data: CreateSizeChartBody) {
        return await SizeChartDAO.create(data);
    }

    static async getAllCharts() {
        return await SizeChartDAO.findAll();
    }

    static async getChartById(id: string) {
        return await SizeChartDAO.findById(id);
    }

    static async updateChart(id: string, data: Partial<CreateSizeChartBody>) {
        return await SizeChartDAO.updateById(id, data);
    }

    static async deleteChart(id: string) {
        return await SizeChartDAO.deleteById(id);
    }
}
