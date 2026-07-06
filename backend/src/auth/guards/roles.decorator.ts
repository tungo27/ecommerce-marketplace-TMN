import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Custom decorator to assign required roles to a route handler.
 * Usage: @Roles('ADMIN', 'SELLER')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
