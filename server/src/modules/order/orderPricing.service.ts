import axios from "axios";
import { Types } from "mongoose";
import { ENV } from "../../config/env.config";
import { ApiError } from "../../utils/ApiError";
import { appConfigService } from "../appConfig/appConfig.service";
import { couponService } from "../coupon/coupon.service";
import { ProductDAO } from "../products/product.dao";
import { Store } from "../store/store.model";
import { calculateRiderPayout, distanceKmBetween, type RiderPayoutRules } from "./subOrder.service";

type OrderQuoteItemInput = {
    productId: string;
    sku: string;
    quantity: number;
};

type OrderQuoteShippingAddress = {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    latitude: number;
    longitude: number;
};

export type OrderQuoteInput = {
    items: OrderQuoteItemInput[];
    shippingAddress: OrderQuoteShippingAddress;
    couponCode?: string;
    couponCodes?: string[];
};

type BonusMode = "AUTO" | "FORCE_ON" | "FORCE_OFF";

type BonusRules = {
    rainBonus?: number;
    peakBonus?: number;
    festivalBonus?: number;
    nightBonus?: number;
    rainMode?: BonusMode;
    peakMode?: BonusMode;
    festivalMode?: BonusMode;
    nightMode?: BonusMode;
    peakWindows?: Array<{ start: string; end: string }>;
    festivalWindows?: Array<{ name?: string; startDate: string; endDate: string }>;
    nightStart?: string;
    nightEnd?: string;
};

export type SellerPricingSnapshot = {
    sellerId: string;
    storeId?: string;
    sellerItemSubtotal: number;
    sellerCouponShare: number;
    customerDeliveryFeeShare: number;
    customerDynamicSurchargeShare: number;
    platformCommission: number;
    commissionPercent: number;
    sellerNet: number;
    distanceKm: number;
    riderBasePayout: number;
    riderPayoutEstimate: number;
    riderBonuses: {
        rain: number;
        peak: number;
        festival: number;
        night: number;
    };
    bonusFlags: {
        rain: boolean;
        peak: boolean;
        festival: boolean;
        night: boolean;
    };
    appGrossRevenue: number;
    appNetAfterRider: number;
};

export type OrderPricingSnapshot = {
    model: "HYBRID_MARKETPLACE_V1";
    quotedAt: Date;
    marketplaceCommissionPercent: number;
    shippingFee: number;
    dynamicDeliverySurcharge: number;
    platformCommissionTotal: number;
    riderPayoutEstimateTotal: number;
    appGrossRevenue: number;
    appNetAfterRiderEstimate: number;
    sellerBreakdowns: SellerPricingSnapshot[];
};

export type OrderPricingQuote = {
    processedItems: any[];
    appliedCouponsInfo: Array<{ code: string; sellerId: Types.ObjectId; discountAmount: number }>;
    couponCodes: string[];
    totalAmount: number;
    totalTax: number;
    mrpTotal: number;
    productDiscount: number;
    discountAmount: number;
    shippingFee: number;
    dynamicDeliverySurcharge: number;
    payableAmount: number;
    platformCommissionTotal: number;
    riderPayoutEstimateTotal: number;
    appGrossRevenue: number;
    appNetAfterRiderEstimate: number;
    sellerBreakdowns: SellerPricingSnapshot[];
    pricingSnapshot: OrderPricingSnapshot;
};

const rainCache = new Map<string, { expiresAt: number; isRainActive: boolean }>();
const WEATHER_CACHE_MS = 5 * 60 * 1000;

const roundMoney = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const splitAmount = (amount: number, count: number, index: number) => {
    if (count <= 0) return 0;
    const paise = Math.round(amount * 100);
    const base = Math.floor(paise / count);
    const remainder = paise % count;
    return roundMoney((base + (index < remainder ? 1 : 0)) / 100);
};

