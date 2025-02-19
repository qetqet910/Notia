// src/services/auth.ts
import { createHash } from 'crypto';

interface KeyAuth {
  generateKey(): string;
  verifyKey(key: string): boolean;
  backupKey(email: string, key: string): Promise<boolean>;
}

interface OAuthProvider {
  login(): Promise<{userId: string, token: string}>;
  bindKey(userId: string, key: string): Promise<boolean>;
}

export class AuthService {
  // 키 기반 인증 구현
  generateUserKey(): string {
    // 32자리 랜덤 키 생성 로직
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // 키 암호화 및 저장
  storeKey(key: string): void {
    const hashedKey = this.hashKey(key);
    localStorage.setItem('user_key', hashedKey);
  }
  
  // 키 해시 생성
  private hashKey(key: string): string {
    // 실제 해시 함수 사용 (클라이언트측)
    return key; // 실제로는 암호화 적용 필요
  }
  
  // OAuth 연동
  async connectOAuth(provider: 'github' | 'google', key: string): Promise<boolean> {
    // OAuth 연결 로직
    return true;
  }
}