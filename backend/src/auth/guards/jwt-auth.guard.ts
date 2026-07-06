import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - Protects routes that require authentication.
 * Validates the Bearer JWT token in the Authorization header.
 * On success, populates request.user with the decoded JWT payload.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
