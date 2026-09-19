// Jewelry vertical validation tests (pure unit tests — no DB, no mocks needed).
import { describe, expect, test } from "bun:test";
import { createProductSchema, updateProductSchema } from "../modules/clothing/products/product.validation";
import { createCategorySchema } from "../modules/common/category/category.validation";

const baseClothing = {
    title: "Men Cotton Shirt",
    category: "Shirts",
    price: 899,
    originalPrice: 1299,
    variants: [{ size: "M", stock: 10 }],
};

const jeweleryDetails = {
    metalType: "22K Yellow Gold",
    purity: "22K",
    hallmark: true,
    weightGrams: 4.2,
};

describe("jewelry product validation", () => {
    test("accepts a valid JEWELERY product with jeweleryDetails", () => {
        const parsed = createProductSchema.parse({
            ...baseClothing,
            title: "Mira Pendant Necklace",
            category: "Necklace",
            vertical: "JEWELERY",
            jeweleryDetails,
        });
        expect(parsed.vertical).toBe("JEWELERY");
        expect((parsed as any).jeweleryDetails.purity).toBe("22K");
    });

    test("rejects JEWELERY product without jeweleryDetails", () => {
        expect(() =>
            createProductSchema.parse({ ...baseClothing, vertical: "JEWELERY" })
        ).toThrow();
    });

    test("rejects JEWELERY product missing metalType/purity/weightGrams", () => {
        expect(() =>
            createProductSchema.parse({
                ...baseClothing,
                vertical: "JEWELERY",
                jeweleryDetails: { metalType: "Gold" },
            })
        ).toThrow();
    });

    test("rejects unknown purity value", () => {
        expect(() =>
            createProductSchema.parse({
                ...baseClothing,
                vertical: "JEWELERY",
                jeweleryDetails: { ...jeweleryDetails, purity: "10K" },
            })
        ).toThrow();
    });

    test("accepts all purity enum values", () => {
        for (const purity of ["24K", "22K", "18K", "14K", "925 Silver", "Platinum", "Other"]) {
            const parsed = createProductSchema.parse({
                ...baseClothing,
                vertical: "JEWELERY",
                jeweleryDetails: { ...jeweleryDetails, purity },
            });
            expect((parsed as any).jeweleryDetails.purity).toBe(purity);
        }
    });

    test("accepts extended BIS/cert fields", () => {
        const parsed = createProductSchema.parse({
            ...baseClothing,
            vertical: "JEWELERY",
            jeweleryDetails: {
                ...jeweleryDetails,
                bisMark: "HUID-ABC123",
                gemstone: "Ruby",
                stoneWeightCt: 0.5,
                makingCharge: 2500,
                wastagePct: 8,
                certNo: "CERT-001",
            },
        });
        expect((parsed as any).jeweleryDetails.bisMark).toBe("HUID-ABC123");
    });

    test("clothing products still pass without jeweleryDetails", () => {
        const parsed = createProductSchema.parse(baseClothing);
        expect(parsed.vertical).toBe("CLOTHING");
    });

    test("update schema stays partial (no forced jeweleryDetails)", () => {
        const parsed = updateProductSchema.parse({ price: 999 });
        expect(parsed.price).toBe(999);
    });
});

describe("jewelry category validation", () => {
    test("accepts vertical=JEWELERY", () => {
        const parsed = createCategorySchema.parse({
            title: "Necklace",
            image: "https://cdn.example.com/necklace.jpg",
            vertical: "JEWELERY",
        });
        expect(parsed.vertical).toBe("JEWELERY");
    });

    test("defaults vertical to CLOTHING", () => {
        const parsed = createCategorySchema.parse({
            title: "Shirts",
            image: "https://cdn.example.com/shirts.jpg",
        });
        expect(parsed.vertical).toBe("CLOTHING");
    });
});
