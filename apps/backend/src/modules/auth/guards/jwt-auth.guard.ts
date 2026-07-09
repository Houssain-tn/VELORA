import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch (error) {
      console.error('🛡️ AUTH GUARD ERROR:', error.message || error);
      if (error instanceof UnauthorizedException) throw error;

      // If it's not a standard Unauthorized, it's the 500 we are looking for!
      console.error('🚨 TRACE:', error.stack);
      throw new InternalServerErrorException(
        'Erreur au niveau du Guard: ' + error.message,
      );
    }
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.warn('🔑 Auth failed:', info?.message || 'No user found');
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
