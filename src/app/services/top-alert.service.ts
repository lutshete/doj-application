// services/top-alert.service.ts
import { Injectable, signal } from '@angular/core';

export type TopAlertType = 'ok' | 'warn' | 'bad' | 'info' | 'error' | 'brand';
export type TopAlertUI   = 'toast' | 'banner';

export interface TopAlert {
  id: string;
  type: TopAlertType;
  message: string;
  ui?: TopAlertUI;          // <- NEW: toast (overlay) or banner (full-width)
  dismissible?: boolean;
  timeout?: number;         // ms; 0/undefined = sticky
  actions?: Array<{ label: string; handler?: () => void; href?: string; target?: string }>;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class TopAlertService {
  private _alerts = signal<TopAlert[]>([]);
  alerts = this._alerts.asReadonly();

  show(opts: Omit<Partial<TopAlert>, 'id' | 'createdAt'> & { message: string }): string {
    const id = (globalThis as any)?.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const alert: TopAlert = {
      id,
      type: opts.type ?? 'info',
      message: opts.message,
      ui: opts.ui ?? 'toast',           // default to toast overlay
      dismissible: opts.dismissible ?? true,
      timeout: opts.timeout,
      actions: opts.actions,
      createdAt: new Date(),
    };
    this._alerts.update(list => [alert, ...list]);
    if (alert.timeout && alert.timeout > 0) setTimeout(() => this.dismiss(id), alert.timeout);
    return id;
  }

  /** Convenience */
  showToast(message: string, o?: Partial<Omit<TopAlert,'id'|'createdAt'|'message'>>) {
    return this.show({ message, ...o, ui: 'toast' });
  }

  dismiss(id: string) { this._alerts.update(list => list.filter(a => a.id !== id)); }
  clear() { this._alerts.set([]); }

  async confirm(message: string, opts?: { type?: TopAlertType; okLabel?: string; cancelLabel?: string; timeout?: number }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let id = '';
      const onCancel = () => { this.dismiss(id); resolve(false); };
      const onOk     = () => { this.dismiss(id); resolve(true);  };
      id = this.show({
        type: opts?.type ?? 'warn',
        message,
        ui: 'toast',
        timeout: opts?.timeout ?? 0,
        actions: [
          { label: opts?.cancelLabel ?? 'Cancel',       handler: onCancel },
          { label: opts?.okLabel ?? 'Yes, continue',    handler: onOk },
        ],
      });
    });
  }
}
