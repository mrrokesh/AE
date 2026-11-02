/** Browser Notification wrapper. No-ops unless permission was granted. */
export const notificationsSupported = () => typeof Notification !== 'undefined'
export const notificationPermission = () =>
  notificationsSupported() ? Notification.permission : 'denied'

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return Notification.requestPermission()
}

export function showNotification(title: string, body: string, tag?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag, icon: '/favicon.ico' })
  } catch {
    /* some mobile browsers require a service worker */
  }
}
