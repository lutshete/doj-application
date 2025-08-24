// toast-tray.component.ts
import { Component, inject } from '@angular/core';
import { TopAlertService, TopAlert } from 'src/app/services/top-alert.service';

@Component({
  selector: 'app-toast-tray',
  template: `
  <div class="toast-tray" aria-live="polite" aria-atomic="true">
    <div
      *ngFor="let t of toasts(); trackBy: trackById"
      class="toast"
      [class.ok]="t.type==='ok'"
      [class.warn]="t.type==='warn'"
      [class.bad]="t.type==='bad' || t.type==='error'"
      [class.info]="t.type==='info' || t.type==='brand'"
      role="status"
    >
      <span class="material-icons toast__icon">{{ icon(t) }}</span>
      <div class="toast__msg" [innerText]="t.message"></div>
      <button class="toast__close" (click)="svc.dismiss(t.id)" aria-label="Dismiss"><span class="material-icons">close</span></button>
    </div>
  </div>
  `,
  styles: [`
  .toast-tray{
    position: fixed; right: 16px; bottom: 16px;
    display: flex; flex-direction: column; gap: 8px;
    z-index: 5000; pointer-events: none;
  }
  .toast{
    pointer-events: auto;
    display:flex; align-items:center; gap:8px;
    min-width: 260px; max-width: 380px;
    padding:10px 12px; border-radius:10px; box-shadow: 0 10px 24px rgba(0,0,0,.12);
    background:#111827; color:#fff; opacity:.98;
    transform: translateY(8px); animation: toast-in .18s ease-out forwards;
  }
  @keyframes toast-in { to { transform: translateY(0); } }
  .toast.ok   { background:#065f46; } /* green-900 */
  .toast.warn { background:#92400e; } /* amber-900 */
  .toast.bad  { background:#7f1d1d; } /* red-900 */
  .toast.info { background:#1f2937; } /* gray-800 */
  .toast__icon{ font-size:18px; }
  .toast__msg{ flex:1; font-size:14px; }
  .toast__close{ background:transparent; border:none; color:#fff; opacity:.8; cursor:pointer; }
  .toast__close:hover{ opacity:1; }
  `]
})
export class ToastTrayComponent {
  svc = inject(TopAlertService);
  toasts() { return this.svc.alerts().filter(a => a.ui === 'toast'); }
  trackById = (_: number, a: TopAlert) => a.id;
  icon(a: TopAlert) {
    switch (a.type) {
      case 'ok': return 'check_circle';
      case 'warn': return 'warning';
      case 'bad':
      case 'error': return 'error';
      case 'brand': return 'campaign';
      default: return 'info';
    }
  }
}
