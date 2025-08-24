// top-alert.component.ts
import { Component, inject } from '@angular/core';
import { TopAlert, TopAlertService } from 'src/app/services/top-alert.service';

@Component({
  selector: 'app-top-alert',
  templateUrl: './top-alert.component.html',
  styleUrls: ['./top-alert.component.scss']
})
export class TopAlertComponent {
  svc = inject(TopAlertService);

  alerts() { return this.svc.alerts().filter(a => (a.ui ?? 'banner') === 'banner'); }

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
  role(a: TopAlert) { return (a.type === 'warn' || a.type === 'bad' || a.type === 'error') ? 'alert' : 'status'; }
  onAction(a: TopAlert, i: number, ev: Event) { ev.preventDefault(); a.actions?.[i]?.handler?.(); }
  trackById = (_: number, a: TopAlert) => a.id;
}
