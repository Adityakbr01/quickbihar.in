import { describe, expect, test } from "bun:test";

describe("Order Module Filtering Logic", () => {
    // Pure function extracting the exact DAO filtering algorithm
    const filterOrders = (orders: any[], query: { vertical?: string; module?: string }) => {
        const rawVertical = query.vertical || query.module;
        if (!rawVertical || !Array.isArray(orders)) {
            return orders;
        }

        const normalized = String(rawVertical).toUpperCase().trim();
        const isJeweleryTarget = normalized === "JEWELERY" || normalized === "JEWELRY";

        return orders.filter((order: any) => {
            const items = order.items || [];
            const hasJeweleryItem = items.some((it: any) => {
                const prod = it.productId;
                return (
                    it.vertical === "JEWELERY" ||
                    prod?.vertical === "JEWELERY" ||
                    Boolean(prod?.jeweleryDetails)
                );
            });

            const isOrderJewelery = order.vertical === "JEWELERY" || hasJeweleryItem;

            return isJeweleryTarget ? isOrderJewelery : !isOrderJewelery;
        });
    };

    const mockOrders = [
        {
            _id: "order-1",
            orderId: "QB-1001",
            vertical: "JEWELERY",
            items: [
                {
                    title: "22K Gold Bangles",
                    vertical: "JEWELERY",
                    productId: {
                        _id: "p1",
                        vertical: "JEWELERY",
                        jeweleryDetails: { metalType: "22K Gold", purity: "22K" },
                    },
                },
            ],
        },
        {
            _id: "order-2",
            orderId: "QB-1002",
            vertical: "CLOTHING",
            items: [
                {
                    title: "Men Cotton Shirt",
                    vertical: "CLOTHING",
                    productId: {
                        _id: "p2",
                        vertical: "CLOTHING",
                    },
                },
            ],
        },
        {
            // Legacy order without top-level vertical field
            _id: "order-3",
            orderId: "QB-1003",
            items: [
                {
                    title: "Heritage Kundan Necklace",
                    productId: {
                        _id: "p3",
                        jeweleryDetails: { metalType: "Gold Plated", hallmark: false },
                    },
                },
            ],
        },
        {
            // Legacy clothing order without vertical or jewelery details
            _id: "order-4",
            orderId: "QB-1004",
            items: [
                {
                    title: "Women Floral Kurti",
                    productId: {
                        _id: "p4",
                        details: { fabric: "Rayon" },
                    },
                },
            ],
        },
    ];

    test("filters strictly Jewellery orders when vertical=JEWELERY", () => {
        const filtered = filterOrders(mockOrders, { vertical: "JEWELERY" });
        expect(filtered.length).toBe(2);
        expect(filtered.map((o) => o.orderId)).toEqual(["QB-1001", "QB-1003"]);
    });

    test("filters strictly Clothing orders when vertical=CLOTHING", () => {
        const filtered = filterOrders(mockOrders, { vertical: "CLOTHING" });
        expect(filtered.length).toBe(2);
        expect(filtered.map((o) => o.orderId)).toEqual(["QB-1002", "QB-1004"]);
    });

    test("supports module parameter alias and alternative JEWELRY spelling", () => {
        const filteredModule = filterOrders(mockOrders, { module: "jewelery" });
        expect(filteredModule.map((o) => o.orderId)).toEqual(["QB-1001", "QB-1003"]);

        const filteredJewelry = filterOrders(mockOrders, { vertical: "JEWELRY" });
        expect(filteredJewelry.map((o) => o.orderId)).toEqual(["QB-1001", "QB-1003"]);
    });

    test("returns all orders when no vertical or module filter is provided", () => {
        const filtered = filterOrders(mockOrders, {});
        expect(filtered.length).toBe(4);
    });

    test("correctly handles orders with missing or empty items", () => {
        const emptyItemsOrder = [{ _id: "order-5", orderId: "QB-1005", items: [] }];
        expect(filterOrders(emptyItemsOrder, { vertical: "JEWELERY" })).toEqual([]);
        expect(filterOrders(emptyItemsOrder, { vertical: "CLOTHING" }).length).toBe(1);
    });
});
