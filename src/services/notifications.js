import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleLocalNotification(reminder) {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const triggerDate = new Date(reminder.remind_at);
  if (isNaN(triggerDate.getTime()) || triggerDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Nolvi',
        body: reminder.title,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (err) {
    console.log('scheduleLocal ERROR:', err.message);
    return null;
  }
}

export async function cancelLocalNotification(notificationId) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch (err) {
    console.log('Push token error:', err.message);
    return null;
  }
}
