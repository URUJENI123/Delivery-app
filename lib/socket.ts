/**
 * DEV STUB — WebSocket is not connected in dev mode.
 * All socket methods are no-ops.
 * Replace with real socket.io client when integrating backend.
 */

const noopSocket = {
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => noopSocket,
  connect: () => noopSocket,
  disconnect: () => noopSocket,
  id: 'dev-socket-stub',
  connected: false,
} as any;

export function getSocket() {
  return noopSocket;
}

export function disconnectSocket() {}
