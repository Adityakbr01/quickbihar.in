import React, { Suspense, lazy } from "react";

// Socket.IO is pure side-effect wiring (zustand stores + query client, no
// React context consumed by the tree), so it mounts lazily as a sibling
// instead of wrapping first paint. Live stock/order updates attach a beat
// after entry — zero visual or behavioral change.
const SocketListeners = lazy(() => import("./SocketListenerDeferred"));

export function SocketListenerMount() {
  return (
    <Suspense fallback={null}>
      <SocketListeners />
    </Suspense>
  );
}

export default SocketListenerMount;