const finiteCoords = (value?: any) => {
    const latitude = Number(value?.latitude);
    const longitude = Number(value?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude === 0 && longitude === 0) return null;
    return { latitude, longitude };
};

const geoJsonCoords = (value?: any) => {
    const longitude = Number(value?.coordinates?.[0]);
    const latitude = Number(value?.coordinates?.[1]);
    return finiteCoords({ latitude, longitude });
};

const minutesOfDay = (time?: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(time || "");
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
};

const isWithinWindow = (currentMinutes: number, start?: string, end?: string) => {
    const startMinutes = minutesOfDay(start);
    const endMinutes = minutesOfDay(end);
    if (startMinutes === null || endMinutes === null) return false;
    if (startMinutes === endMinutes) return true;
    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

const kolkataNowParts = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(date);
    const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
    const hour = Number(part("hour"));
    const minute = Number(part("minute"));
    return {
        date: `${part("year")}-${part("month")}-${part("day")}`,
        minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
    };
};

const ruleMode = (mode?: string): BonusMode => (
    mode === "FORCE_ON" || mode === "FORCE_OFF" ? mode : "AUTO"
);

const applyMode = (mode: BonusMode, autoValue: boolean) => {
    if (mode === "FORCE_ON") return true;
    if (mode === "FORCE_OFF") return false;
    return autoValue;
};

const dateInRange = (date: string, start?: string, end?: string) => {
    if (!start || !end) return false;
    return date >= start && date <= end;
};

const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

async function detectRain(coords: { latitude: number; longitude: number }) {
    const lat = Number(coords.latitude.toFixed(2));
    const lng = Number(coords.longitude.toFixed(2));
    const key = `${lat},${lng}`;
    const cached = rainCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.isRainActive;
    }

    try {
        const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
            params: {
                latitude: lat,
                longitude: lng,
                current: "precipitation,rain,showers,weather_code",
                timezone: "auto",
            },
            timeout: 2500,
        });
        const current = response.data?.current || {};
        const precipitation = Number(current.precipitation || 0);
        const rain = Number(current.rain || 0);
        const showers = Number(current.showers || 0);
        const weatherCode = Number(current.weather_code || 0);
        const isRainActive = precipitation > 0 || rain > 0 || showers > 0 || rainCodes.has(weatherCode);
        rainCache.set(key, { expiresAt: Date.now() + WEATHER_CACHE_MS, isRainActive });
        return isRainActive;
    } catch {
        rainCache.set(key, { expiresAt: Date.now() + WEATHER_CACHE_MS, isRainActive: false });
        return false;
    }
}

const effectiveRiderRules = (config: any): RiderPayoutRules => {
    const payoutRules = config?.delivery?.riderPayoutRules || {};
    const bonusRules = config?.delivery?.bonusRules || {};
    return {
        upto3Km: payoutRules.upto3Km,
        upto5Km: payoutRules.upto5Km,
        upto8Km: payoutRules.upto8Km,
        extraPerKmAfter8: payoutRules.extraPerKmAfter8,
        rainBonus: bonusRules.rainBonus ?? payoutRules.rainBonus,
        peakBonus: bonusRules.peakBonus ?? payoutRules.peakBonus,
        festivalBonus: bonusRules.festivalBonus ?? payoutRules.festivalBonus,
        nightBonus: bonusRules.nightBonus ?? payoutRules.nightBonus,
    };
};

