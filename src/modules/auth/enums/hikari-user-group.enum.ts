export enum HikariUserGroup {
  USER = 'user',
  CREATOR = 'creator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superAdmin',
}

export const ROLE_HIERARCHY: Record<HikariUserGroup, number> = {
  [HikariUserGroup.USER]: 1,
  [HikariUserGroup.CREATOR]: 2,
  [HikariUserGroup.ADMIN]: 3,
  [HikariUserGroup.SUPER_ADMIN]: 4,
}
