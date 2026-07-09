import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Generates access and refresh JWT tokens.
   */
  private async generateTokens(
    userId: number,
    email: string,
    role: Role,
    companyId: number | null,
  ) {
    const payload = { sub: userId, email, role, companyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET as string,
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET as string,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      }),
    ]);

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefresh },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Login with email/password.
   */
  async login(dto: LoginDto) {
    const emailNormalized = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
      include: {
        customRole: { select: { id: true, permissions: true } },
        tenantAccess: {
          select: { 
            tenantId: true, 
            role: true, 
            customRoleId: true,
            tenant: { select: { name: true } },
            customRole: { select: { permissions: true } }
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Votre compte a été désactivé. Veuillez contacter un administrateur.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.companyId,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // Global role
        customRoleId: user.customRoleId,
        customRole: user.customRole,
        companyId: user.companyId,
        avatar: user.avatar,
        tenantAccess: user.tenantAccess, // Array of { tenantId, role, customRoleId, customRole }
      },
      ...tokens,
    };
  }

  /**
   * Register a new user.
   */
  async register(dto: RegisterDto) {
    const emailNormalized = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: emailNormalized,
        password: hashedPassword,
        role: Role.TECHNICIEN, // Default role
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.companyId,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh tokens using a valid refresh token.
   */
  async refreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET as string });
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    const userId = payload.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Accès refusé');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedException('Token invalide');
    }

    return this.generateTokens(user.id, user.email, user.role, user.companyId);
  }

  /**
   * Logout — clear refresh token from DB.
   */
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Déconnexion réussie' };
  }

  /**
   * Get profile of the authenticated user.
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        companyId: true,
        company: { select: { id: true, name: true } },
        createdAt: true,
        tenantAccess: { select: { tenantId: true, role: true, tenant: { select: { name: true } } } },
      },
    });

    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
    return user;
  }
}
