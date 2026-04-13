export interface ISizeChartRow {
    size: string;
    [key: string]: string | number;
}

export interface ISizeChart {
    name: string;
    category: string;

    unit: "inches" | "cm";

    fields: string[]; // ["size", "chest", "length"]

    data: ISizeChartRow[];

    howToMeasure?: string[];

    createdAt: Date;
    updatedAt: Date;
}