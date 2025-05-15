import { HashingPort } from '@app/auth/domain/ports/hasing.port';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class Argon2Service implements HashingPort {
  private readonly argon2Options: argon2.Options = {
    type: argon2.argon2id,
  };

  async hash(plainText: string): Promise<string> {
    try {
      return await argon2.hash(plainText, this.argon2Options);
    } catch (err) {
      console.error('Argon2 hashing error:', err);
      throw new Error('Error hashing password');
    }
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedText, plainText, this.argon2Options);
    } catch (err) {
      return false;
    }
  }
}
