// src/app/services/notify.service.ts
import { Injectable, inject } from '@angular/core';
import { TopAlertService } from './top-alert.service';

type NotifyOpts = {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
  requireInteraction?: boolean; // keep on screen until dismissed
  data?: any;
  type?: 'ok'|'warn'|'bad'|'info'|'error'|'brand'; // fallback toast type
  timeout?: number; // fallback toast timeout
};

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private alerts = inject(TopAlertService);

  /** Ask once, ideally on a user gesture (click). */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission !== 'default') return Notification.permission;
    return await Notification.requestPermission();
  }

  /** Try to show a system notification, else fall back to in-app toast. */
  async notify(opts: NotifyOpts): Promise<boolean> {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(opts.title, {
            body: opts.body,
            icon: opts.icon,
            tag: opts.tag,
            silent: opts.silent,
            requireInteraction: opts.requireInteraction,
            data: opts.data,
          });
          return true;
        }
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(opts.title, {
              body: opts.body,
              icon: opts.icon,
              tag: opts.tag,
              silent: opts.silent,
              requireInteraction: opts.requireInteraction,
              data: opts.data,
            });
            return true;
          }
        }
      }
    } catch {
      // ignore and fall back
    }

    // Fallback toast (in-app)
    const msg = opts.body ? `${opts.title} — ${opts.body}` : opts.title;
    this.alerts.showToast?.(msg, { type: opts.type ?? 'info', timeout: opts.timeout ?? 5000 })
      ?? this.alerts.show({ message: msg, type: opts.type ?? 'info', timeout: opts.timeout ?? 5000, ui: 'toast' as any });
    return false;
  }
}
