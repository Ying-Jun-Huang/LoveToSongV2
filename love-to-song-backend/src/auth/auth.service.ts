// file: love-to-song-backend/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Validate user credentials (for login)
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      // Password is correct
      const { password, ...result } = user;
      return result; // return user data without password
    }
    return null;
  }

  // Generate a JWT for a user (called after validation)
  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    // sign the payload into a JWT string
    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}
