export const SocketEvents = {
  ORDER_STATUS_UPDATE: "order_status_update",
  NEW_ORDER: "new_order",
  ORDER_CONFIRMED: "order_confirmed",
  STOCK_UPDATE: "stock_update",
  JOIN_ORDER_ROOM: "join_order_room",
  LEAVE_ORDER_ROOM: "leave_order_room",
  JOIN_SUBORDER_ROOM: "join_suborder_room",
  LEAVE_SUBORDER_ROOM: "leave_suborder_room",
  UPDATE_DELIVERY_LOCATION: "update_delivery_location",
  DELIVERY_LOCATION_UPDATED: "delivery_location_updated",
  FULFILLMENT_EVENT: "fulfillment_event",
  RIDER_JOB_OFFER: "rider_job_offer",
  RIDER_OFFER_CLOSED: "rider_offer_closed",
  SUBORDER_STATUS_UPDATE: "suborder_status_update",
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
