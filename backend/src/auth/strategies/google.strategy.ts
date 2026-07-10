import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const state = request.query.state;
      const tokenPayload = await this.authService.validateGoogleUser(
        profile,
        state,
      );
      done(null, tokenPayload);
    } catch (error) {
      done(error, false);
    }
  }
}
