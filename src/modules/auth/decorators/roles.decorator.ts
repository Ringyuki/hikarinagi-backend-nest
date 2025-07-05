import { SetMetadata } from '@nestjs/common'
import { HikariUserGroup } from '../enums/hikari-user-group.enum'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: HikariUserGroup[]) => SetMetadata(ROLES_KEY, roles)
