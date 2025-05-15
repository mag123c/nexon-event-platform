export interface HashingPort {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashedText: string): Promise<boolean>;
}

export const HASHING_PORT = Symbol('HASHING_PORT');
