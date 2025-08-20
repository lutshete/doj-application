// Keep these aligned with server auth/roles.js + policy.js
export enum PERMISSIONS {
  APPLICATION_REVIEW = 'APPLICATION_REVIEW',
  MEETING_MANAGE = 'MEETING_MANAGE',
  WINDOW_CREATE = 'WINDOW_CREATE',
  WINDOW_UPDATE = 'WINDOW_UPDATE',
  WINDOW_DELETE = 'WINDOW_DELETE',
  USER_DISABLE_LIQUIDATOR = 'USER_DISABLE_LIQUIDATOR',
  USER_UPDATE_ROLE = 'USER_UPDATE_ROLE',
  // Optional: explicit activate/deactivate if you use them as enums on server
  USERS_DEACTIVATE = 'USERS_DEACTIVATE',
  USERS_ACTIVATE = 'USERS_ACTIVATE',
}

export const PERM_ALIASES: Record<string, PERMISSIONS> = {
  // Applications
  'applications:list': PERMISSIONS.APPLICATION_REVIEW,
  'applications:read': PERMISSIONS.APPLICATION_REVIEW,
  'applications:write': PERMISSIONS.APPLICATION_REVIEW,
  'applications:review': PERMISSIONS.APPLICATION_REVIEW,

  // Approvals
  'applications:approve': PERMISSIONS.APPLICATION_REVIEW,
  'applications:reject': PERMISSIONS.APPLICATION_REVIEW,

  // Meetings
  'meetings:manage': PERMISSIONS.MEETING_MANAGE,

  // Windows
  'windows:create': PERMISSIONS.WINDOW_CREATE,
  'windows:update': PERMISSIONS.WINDOW_UPDATE,
  'windows:delete': PERMISSIONS.WINDOW_DELETE,

  // Users
  'users:disable-liquidator': PERMISSIONS.USER_DISABLE_LIQUIDATOR,
  'users:update-role': PERMISSIONS.USER_UPDATE_ROLE,

  // If you’ve defined these in policy.can():
  'users:deactivate': PERMISSIONS.USERS_DEACTIVATE,
  'users:activate': PERMISSIONS.USERS_ACTIVATE,
};

export type PermOrAlias = PERMISSIONS | keyof typeof PERM_ALIASES;

export enum ROLES {
  LIQUIDATOR = 'LIQUIDATOR',
  OFFICIAL = 'OFFICIAL',
  CHIEF_MASTER = 'CHIEF_MASTER',
}
