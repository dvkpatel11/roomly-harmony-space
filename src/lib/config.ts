
interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;
  socketReconnectionDelay: number;
  socketReconnectionAttempts: number;
}

interface AuthConfig {
  tokenKey: string;
  refreshTokenKey: string;
  tokenExpiryKey: string;
}

interface Config {
  api: ApiConfig;
  auth: AuthConfig;
  useMockData: boolean;
}

const config: Config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.example.com',
    wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.example.com',
    timeout: 10000,
    socketReconnectionDelay: 1000,
    socketReconnectionAttempts: 5
  },
  auth: {
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry'
  },
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true' || true
};

export default config;
