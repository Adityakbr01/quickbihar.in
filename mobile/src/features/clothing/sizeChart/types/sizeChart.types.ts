export interface ISizeChartRow {
  size: string;
  [key: string]: string | number;
}

export type SizeChartUnit = "inches" | "cm";

export interface ISizeChart {
  _id: string;
  name: string;
  category: string;
  unit: SizeChartUnit;
  fields: string[]; // e.g., ["size", "chest", "length"]
  data: ISizeChartRow[];
  howToMeasure?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSizeChartDto {
  name: string;
  category: string;
  unit: SizeChartUnit;
  fields: string[];
  data: ISizeChartRow[];
  howToMeasure?: string[];
}

export interface UpdateSizeChartDto extends Partial<CreateSizeChartDto> {}
