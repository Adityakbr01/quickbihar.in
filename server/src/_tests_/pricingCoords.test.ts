// Pickup-coordinate priority tests (pure unit tests — no DB).
// Regression: stale per-item logistics coords once priced a local Dumraon
// delivery as 99 km (Patna pin), paying the rider Rs 500 on a Rs 839 order.
import { describe, expect, test } from "bun:test";
import { resolvePickupCoords } from "../modules/common/order/orderPricing.service";

const STORE = { currentLocation: { type: "Point", coordinates: [84.1512183, 25.5840133] } };
const STALE_ITEM = [{ latitude: 25.5941, longitude: 85.1376 }];

describe("resolvePickupCoords", () => {
    test("prefers store location over stale item coords", () => {
        expect(resolvePickupCoords(STORE, STALE_ITEM)).toEqual({
            latitude: 25.5840133,
            longitude: 84.1512183,
        });
    });

    test("falls back to item coords when store has none", () => {
        expect(resolvePickupCoords({}, STALE_ITEM)).toEqual({
            latitude: 25.5941,
            longitude: 85.1376,
        });
    });

    test("returns null when nothing usable", () => {
        expect(resolvePickupCoords({}, [])).toBeNull();
        expect(resolvePickupCoords(null, [{ latitude: 0, longitude: 0 }])).toBeNull();
    });
});
