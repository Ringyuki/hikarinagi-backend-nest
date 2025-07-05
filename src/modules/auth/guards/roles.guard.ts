import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { HikariUserGroup, ROLE_HIERARCHY } from '../enums/hikari-user-group.enum'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { RequestWithUser } from '../interfaces/request-with-user.interface'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<HikariUserGroup[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const { user }: RequestWithUser = context.switchToHttp().getRequest()
    const userRole = user.hikariUserGroup as HikariUserGroup
    const userRoleIndex = ROLE_HIERARCHY[userRole]

    return requiredRoles.some(role => ROLE_HIERARCHY[role] <= userRoleIndex)
  }
}
