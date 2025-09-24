import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || configService.get('JWT_SECRET') || 'fallback-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);
      
      // Check if user is active
      if (!user.isActive) {
        return null; // This will cause authentication to fail
      }
      
      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error) {
      // User not found (deleted) - return null to fail authentication
      return null;
    }
  }
}
