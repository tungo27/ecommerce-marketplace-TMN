import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * RolesGuard - Must be used AFTER JwtAuthGuard.
 * Reads the 'roles' metadata set by @Roles() decorator and checks
 * whether the authenticated user's role is included in the allowed list.
 * Throws 403 Forbidden if the user does not have the required role.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from route metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, the route is public - allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract user from request (populated by JwtAuthGuard via JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
