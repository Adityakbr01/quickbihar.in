import React from "react";
import { SocketListenerProvider } from "./SocketListenerProvider";

/** Deferred side-effect mount — renders nothing visible. */
export default function SocketListenerDeferred() {
  return (
    <SocketListenerProvider>
      <></>
    </SocketListenerProvider>
  );
}
