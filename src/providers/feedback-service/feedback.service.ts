import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FeedbackService {

  async success() {
    // A single firm "thud" for a valid scan
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async duplicate() {
    // A double-pulse warning pattern
    await Haptics.notification({ type: NotificationType.Warning });
  }

  async error() {
    // A heavy error vibration
    await Haptics.notification({ type: NotificationType.Error });
  }
}
