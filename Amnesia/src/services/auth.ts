import { v4 as uuidv4 } from 'uuid';

// 사용자 인증 상태 타입
export interface AuthState {
  key: string | null;
  isAuthenticated: boolean;
  socialConnections: {
    github?: string;
    google?: string;
  };
}

// 소셜 로그인 제공자 유형
export type SocialProvider = 'github' | 'google';

export class AuthService {
  // 상수: 키 길이
  private readonly KEY_LENGTH = 16;
  private readonly KEY_STORAGE_KEY = 'reminder_auth_key';
  private readonly AUTH_STATE_KEY = 'reminder_auth_state';

  /**
   * 16자리 랜덤 키를 생성합니다
   * @returns 생성된 16자리 문자열
   */
  generateKey(): string {
    // 방법 1: 특정 문자셋으로 랜덤 문자열 생성
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // 암호학적으로 안전한 난수 생성 (웹 환경)
    const randomValues = new Uint32Array(this.KEY_LENGTH);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < this.KEY_LENGTH; i++) {
      // 각 바이트값을 문자셋 길이로 모듈로 연산하여 문자 선택
      result += charset[randomValues[i] % charset.length];
    }
    
    return result;
  }

  /**
   * 생성된 키를 안전하게 저장합니다
   * @param key 저장할 16자리 키
   */
  storeKey(key: string): void {
    // localStorage에 키 저장 (실제 구현에서는 암호화 권장)
    localStorage.setItem(this.KEY_STORAGE_KEY, key);
    
    // 인증 상태 업데이트
    this.updateAuthState({
      key,
      isAuthenticated: true,
      socialConnections: {}
    });
  }

  /**
   * 저장된 인증 키를 검증합니다
   * @returns 키가 유효한지 여부
   */
  verifyStoredKey(): boolean {
    const storedKey = localStorage.getItem(this.KEY_STORAGE_KEY);
    
    // 키가 존재하고 길이가 올바른지 확인
    return !!storedKey && storedKey.length === this.KEY_LENGTH;
  }

  /**
   * 현재 인증 상태를 반환합니다
   */
  getAuthState(): AuthState {
    const defaultState: AuthState = {
      key: null,
      isAuthenticated: false,
      socialConnections: {}
    };

    try {
      const storedState = localStorage.getItem(this.AUTH_STATE_KEY);
      if (!storedState) return defaultState;
      
      return JSON.parse(storedState) as AuthState;
    } catch (error) {
      console.error('Failed to parse auth state', error);
      return defaultState;
    }
  }

  /**
   * 인증 상태를 업데이트합니다
   */
  private updateAuthState(state: AuthState): void {
    localStorage.setItem(this.AUTH_STATE_KEY, JSON.stringify(state));
  }

  /**
   * GitHub OAuth 로그인을 처리합니다
   * @returns 로그인 성공 여부와 사용자 정보
   */
  async loginWithGithub(): Promise<{ success: boolean; userId?: string }> {
    try {
      // GitHub OAuth 로그인 팝업 열기
      const authWindow = window.open(
        'https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&scope=user',
        'GitHub Login',
        'width=600,height=700'
      );

      // 실제 구현에서는 OAuth 흐름 처리
      // 이 예제에서는 시뮬레이션
      return new Promise((resolve) => {
        setTimeout(() => {
          if (authWindow) authWindow.close();
          
          // 성공적인 로그인 시뮬레이션
          const mockUserId = `github_${uuidv4().substring(0, 8)}`;
          
          // 기존 Auth 상태 업데이트
          const currentState = this.getAuthState();
          this.updateAuthState({
            ...currentState,
            socialConnections: {
              ...currentState.socialConnections,
              github: mockUserId
            }
          });
          
          resolve({ success: true, userId: mockUserId });
        }, 1500);
      });
    } catch (error) {
      console.error('GitHub login failed:', error);
      return { success: false };
    }
  }

  /**
   * Google OAuth 로그인을 처리합니다
   * @returns 로그인 성공 여부와 사용자 정보
   */
  async loginWithGoogle(): Promise<{ success: boolean; userId?: string }> {
    try {
      // Google OAuth 로그인 팝업 열기
      const authWindow = window.open(
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&response_type=code&scope=profile email&redirect_uri=YOUR_REDIRECT_URI',
        'Google Login',
        'width=600,height=700'
      );

      // 실제 구현에서는 OAuth 흐름 처리
      // 이 예제에서는 시뮬레이션
      return new Promise((resolve) => {
        setTimeout(() => {
          if (authWindow) authWindow.close();
          
          // 성공적인 로그인 시뮬레이션
          const mockUserId = `google_${uuidv4().substring(0, 8)}`;
          
          // 기존 Auth 상태 업데이트
          const currentState = this.getAuthState();
          this.updateAuthState({
            ...currentState,
            socialConnections: {
              ...currentState.socialConnections,
              google: mockUserId
            }
          });
          
          resolve({ success: true, userId: mockUserId });
        }, 1500);
      });
    } catch (error) {
      console.error('Google login failed:', error);
      return { success: false };
    }
  }

  /**
   * 키와 소셜 계정을 연결합니다
   * @param provider 소셜 제공자 (github/google)
   * @param key 사용자 키
   */
  async bindKeyWithSocial(provider: SocialProvider, key: string): Promise<boolean> {
    try {
      // 실제 구현에서는 서버 API와 통신
      // 이 예제에서는 로컬에서만 처리
      const currentState = this.getAuthState();
      
      if (currentState.key !== key) {
        // 저장된 키와 제공된 키가 다름
        return false;
      }
      
      // 소셜 로그인 시뮬레이션
      const loginResult = provider === 'github' 
        ? await this.loginWithGithub()
        : await this.loginWithGoogle();
        
      return loginResult.success;
    } catch (error) {
      console.error(`Failed to bind key with ${provider}:`, error);
      return false;
    }
  }

  /**
   * 이메일을 통해 키를 백업합니다
   * @param email 백업 이메일 주소
   * @returns 백업 성공 여부
   */
  async backupKeyToEmail(email: string): Promise<boolean> {
    const currentState = this.getAuthState();
    if (!currentState.key) return false;
    
    try {
      // 실제 구현에서는 서버 API 호출
      console.log(`Backing up key to email: ${email}`);
      // 백업 성공 시뮬레이션
      return true;
    } catch (error) {
      console.error('Failed to backup key:', error);
      return false;
    }
  }

  /**
   * 로그아웃 처리
   */
  logout(): void {
    // 현재 인증 상태만 초기화 (키는 보존)
    const currentState = this.getAuthState();
    this.updateAuthState({
      ...currentState,
      isAuthenticated: false
    });
  }

  /**
   * 모든 인증 정보 삭제
   */
  clearAllAuthData(): void {
    localStorage.removeItem(this.KEY_STORAGE_KEY);
    localStorage.removeItem(this.AUTH_STATE_KEY);
  }
}

// 인증 훅에서 사용할 수 있는 싱글톤 인스턴스
export const authService = new AuthService();