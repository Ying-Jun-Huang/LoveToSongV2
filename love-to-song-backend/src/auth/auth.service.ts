// file: love-to-song-backend/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Validate user credentials (for login)
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailWithRoles(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      // Password is correct
      const { password, ...result } = user;
      return result; // return user data without password
    }
    return null;
  }

  // Generate a JWT for a user (called after validation)
  async login(user: any) {
    // 獲取用戶的主要角色
    const primaryRole = user.userRoles && user.userRoles.length > 0 
      ? user.userRoles[0].role.name 
      : 'GUEST';
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: primaryRole
    };
    
    // sign the payload into a JWT string
    return {
      token: this.jwtService.sign(payload),
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName,
        role: primaryRole
      },
    };
  }
}
