import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService, private prisma: PrismaService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is not set! Application cannot start securely.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenantAccess: { include: { tenant: true } },
        customRole: true
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      tenantAccess: user.tenantAccess,
      customRole: user.customRole,
      customRoleId: user.customRoleId,
    };
  }
}
