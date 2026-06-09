import { Document } from "mongoose";

export interface IRefundPolicy extends Document {
    name: string;
    policyType: "RETURN" | "REFUND" | "SHIPPING" | "TERMS" | "GENERAL";
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
