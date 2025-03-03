// Angular import
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

// project import
import { NavigationItem, NavigationItems } from '../navigation';

import { NavCollapseComponent } from './nav-collapse/nav-collapse.component';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { NavItemComponent } from './nav-item/nav-item.component';


// icon
import { IconService } from '@ant-design/icons-angular';
import {
  DashboardOutline,
  CreditCardOutline,
  LoginOutline,
  QuestionOutline,
  ChromeOutline,
  FontSizeOutline,
  ProfileOutline,
  BgColorsOutline,
  AntDesignOutline
} from '@ant-design/icons-angular/icons';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';
import { SharedModule } from 'src/shared/shared.module';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-nav-content',
  standalone: true,
  imports: [SharedModule, CommonModule, RouterModule, NavGroupComponent],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit, OnDestroy  {
  // public props
  @Output() NavCollapsedMob: EventEmitter<string> = new EventEmitter();

  navigations: NavigationItem[];

  // version
  title = 'Demo application for version numbering';
 // currentApplicationVersion = environment.appVersion;

  windowWidth = window.innerWidth;
  routerSubscription!: Subscription;

  // Constructor
  constructor(
    private location: Location,
    private locationStrategy: LocationStrategy,
    private iconService: IconService,
    private authService: AuthService, // Add AuthService to constructor
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.iconService.addIcon(
      ...[
        DashboardOutline,
        CreditCardOutline,
        FontSizeOutline,
        LoginOutline,
        ProfileOutline,
        BgColorsOutline,
        AntDesignOutline,
        ChromeOutline,
        QuestionOutline
      ]
    );
  }
  currentRoute: string = '';
  ngOnInit() {
    // Initialize navigation
    this.updateNavigation();

    // Update navigation on route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects; // Capture the current route
        this.updateNavigation();
        this.cdr.detectChanges(); 
      }
    });
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks & multiple event listeners
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateNavigation() {
    // Clone navigation items
    this.navigations = [...NavigationItems];

    // Highlight or modify navigation based on current route
    this.navigations = this.navigations.map((item) => ({
      ...item,
      active: item.link === this.currentRoute // Add 'active' state if the route matches
    }));
    
    

    console.log('Current Route:', this.currentRoute);
    console.log('Updated Navigations:', this.navigations);
  }
  setupResponsiveLayout() {
    if (this.windowWidth < 1025) {
      const navbar = document.querySelector('.coded-navbar') as HTMLDivElement;
      if (navbar) {
        navbar.classList.add('menupos-static');
      }
    }
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
     
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  navMob() {
    if (this.windowWidth < 1025 && document.querySelector('app-navigation.coded-navbar').classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }
}
