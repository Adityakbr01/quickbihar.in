import { Document } from "mongoose";

export interface IRefundPolicy extends Document {
    name: string;
    category: string;
    description: string;
    returnWindowDays: number;
    refundProcessingDays: number;
    conditions: string[];
    refundType: string;
    returnShipping: string;
    isReturnable: boolean;
    isExchangeAvailable: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
