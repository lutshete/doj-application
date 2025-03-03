export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
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
        breadcrumbs: false
      },
      {
        id: 'register',
        title: 'Track',
        type: 'item',
        classes: 'nav-item',
        url: '/track',
        icon: 'profile',
        target: true,
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'AFFIDAVIT',
    title: 'AFFIDAVIT ',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'LIQUIDATORS', 
        title: 'Liquidators',
        type: 'item',
        classes: 'nav-item',
        url: '/liquidators',
        icon: 'login',
        target: true,
        breadcrumbs: false
      }
      
    ]
  },
  
];
