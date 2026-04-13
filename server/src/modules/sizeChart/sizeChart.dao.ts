import { SizeChart } from "./sizeChart.model";
import type { CreateSizeChartBody } from "./sizeChart.validation";

export class SizeChartDAO {
    static async create(data: CreateSizeChartBody) {
        return await SizeChart.create(data);
    }

    static async findAll() {
        return await SizeChart.find().sort({ createdAt: -1 });
    }

    static async findById(id: string) {
        return await SizeChart.findById(id);
    }

    static async deleteById(id: string) {
        return await SizeChart.findByIdAndDelete(id);
    }
}
