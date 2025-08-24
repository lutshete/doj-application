import { PERMISSIONS, ROLES } from "src/app/services/auth.service";



export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';

  // routing
  url?: string;
  path?: string;
  external?: boolean;
  target?: boolean;
  exactMatch?: boolean;
  breadcrumbs?: boolean;

  // styling
  icon?: string;
  classes?: string;
  groupClasses?: string;
  description?: string;

  // tree
  children?: NavigationItem[];

  // runtime
  active?: boolean;
  expanded?: boolean;

  /** Show only if user has ANY of these roles (omit/empty => no role gating) */
  visibleForRoles?: (ROLES | string)[];

  /**
   * Show only if user can ANY of these permissions (enum or alias like 'applications:approve').
   * Uses authService.can() which already understands aliases.
   */
  requireAnyPerm?: (PERMISSIONS | string)[];
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: '',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Home',
        type: 'item',
        classes: 'nav-item',
        url: '/home',
        icon: 'dashboard',
        exactMatch: true,
        breadcrumbs: false
      },
   
    ]
  },

  {
    id: 'affidavit',
    title: 'Affidavit',
    type: 'group',
    icon: 'description',
    children: [
      {
        id: 'liquidators',
        title: 'Liquidators',
        type: 'item',
        classes: 'nav-item',
        url: '/liquidators',
        icon: 'gavel',
        breadcrumbs: false,
        visibleForRoles: [ROLES.LIQUIDATOR]
      }
    ]
  },

  {
    id: 'admin',
    title: 'Admin',
    type: 'group',
    icon: 'settings',
    // visible to Chief or Official (Admin‑Official also passes since role === OFFICIAL)
    visibleForRoles: [ROLES.CHIEF_MASTER, ROLES.OFFICIAL],
    children: [
      {
        id: 'adminPanel',
        title: 'Overview',
        type: 'item',
        classes: 'nav-item',
        url: '/admin',
        icon: 'dashboard_customize',
        exactMatch: true,
        // any review perm grants basic admin overview
        requireAnyPerm: [PERMISSIONS.APPLICATION_REVIEW],
        breadcrumbs: false
      },
      {
        id: 'users',
        title: 'Users',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/users',
        icon: 'people',
        exactMatch: true,
        // need user admin capabilities (Admin‑Official or Chief per your can())
        requireAnyPerm: [
          PERMISSIONS.USER_UPDATE_ROLE,
          PERMISSIONS.USERS_DEACTIVATE,
          PERMISSIONS.USERS_ACTIVATE
        ],
        breadcrumbs: false
      },
      {
        id: 'officials',
        title: 'Officials',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/officials',
        icon: 'badge',
        exactMatch: true,
        // reading/managing applications suffices here (adjust if needed)
        requireAnyPerm: [PERMISSIONS.APPLICATION_REVIEW],
        breadcrumbs: false
      },
      {
        id: 'windows',
        title: 'Windows',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/windows',
        icon: 'window',
        exactMatch: true,
        requireAnyPerm: [
          PERMISSIONS.WINDOW_CREATE,
          PERMISSIONS.WINDOW_UPDATE,
          PERMISSIONS.WINDOW_DELETE
        ],
        breadcrumbs: false
      },

 {
        id: 'assessments',
        title: 'Assessments',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/applications-review',
        icon: 'window',
        exactMatch: true,
        requireAnyPerm: [
          PERMISSIONS.WINDOW_CREATE,
          PERMISSIONS.WINDOW_UPDATE,
          PERMISSIONS.WINDOW_DELETE
        ],
        breadcrumbs: true
      },

      
 {
        id: 'examInvites',
        title: 'Exam Invites',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/exam-invites',
        icon: 'window',
        exactMatch: true,
        requireAnyPerm: [
          PERMISSIONS.WINDOW_CREATE,
          PERMISSIONS.WINDOW_UPDATE,
          PERMISSIONS.WINDOW_DELETE
        ],
        breadcrumbs: true
      }
      
    ]
  }
];
