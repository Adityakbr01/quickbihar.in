/**
 * Centralized Socket Event Names
 * Consistent between Backend and Frontend
 */
export const SocketEvents = {
    // Orders (User Side)
    ORDER_STATUS_UPDATE: "order_status_update", // Emitted to specific user

    // Orders (Admin Side)
    NEW_ORDER: "new_order",           // Emitted to admins room
    ORDER_CONFIRMED: "order_confirmed", // Emitted to admins room
    
    // Inventory (Global)
    STOCK_UPDATE: "stock_update",     // Broadcast to all users
};