async function detectBonusFlags(
    rules: BonusRules | undefined,
    storeCoords: { latitude: number; longitude: number } | null,
    customerCoords: { latitude: number; longitude: number },
) {
    const now = kolkataNowParts();
    const peakWindows = rules?.peakWindows?.length ? rules.peakWindows : [{ start: "18:00", end: "21:00" }];
    const festivalWindows = rules?.festivalWindows || [];
    const rainCoords = storeCoords
        ? {
            latitude: (storeCoords.latitude + customerCoords.latitude) / 2,
            longitude: (storeCoords.longitude + customerCoords.longitude) / 2,
        }
        : customerCoords;

    const rainMode = ruleMode(rules?.rainMode);
    const autoRain = rainMode === "AUTO" && Number(rules?.rainBonus || 0) > 0 ? await detectRain(rainCoords) : false;
    const autoPeak = peakWindows.some((window) => isWithinWindow(now.minutes, window.start, window.end));
    const autoFestival = festivalWindows.some((window) => dateInRange(now.date, window.startDate, window.endDate));
    const autoNight = isWithinWindow(now.minutes, rules?.nightStart || "22:00", rules?.nightEnd || "06:00");

    return {
        rain: applyMode(rainMode, autoRain),
        peak: applyMode(ruleMode(rules?.peakMode), autoPeak),
        festival: applyMode(ruleMode(rules?.festivalMode), autoFestival),
        night: applyMode(ruleMode(rules?.nightMode), autoNight),
    };
}

