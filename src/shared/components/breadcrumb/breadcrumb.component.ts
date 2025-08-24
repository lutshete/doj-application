// breadcrumb.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { IconModule, IconService } from '@ant-design/icons-angular';
import { GlobalOutline, NodeExpandOutline } from '@ant-design/icons-angular/icons';
import { NavigationItem, NavigationItems } from 'src/app/admin-layout/navigation/navigation';

interface TitleCrumb {
  url: string | false;
  title: string;
  breadcrumbs: unknown;
  type: 'item' | 'collapse' | 'group';
  description?: string;
  path?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, IconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {
  @Input() type: string = 'theme1';
  @Input() dashboard = true;
  @Input() Component = false;

  navigations: NavigationItem[] = NavigationItems;
  navigationList: TitleCrumb[] = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private iconService: IconService
  ) {
    this.iconService.addIcon(GlobalOutline, NodeExpandOutline);
    // Build once for the initial URL
    this.rebuild(this.router.url);

    // Rebuild on navigation
    this.router.events.subscribe((evt: Event) => {
      if (evt instanceof NavigationEnd) {
        const url = evt.urlAfterRedirects || evt.url || '';
        this.rebuild(url);
      }
    });
  }

  private rebuild(activeUrl: string) {
    const crumbs = this.filterNavigation(this.navigations, activeUrl);
    this.navigationList = crumbs;

    const title = crumbs[crumbs.length - 1]?.title || 'Welcome';
    this.titleService.setTitle(`${title} | DOJ Liquidator`);
  }

  private filterNavigation(navItems: NavigationItem[], activeUrl: string): TitleCrumb[] {
    for (const navItem of navItems) {
      // Resolve the item URL we compare against
      const itemUrl = (navItem.url ?? navItem.path ?? '') as string;

      // Leaf item matching: exact when item.exactMatch, else prefix match
      const isItemMatch =
        navItem.type === 'item' &&
        itemUrl &&
        (navItem.exactMatch ? activeUrl === itemUrl : activeUrl.startsWith(itemUrl));

      if (isItemMatch) {
        return [
          {
            url: itemUrl || false,
            title: navItem.title,
            description: navItem.description,
            path: navItem.path,
            breadcrumbs: navItem.breadcrumbs ?? true,
            type: navItem.type
          }
        ];
      }

      // Descend into groups/collapses
      if ((navItem.type === 'group' || navItem.type === 'collapse') && navItem.children?.length) {
        const childTrail = this.filterNavigation(navItem.children, activeUrl);
        if (childTrail.length) {
          childTrail.unshift({
            url: itemUrl || false,
            title: navItem.title,
            description: navItem.description,
            path: navItem.path,
            breadcrumbs: navItem.breadcrumbs ?? true,
            type: navItem.type
          });
          return childTrail;
        }
      }
    }
    return [];
  }
}
