import { cartDAO } from "./cart.dao";
import { ProductDAO } from "../products/product.dao";
import { ApiError } from "../../utils/ApiError";
import type { ICartItem } from "./cart.model";

export class CartService {
    async getCart(userId: string) {
        const cart = await cartDAO.findByUserId(userId);
        if (!cart) return { userId, items: [], subtotal: 0 };

        // Calculate dynamic subtotal and filter out invalid items if necessary
        let subtotal = 0;
        let totalTax = 0;

        const validatedItems = cart.items.map((item: any) => {
            const product = item.productId;
            if (!product) return null;

            const variant = product.variants.find((v: any) => v.sku === item.sku);
            
            // Calculate GST-inclusive price
            const basePrice = product.price;
            const itemPrice = Math.round(product.isGstApplicable 
                ? basePrice * (1 + (product.gstPercentage || 0) / 100) 
                : basePrice);
                
            const itemTax = Math.round(itemPrice - basePrice);
            
            subtotal += itemPrice * item.quantity;
            totalTax += itemTax * item.quantity;

            return {
                ...item.toObject(),
                productTitle: product.title,
                price: itemPrice,
                image: product.images[0]?.url,
                selectedSize: variant?.size,
                selectedColor: variant?.color,
                stockStatus: variant ? (variant.stock >= item.quantity ? "IN_STOCK" : "LOW_STOCK") : "OUT_OF_STOCK",
                availableStock: variant?.stock || 0
            };
        }).filter(Boolean);

        return {
            _id: cart._id,
            userId: cart.userId,
            items: validatedItems,
            subtotal,
            totalTax: Math.round(totalTax),
            itemCount: validatedItems.length
        };
    }

    async addToCart(userId: string, productId: string, sku: string, quantity: number = 1) {
        // 1. Verify Product and Stock
        const product = await ProductDAO.findById(productId);
        if (!product) throw new ApiError(404, "Product not found");

        const variant = product.variants.find(v => v.sku === sku);
        if (!variant) throw new ApiError(404, "Specific variant (SKU) not found");

        if (variant.stock < quantity) {
            throw new ApiError(400, `Only ${variant.stock} items available in stock`);
        }

        // 2. Fetch/Create Cart
        let cart = await cartDAO.findRawByUserId(userId);
        if (!cart) {
            cart = await cartDAO.create(userId);
        }

        if (!cart) throw new ApiError(500, "Failed to create/fetch cart");

        // 3. Update Items Logic
        const existingItem = cart.items.find(item => item.sku === sku);
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (variant.stock < newQuantity) {
                throw new ApiError(400, `Total quantity (${newQuantity}) exceeds available stock (${variant.stock})`);
            }
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({ productId: productId as any, sku, quantity });
        }

        return await cartDAO.updateItems(userId, cart.items);
    }

    async updateQuantity(userId: string, sku: string, quantity: number) {
        const cart = await cartDAO.findRawByUserId(userId);
        if (!cart) throw new ApiError(404, "Cart not found");

        const item = cart.items.find(i => i.sku === sku);
        if (!item) throw new ApiError(404, "Item not found in cart");

        // Verify stock for new quantity
        const product = await ProductDAO.findById(item.productId.toString());
        const variant = product?.variants.find(v => v.sku === sku);
        if (variant && variant.stock < quantity) {
            throw new ApiError(400, `Only ${variant.stock} items available`);
        }

        item.quantity = quantity;
        return await cartDAO.updateItems(userId, cart.items);
    }

    async removeItem(userId: string, sku: string) {
        const cart = await cartDAO.findRawByUserId(userId);
        if (!cart) throw new ApiError(404, "Cart not found");

        cart.items = cart.items.filter(i => i.sku !== sku);
        return await cartDAO.updateItems(userId, cart.items);
    }

    async clearCart(userId: string) {
        return await cartDAO.clearCart(userId);
    }

    async syncCart(userId: string, items: { productId: string; sku: string; quantity: number }[]) {
        let cart = await cartDAO.findRawByUserId(userId);
        if (!cart) {
            cart = await cartDAO.create(userId);
        }

        if (!cart) throw new ApiError(500, "Failed to create/fetch cart");

        for (const item of items) {
            const existingItem = cart.items.find(i => i.sku === item.sku);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                cart.items.push({ productId: item.productId as any, sku: item.sku, quantity: item.quantity });
            }
        }

        return await cartDAO.updateItems(userId, cart.items);
    }
}

export const cartService = new CartService();