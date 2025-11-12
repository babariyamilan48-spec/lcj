// Environment detection and configuration utilities

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  apiUrl: string;
  environment: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.detectEnvironment();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private detectEnvironment(): EnvironmentConfig {
    // Server-side rendering check
    if (typeof window === 'undefined') {
      return {
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        environment: 'development',
        isProduction: false,
        isDevelopment: true,
        isStaging: false,
      };
    }

    // Check environment variable first
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const envType = process.env.NEXT_PUBLIC_APP_ENV as Environment;

    if (envApiUrl) {
      const environment = envType || this.detectEnvironmentFromUrl(envApiUrl);
      return {
        apiUrl: envApiUrl,
        environment,
        isProduction: environment === 'production',
        isDevelopment: environment === 'development',
        isStaging: environment === 'staging',
      };
    }

    // Auto-detect from current URL
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    let apiUrl: string;
    let environment: Environment;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development environment
      apiUrl = 'http://localhost:8000';
      environment = 'development';
    } else if (hostname.includes('staging') || hostname.includes('dev')) {
      // Staging environment
      apiUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
      environment = 'staging';
    } else {
      // Production environment
      apiUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
      environment = 'production';
    }

    return {
      apiUrl,
      environment,
      isProduction: environment === 'production',
      isDevelopment: environment === 'development',
      isStaging: environment === 'staging',
    };
  }

  private detectEnvironmentFromUrl(url: string): Environment {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return 'development';
    } else if (url.includes('staging') || url.includes('dev')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public getApiUrl(): string {
    return this.config.apiUrl;
  }

  public getEnvironment(): Environment {
    return this.config.environment;
  }

  public isProduction(): boolean {
    return this.config.isProduction;
  }

  public isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  public isStaging(): boolean {
    return this.config.isStaging;
  }

  public updateApiUrl(newUrl: string): void {
    this.config.apiUrl = newUrl;
    this.config.environment = this.detectEnvironmentFromUrl(newUrl);
    this.config.isProduction = this.config.environment === 'production';
    this.config.isDevelopment = this.config.environment === 'development';
    this.config.isStaging = this.config.environment === 'staging';
  }

  public getApiEndpointUrl(service: string, endpoint: string = ''): string {
    const baseUrl = this.getApiUrl();
    const servicePath = service.startsWith('/') ? service : `/${service}`;
    const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${baseUrl}/api/v1${servicePath}${endpoint ? endpointPath : ''}`;
  }
}

// Export singleton instance
export const environmentManager = EnvironmentManager.getInstance();

// Convenience exports
export const getEnvironmentConfig = (): EnvironmentConfig => environmentManager.getConfig();
export const getApiUrl = (): string => environmentManager.getApiUrl();
export const getEnvironment = (): Environment => environmentManager.getEnvironment();
export const isProduction = (): boolean => environmentManager.isProduction();
export const isDevelopment = (): boolean => environmentManager.isDevelopment();
export const isStaging = (): boolean => environmentManager.isStaging();

// API endpoint builder
export const buildApiEndpoint = (service: string, endpoint: string = ''): string => {
  return environmentManager.getApiEndpointUrl(service, endpoint);
};

