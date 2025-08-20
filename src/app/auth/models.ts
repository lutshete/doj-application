import { ROLES } from './permissions';

export interface OfficialFlags {
  isAdminOfficial?: boolean;
  [k: string]: any;
}

export interface JwtUser {
  id: string;
  email: string;
  role: ROLES | string;
  firstName?: string;
  lastName?: string;
  officialFlags?: OfficialFlags;
  // you may add others if your JWT includes them
}

export interface MeResponse extends JwtUser {}
