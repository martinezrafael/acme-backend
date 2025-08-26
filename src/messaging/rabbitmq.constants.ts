export const RABBITMQ_CLIENTS = {
  NOTIFICATIONS: 'NOTIFICATIONS_CLIENT',
} as const;

export const RABBITMQ_QUEUES = {
  NOTIFICATIONS: process.env.RABBITMQ_QUEUE || 'notifications_queue',
} as const;

export const RABBITMQ_PATTERNS = {
  NOTIFICATIONS: 'notifications',
  NOTIFICATIONS_INSPECT: 'notifications.inspect',
  NOTIFICATIONS_ANY: 'notifications.#',
} as const;
