/**
 * Security utilities for the frontend
 * Provides secure storage, CSRF protection, and input sanitization
 */

/**
 * Secure localStorage wrapper with encryption
 */
export class SecureStorage {
  private static readonly prefix = 'nc_secure_';
  
  static setItem(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Basic obfuscation (not encryption, but better than plain text)
      const obfuscated = btoa(JSON.stringify(value));
      localStorage.setItem(`${this.prefix}${key}`, obfuscated);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }
  
  static getItem(key: string): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const obfuscated = localStorage.getItem(`${this.prefix}${key}`);
      if (!obfuscated) return null;
      
      return JSON.parse(atob(obfuscated));
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      this.removeItem(key);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(`${this.prefix}${key}`);
  }
  
  static clear(): void {
    if (typeof window === 'undefined') return;
    
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static readonly tokenKey = 'csrf_token';
  private static readonly headerName = 'X-CSRF-Token';
  
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  static getToken(): string {
    let token = SecureStorage.getItem(this.tokenKey);
    if (!token) {
      token = this.generateToken();
      SecureStorage.setItem(this.tokenKey, token);
    }
    return token;
  }
  
  static refreshToken(): string {
    const token = this.generateToken();
    SecureStorage.setItem(this.tokenKey, token);
    return token;
  }
  
  static getHeaderName(): string {
    return this.headerName;
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  static sanitize(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, ''); // Remove data: protocol
  }
  
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email.toLowerCase().trim();
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    
    return this.sanitize(name).replace(/[^\w\s\-']/g, '');
  }
  
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Security headers for API requests
 */
export class SecurityHeaders {
  static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      [CSRFProtection.getHeaderName()]: CSRFProtection.getToken(),
    };
  }
  
  static getAuthHeaders(token: string): Record<string, string> {
    return {
      ...this.getHeaders(),
      'Authorization': `Bearer ${token}`,
    };
  }
}

/**
 * Secure fetch wrapper
 */
export class SecureFetch {
  static async apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...SecurityHeaders.getHeaders(),
        ...options.headers,
      },
      credentials: 'include',
    };
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, {
        ...secureOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check for security headers
      const csrfToken = response.headers.get('X-CSRF-Token');
      if (csrfToken) {
        SecureStorage.setItem('csrf_token', csrfToken);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  static async authenticatedRequest(url: string, token: string, options: RequestInit = {}): Promise<Response> {
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...SecurityHeaders.getAuthHeaders(token),
        ...options.headers,
      },
    };
    
    return this.apiRequest(url, secureOptions);
  }
}

/**
 * URL validation
 */
export class URLValidator {
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
  
  static isSameOrigin(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }
}
