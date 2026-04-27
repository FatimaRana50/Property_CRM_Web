'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function SocketInitializer({ userId, role }) {
  useEffect(() => {
    socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);

      // Join rooms based on role
      if (role === 'admin') {
        socket.emit('join-room', 'admin-room');
      }
      socket.emit('join-room', `agent-${userId}`);
      socket.emit('join-room', 'all-users');
    });

    socket.on('lead:created', (data) => {
      const event = new CustomEvent('crm:lead-created', { detail: data });
      window.dispatchEvent(event);

      // Toast notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Lead Created', {
          body: data.message,
          icon: '/favicon.ico',
        });
      }
    });

    socket.on('lead:updated', (data) => {
      const event = new CustomEvent('crm:lead-updated', { detail: data });
      window.dispatchEvent(event);
    });

    socket.on('lead:assigned', (data) => {
      const event = new CustomEvent('crm:lead-assigned', { detail: data });
      window.dispatchEvent(event);
    });

    socket.on('lead:deleted', (data) => {
      const event = new CustomEvent('crm:lead-deleted', { detail: data });
      window.dispatchEvent(event);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId, role]);

  return null;
}

export { socket };
