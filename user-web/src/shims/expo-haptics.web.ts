import { WebHaptics } from 'web-haptics';

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

let hapticsInstance: WebHaptics | null = null;

const getHaptics = (): WebHaptics | null => {
  if (typeof window !== 'undefined' && !hapticsInstance) {
    try {
      hapticsInstance = new WebHaptics();
    } catch (e) {
      console.warn('Failed to initialize web-haptics:', e);
    }
  }
  return hapticsInstance;
};

export async function impactAsync(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium): Promise<void> {
  const h = getHaptics();
  if (!h) return;

  try {
    switch (style) {
      case ImpactFeedbackStyle.Light:
        await h.trigger('light');
        break;
      case ImpactFeedbackStyle.Medium:
      default:
        await h.trigger('medium');
        break;
      case ImpactFeedbackStyle.Heavy:
        await h.trigger('heavy');
        break;
    }
  } catch (e) {
    console.warn('Haptics trigger failed:', e);
  }
}

export async function notificationAsync(type: NotificationFeedbackType = NotificationFeedbackType.Success): Promise<void> {
  const h = getHaptics();
  if (!h) return;

  try {
    switch (type) {
      case NotificationFeedbackType.Success:
      default:
        await h.trigger('success');
        break;
      case NotificationFeedbackType.Warning:
        await h.trigger('warning');
        break;
      case NotificationFeedbackType.Error:
        await h.trigger('error');
        break;
    }
  } catch (e) {
    console.warn('Haptics trigger failed:', e);
  }
}

export async function selectionAsync(): Promise<void> {
  const h = getHaptics();
  if (!h) return;

  try {
    await h.trigger('selection');
  } catch (e) {
    console.warn('Haptics trigger failed:', e);
  }
}
