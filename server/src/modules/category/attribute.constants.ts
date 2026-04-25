// attribute.constants.ts

export const CATEGORY_ATTRIBUTE_MAP: Record<string, any[]> = {
    // 👕 CLOTHING -> SHIRTS
    shirts: [
        { name: "fabric", type: "select", options: ["cotton", "linen", "polyester", "silk"], required: true, isFilterable: true, isVariant: false, group: "BASIC", searchable: true },
        { name: "fit", type: "select", options: ["slim", "regular", "loose", "tailored"], isFilterable: true, group: "BASIC" },
        { name: "size", type: "select", options: ["S", "M", "L", "XL", "XXL"], required: true, isVariant: true, group: "BASIC", showInList: true },
        { name: "color", type: "select", options: ["blue", "black", "white", "red", "green"], required: true, isVariant: true, group: "BASIC", showInList: true },
        { name: "pattern", type: "select", options: ["solid", "checked", "striped", "printed"], isFilterable: true, group: "ADVANCED" },
    ],

    // 👖 CLOTHING -> JEANS
    jeans: [
        { name: "fit", type: "select", options: ["skinny", "slim", "regular", "relaxed", "bootcut"], required: true, isFilterable: true, group: "BASIC" },
        { name: "waistSize", type: "select", options: ["28", "30", "32", "34", "36", "38", "40"], required: true, isVariant: true, group: "BASIC", showInList: true },
        { name: "length", type: "select", options: ["30", "32", "34", "36"], required: true, isVariant: true, group: "ADVANCED" },
        { name: "color", type: "select", options: ["blue", "black", "grey", "white"], required: true, isVariant: true, group: "BASIC", showInList: true },
    ],

    // 💍 JEWELRY -> RINGS
    rings: [
        { name: "material", type: "select", options: ["gold", "silver", "platinum", "diamond"], required: true, isFilterable: true, group: "BASIC" },
        { name: "purity", type: "select", options: ["14k", "18k", "22k", "24k"], isFilterable: true, group: "BASIC" },
        { name: "weight", type: "number", isVariant: true, group: "BASIC", showInList: true },
        { name: "gemstone", type: "text", group: "ADVANCED", searchable: true },
    ],

    // 🍔 FOOD -> BURGER
    burger: [
        { name: "vegType", type: "select", options: ["veg", "non-veg", "vegan"], required: true, isFilterable: true, group: "BASIC" },
        { name: "spicyLevel", type: "select", options: ["mild", "medium", "hot", "extra-hot"], isFilterable: true, group: "BASIC" },
        { name: "size", type: "select", options: ["regular", "large", "jumbo"], isVariant: true, group: "BASIC", showInList: true },
        { name: "crust", type: "select", options: ["normal", "whole-wheat"], group: "ADVANCED" },
    ],

    // 🍕 FOOD -> PIZZA
    pizza: [
        { name: "vegType", type: "select", options: ["veg", "non-veg"], required: true, isFilterable: true, group: "BASIC" },
        { name: "size", type: "select", options: ["regular", "medium", "large"], required: true, isVariant: true, group: "BASIC", showInList: true },
        { name: "crust", type: "select", options: ["new hand tossed", "cheese burst", "wheat thin crust", "classic hand tossed"], required: true, isVariant: true, group: "ADVANCED" },
        { name: "extraCheese", type: "boolean", group: "ADVANCED" },
    ]
};