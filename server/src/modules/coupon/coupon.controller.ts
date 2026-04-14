import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { couponService } from "./coupon.service";

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.createCoupon(req.body);
    return res.status(201).json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
    const coupons = await couponService.getCoupons(req.query);
    return res.status(200).json(new ApiResponse(200, coupons, "Coupons fetched successfully"));
});

export const getCouponById = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.getCouponById(req.params.id as unknown as string);
    return res.status(200).json(new ApiResponse(200, coupon, "Coupon fetched successfully"));
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.updateCoupon(req.params.id as unknown as string, req.body);
    return res.status(200).json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
    await couponService.deleteCoupon(req.params.id as unknown as string);
    return res.status(200).json(new ApiResponse(200, null, "Coupon deleted successfully"));
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, orderAmount } = req.body;
    // req.user._id would be used here in a real app
    const userId = (req as any).user?._id || "guest";
    const result = await couponService.validateCoupon(code, Number(orderAmount), userId);
    return res.status(200).json(new ApiResponse(200, result, "Coupon is valid"));
});
