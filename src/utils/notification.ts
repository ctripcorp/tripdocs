import notification from 'antd/lib/notification';

export function openNotification(key, str, duration = 0) {
  const args = {
    key,
    message: '',
    description: str,
    duration,
  };

  notification.open(args);
}
