/**
 * Socket.IO singleton for real-time delivery events.
 * Connect after login; disconnect on logout.
 */
import { io, Socket } from 'socket.io-client'
import { getAccessToken } from './storage'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3001'

let socket: Socket | null = null

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket

  const token = await getAccessToken()

  socket = io(WS_URL, {
    path: '/ws',
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('[socket] connected', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err.message)
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function getSocket(): Socket | null {
  return socket
}

// ── Room helpers ───────────────────────────────────────────────────────────────

export function joinDeliveryRoom(deliveryId: string) {
  socket?.emit('join:delivery', deliveryId)
}

export function leaveDeliveryRoom(deliveryId: string) {
  socket?.emit('leave:delivery', deliveryId)
}

export function joinCourierRoom(userId: string) {
  socket?.emit('join:courier', userId)
}

export function leaveCourierRoom(userId: string) {
  socket?.emit('leave:courier', userId)
}

/** Courier sends a GPS update */
export function emitLocationUpdate(lat: number, lng: number, deliveryId?: string) {
  socket?.emit('location:update', { lat, lng, deliveryId })
}
