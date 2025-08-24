// nav-content.component.ts
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

import { NavigationItem, NavigationItems } from '../navigation';
import { NavGroupComponent } from './nav-group/nav-group.component';

import { IconService } from '@ant-design/icons-angular';
import {
  DashboardOutline, CreditCardOutline, LoginOutline, QuestionOutline,
  ChromeOutline, FontSizeOutline, ProfileOutline, BgColorsOutline, AntDesignOutline
} from '@ant-design/icons-angular/icons';

import { AuthService, ROLES } from 'src/app/services/auth.service';
import { Subscription, combineLatest, startWith } from 'rxjs';
import { SharedModule } from 'src/shared/shared.module';
import { NavItemComponent } from './nav-item/nav-item.component';
import { NavCollapseComponent } from './nav-collapse/nav-collapse.component';

@Component({
  selector: 'app-nav-content',
  standalone: true,
  imports: [SharedModule, CommonModule, RouterModule, NavGroupComponent, NavItemComponent,NavCollapseComponent    ],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit, OnDestroy  {
  @Output() NavCollapsedMob: EventEmitter<string> = new EventEmitter();

  navigations: NavigationItem[] = [];
  windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;

  private subs = new Subscription();
  private currentUrl = '';

  constructor(
    private location: Location,
    private iconService: IconService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.iconService.addIcon(
      DashboardOutline, CreditCardOutline, FontSizeOutline, LoginOutline,
      ProfileOutline, BgColorsOutline, AntDesignOutline, ChromeOutline, QuestionOutline
    );
  }

  ngOnInit() {
    // react to both user & route changes (seed with current values)
    const route$ = this.router.events.pipe(startWith(new NavigationEnd(0, this.router.url, this.router.url)));
    const user$  = this.authService.user$.pipe(startWith(this.authService.user));

    this.subs.add(
      combineLatest([user$, route$]).subscribe(([user, evt]) => {
        if (evt instanceof NavigationEnd) {
          this.currentUrl = evt.urlAfterRedirects || evt.url || '';
        } else if (!this.currentUrl) {
          this.currentUrl = this.router.url || this.location.path() || '';
        }
        this.rebuildNav();
        this.cdr.detectChanges();
      })
    );

    // initial build (in case combineLatest fires after view init)
    this.currentUrl = this.router.url || this.location.path() || '';
    this.rebuildNav();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /** For @for(track ...) in template */
  trackById = (_: number, item: NavigationItem) => item?.id ?? _;

  private rebuildNav() {
    const cloned = deepClone(NavigationItems);
    const filtered = this.filterByVisibility(cloned);
    this.markActiveAndExpanded(filtered, this.currentUrl);
    this.navigations = filtered;
  }

  /** Gate by roles and permissions using AuthService */
  private filterByVisibility(items: NavigationItem[]): NavigationItem[] {
    const user = this.authService.user;

    const hasAnyRole = (need?: (ROLES | string)[]) => {
      if (!need || need.length === 0) return true;
      const role = user?.role;
      return !!role && need.includes(role as ROLES);
    };

    const hasAnyPerm = (need?: (string)[]) => {
      if (!need || need.length === 0) return true;
      return need.some(aliasOrEnum => this.authService.can(aliasOrEnum as any));
    };

    const walk = (arr: NavigationItem[]): NavigationItem[] =>
      arr
        .filter(i => hasAnyRole(i.visibleForRoles) && hasAnyPerm(i.requireAnyPerm))
        .map(i => ({
          ...i,
          children: i.children ? walk(i.children) : undefined
        }))
        // hide empty groups
        .filter(i => i.type !== 'group' || (i.children && i.children.length));

    return walk(items);
  }

  /** Compute active/expanded flags recursively */
  private markActiveAndExpanded(items: NavigationItem[], current: string): boolean {
    let any = false;

    for (const item of items) {
      const url = item.url ?? item.path ?? '';
      const selfActive = item.type === 'item' && url
        ? (item.exactMatch ? current === url : current.startsWith(url))
        : false;

      const childActive = item.children?.length
        ? this.markActiveAndExpanded(item.children, current)
        : false;

      item.active = selfActive || childActive;
      item.expanded = !!childActive;

      any = any || item.active;
    }
    return any;
  }

  // Optional: keep mobile toggle
  navMob() {
    const el = document.querySelector('app-navigation.coded-navbar');
    if (this.windowWidth < 1025 && el?.classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }

  // Add inside NavContentComponent
fireOutClick(): void {
  // If you just need to satisfy the template:
  // no-op

  // Or collapse the mobile nav on outside click:
  const el = document.querySelector('app-navigation.coded-navbar');
  if (this.windowWidth < 1025 && el?.classList.contains('mob-open')) {
    this.NavCollapsedMob.emit();
  }
}

}

/** -------- utils -------- */
function deepClone<T>(v: T): T {
  // prefer structuredClone when available
  if (typeof (globalThis as any).structuredClone === 'function') {
    return (globalThis as any).structuredClone(v);
  }
  return JSON.parse(JSON.stringify(v));
}