export class OrderPricingService {
    async buildQuote(userId: string, data: OrderQuoteInput): Promise<OrderPricingQuote> {
        const { items, shippingAddress } = data;
        const codes = data.couponCodes || (data.couponCode ? [data.couponCode] : []);
        const customerCoords = finiteCoords(shippingAddress);
        if (!customerCoords) {
            throw new ApiError(400, "Delivery address location pin is required before placing an order");
        }

        let totalAmount = 0;
        let totalTax = 0;
        let mrpTotal = 0;
        const processedItems: any[] = [];

        for (const item of items) {
            const product = await ProductDAO.findById(item.productId);
            if (!product) {
                throw new ApiError(404, `Product not found: ${item.productId}`);
            }

            if (!product.isActive || (product.approvalStatus && product.approvalStatus !== "APPROVED")) {
                throw new ApiError(400, `${product.title} is not available for purchase`);
            }

            const variant = product.variants.find((v: any) => v.sku === item.sku);
            if (!variant) {
                throw new ApiError(404, `Variant with SKU ${item.sku} not found`);
            }

            if (variant.stock < item.quantity) {
                throw new ApiError(400, `Insufficient stock for ${product.title}`);
            }

            const basePrice = Number(product.price || 0);
            const itemPrice = Math.round(product.isGstApplicable
                ? basePrice * (1 + (product.gstPercentage || 0) / 100)
                : basePrice);
            const itemOriginalPrice = Number(product.originalPrice || product.price || 0);
            const taxAmount = Math.round(itemPrice - basePrice);
            const itemSubtotal = itemPrice * item.quantity;

            totalAmount += itemSubtotal;
            totalTax += taxAmount * item.quantity;
            mrpTotal += itemOriginalPrice * item.quantity;

            processedItems.push({
                productId: product._id,
                title: product.title,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                quantity: item.quantity,
                price: itemPrice,
                sellerId: product.sellerId,
                storeId: product.storeId,
                sellerSubtotal: itemSubtotal,
                settlementStatus: "PENDING",
                basePrice,
                taxAmount,
                isGstApplicable: product.isGstApplicable,
                gstPercentage: product.gstPercentage,
                pickupLocation: product.logistics?.pickupLocation,
                warehouseName: product.logistics?.warehouseName,
                latitude: product.logistics?.latitude,
                longitude: product.logistics?.longitude,
            });
        }

        const productDiscount = mrpTotal - totalAmount;
        let couponDiscountAmount = 0;
        const appliedCouponsInfo: Array<{ code: string; sellerId: Types.ObjectId; discountAmount: number }> = [];

        if (codes.length > 0) {
            const validations = await couponService.validateMultipleCouponsForCart(codes, items, userId);
            for (const val of validations) {
                couponDiscountAmount += val.discountAmount;
                appliedCouponsInfo.push({
                    code: val.coupon.code,
                    sellerId: new Types.ObjectId(val.coupon.sellerId as any),
                    discountAmount: val.discountAmount,
                });

                const eligibleItems = processedItems.filter((processedItem) => {
                    const isSeller = processedItem.sellerId?.toString() === val.sellerId;
                    if (!isSeller) return false;
                    if (val.coupon?.appliesTo === "SPECIFIC") {
                        return val.coupon.productIds?.some((id: any) => id.toString() === processedItem.productId.toString()) || false;
                    }
                    return true;
                });

                const eligibleSubtotal = eligibleItems.reduce((sum, processedItem) => sum + (processedItem.price || 0) * (processedItem.quantity || 0), 0);
                if (eligibleSubtotal > 0) {
                    let remainingDiscount = val.discountAmount;
                    for (let i = 0; i < eligibleItems.length; i++) {
                        const processedItem = eligibleItems[i];
                        if (!processedItem) continue;
                        const itemSubtotal = (processedItem.price || 0) * (processedItem.quantity || 0);
                        let itemDiscount = 0;
                        if (i === eligibleItems.length - 1) {
                            itemDiscount = remainingDiscount;
                        } else {
                            itemDiscount = Math.round((itemSubtotal / eligibleSubtotal) * val.discountAmount);
                            remainingDiscount -= itemDiscount;
                        }
                        processedItem.sellerSubtotal = Math.max(0, itemSubtotal - itemDiscount);
                    }
                }
            }
        }

        const config = await appConfigService.getConfig();
        const shippingRules = config?.shipping || { freeShippingThreshold: 2000, shippingFee: 99 };
        const commissionPercent = Number(config?.marketplace?.commissionPercent ?? ENV.MARKETPLACE_COMMISSION_PERCENT);
        const payableBeforeShipping = totalAmount - couponDiscountAmount;
        const shippingFee = payableBeforeShipping >= Number(shippingRules.freeShippingThreshold || 0)
            ? 0
            : Number(shippingRules.shippingFee || 0);

        const sellerIds = Array.from(new Set(processedItems.map((item) => item.sellerId?.toString()).filter(Boolean)));
        const storeIds = Array.from(new Set(processedItems.map((item) => item.storeId?.toString()).filter(Boolean)));
        const stores = await Store.find({ _id: { $in: storeIds.map((id) => new Types.ObjectId(id)) } }).lean();
        const storesById = new Map(stores.map((store: any) => [store._id.toString(), store]));
        const riderRules = effectiveRiderRules(config);
        const bonusRules = {
            rainBonus: config?.delivery?.riderPayoutRules?.rainBonus,
            peakBonus: config?.delivery?.riderPayoutRules?.peakBonus,
            festivalBonus: config?.delivery?.riderPayoutRules?.festivalBonus,
            nightBonus: config?.delivery?.riderPayoutRules?.nightBonus,
            ...(config?.delivery?.bonusRules || {}),
        };
        const sellerBreakdowns: SellerPricingSnapshot[] = [];

        for (let index = 0; index < sellerIds.length; index++) {
            const sellerId = sellerIds[index];
            if (!sellerId) continue;
            const sellerItems = processedItems.filter((item) => item.sellerId?.toString() === sellerId);
            const sellerItemSubtotal = sellerItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
            const sellerCoupon = appliedCouponsInfo.find((coupon) => coupon.sellerId.toString() === sellerId);
            const sellerCouponShare = Number(sellerCoupon?.discountAmount || 0);
            const commissionBase = Math.max(0, sellerItemSubtotal - sellerCouponShare);
            const platformCommission = roundMoney((commissionBase * commissionPercent) / 100);
            const sellerNet = roundMoney(commissionBase - platformCommission);
            const storeId = sellerItems[0]?.storeId?.toString();
            const store = storeId ? storesById.get(storeId) : null;
            const itemCoords = sellerItems.map((item) => finiteCoords(item)).find(Boolean) || null;
            const storeCoords = itemCoords || geoJsonCoords(store?.currentLocation);
            const distanceKm = storeCoords ? roundMoney(distanceKmBetween(storeCoords, customerCoords) || 0) : 0;
            const bonusFlags = await detectBonusFlags(bonusRules, storeCoords, customerCoords);
            const payoutInfo = calculateRiderPayout(distanceKm, {
                rain: bonusFlags.rain ? 1 : 0,
                peak: bonusFlags.peak ? 1 : 0,
                festival: bonusFlags.festival ? 1 : 0,
                night: bonusFlags.night ? 1 : 0,
            }, riderRules);
            const customerDynamicSurchargeShare = roundMoney(
                payoutInfo.bonuses.rain
                + payoutInfo.bonuses.peak
                + payoutInfo.bonuses.festival
                + payoutInfo.bonuses.night,
            );
            const customerDeliveryFeeShare = splitAmount(shippingFee, sellerIds.length, index);
            const appGrossRevenue = roundMoney(platformCommission + customerDeliveryFeeShare + customerDynamicSurchargeShare);
            const appNetAfterRider = roundMoney(appGrossRevenue - payoutInfo.totalPayout);

            sellerBreakdowns.push({
                sellerId,
                storeId,
                sellerItemSubtotal: roundMoney(sellerItemSubtotal),
                sellerCouponShare: roundMoney(sellerCouponShare),
                customerDeliveryFeeShare,
                customerDynamicSurchargeShare,
                platformCommission,
                commissionPercent,
                sellerNet,
                distanceKm,
                riderBasePayout: roundMoney(payoutInfo.basePayout),
                riderPayoutEstimate: roundMoney(payoutInfo.totalPayout),
                riderBonuses: {
                    rain: roundMoney(payoutInfo.bonuses.rain),
                    peak: roundMoney(payoutInfo.bonuses.peak),
                    festival: roundMoney(payoutInfo.bonuses.festival),
                    night: roundMoney(payoutInfo.bonuses.night),
                },
                bonusFlags,
                appGrossRevenue,
                appNetAfterRider,
            });
        }

        const dynamicDeliverySurcharge = roundMoney(sellerBreakdowns.reduce((sum, item) => sum + item.customerDynamicSurchargeShare, 0));
        const platformCommissionTotal = roundMoney(sellerBreakdowns.reduce((sum, item) => sum + item.platformCommission, 0));
        const riderPayoutEstimateTotal = roundMoney(sellerBreakdowns.reduce((sum, item) => sum + item.riderPayoutEstimate, 0));
        const appGrossRevenue = roundMoney(platformCommissionTotal + shippingFee + dynamicDeliverySurcharge);
        const appNetAfterRiderEstimate = roundMoney(appGrossRevenue - riderPayoutEstimateTotal);
        const payableAmount = roundMoney(payableBeforeShipping + shippingFee + dynamicDeliverySurcharge);

        const pricingSnapshot: OrderPricingSnapshot = {
            model: "HYBRID_MARKETPLACE_V1",
            quotedAt: new Date(),
            marketplaceCommissionPercent: commissionPercent,
            shippingFee: roundMoney(shippingFee),
            dynamicDeliverySurcharge,
            platformCommissionTotal,
            riderPayoutEstimateTotal,
            appGrossRevenue,
            appNetAfterRiderEstimate,
            sellerBreakdowns,
        };

        return {
            processedItems,
            appliedCouponsInfo,
            couponCodes: codes,
            totalAmount: roundMoney(totalAmount),
            totalTax: roundMoney(totalTax),
            mrpTotal: roundMoney(mrpTotal),
            productDiscount: roundMoney(productDiscount),
            discountAmount: roundMoney(couponDiscountAmount),
            shippingFee: roundMoney(shippingFee),
            dynamicDeliverySurcharge,
            payableAmount,
            platformCommissionTotal,
            riderPayoutEstimateTotal,
            appGrossRevenue,
            appNetAfterRiderEstimate,
            sellerBreakdowns,
            pricingSnapshot,
        };
    }
}

export const orderPricingService = new OrderPricingService();
