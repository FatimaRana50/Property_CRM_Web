/**
 * Socket.io helper to emit events from API routes
 * The global.io is set in server.js
 */

export function emitToRoom(room, event, data) {
  if (global.io) {
    global.io.to(room).emit(event, data);
  }
}

export function emitToAll(event, data) {
  if (global.io) {
    global.io.emit(event, data);
  }
}

export const SOCKET_EVENTS = {
  LEAD_CREATED: 'lead:created',
  LEAD_UPDATED: 'lead:updated',
  LEAD_ASSIGNED: 'lead:assigned',
  LEAD_DELETED: 'lead:deleted',
  PRIORITY_CHANGED: 'lead:priority_changed',
};

export const ROOMS = {
  ADMIN: 'admin-room',
  ALL: 'all-users',
  agent: (id) => `agent-${id}`,
};
