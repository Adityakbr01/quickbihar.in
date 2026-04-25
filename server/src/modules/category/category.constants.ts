// category.constants.ts

export const CATEGORY_TREE = [
    {
        name: "Clothing",
        slug: "clothing",
        children: [
            {
                name: "Men",
                slug: "men",
                children: [
                    { name: "Shirts", slug: "shirts" },
                    { name: "T-Shirts", slug: "tshirts" },
                    { name: "Jeans", slug: "jeans" }
                ]
            },
            {
                name: "Women",
                slug: "women",
                children: [
                    { name: "Dresses", slug: "dresses" },
                    { name: "Tops", slug: "tops" }
                ]
            }
        ]
    },
    {
        name: "Jewelry",
        slug: "jewelry",
        children: [
            {
                name: "Gold",
                slug: "gold",
                children: [
                    { name: "Rings", slug: "rings" },
                    { name: "Necklaces", slug: "necklaces" }
                ]
            }
        ]
    },
    {
        name: "Food",
        slug: "food",
        children: [
            {
                name: "Fast Food",
                slug: "fast-food",
                children: [
                    { name: "Burger", slug: "burger" },
                    { name: "Pizza", slug: "pizza" }
                ]
            }
        ]
    }
];