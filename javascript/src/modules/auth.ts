/**
 * Authentication Module
 * Handles user signup, API key management, and wallet operations
 */

import { HttpClient } from '../utils/http';
import {
  validateEmail,
  validateEthereumAddress,
  validateChain,
  validateRequired
} from '../utils/validation';
import {
  SignupRequest,
  SignupResponse,
  User,
  AddWalletRequest,
  APIKey,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse
} from '../types';

export class AuthModule {
  constructor(private http: HttpClient) {}

  /**
   * Register a new user account
   * @param email - User email address
   * @param password - User password (min 8 characters)
   * @param userType - 'agent' | 'merchant' | 'both'
   * @returns SignupResponse with auto-generated API key
   */
  async signup(email: string, password: string, userType: 'agent' | 'merchant' | 'both'): Promise<SignupResponse> {
    // Validate inputs
    validateRequired(email, 'email');
    validateRequired(password, 'password');
    validateRequired(userType, 'userType');
    validateEmail(email);

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const request: SignupRequest = {
      email,
      password,
      userType
    };

    const response = await this.http.post<SignupResponse>('/v1/users/signup', request);

    if (!response.data) {
      throw new Error('Signup failed - no data returned');
    }

    return response.data;
  }

  /**
   * Get current user information (requires API key)
   * @returns User object
   */
  async getMe(): Promise<User> {
    const response = await this.http.get<User>('/v1/users/me');

    if (!response.data) {
      throw new Error('Failed to get user info');
    }

    return response.data;
  }

  /**
   * Add a wallet address to user account
   * @param chain - Blockchain network ('ethereum', 'base', 'polygon', 'arbitrum')
   * @param address - Ethereum wallet address (0x...)
   */
  async addWallet(chain: string, address: string): Promise<void> {
    validateRequired(chain, 'chain');
    validateRequired(address, 'address');
    validateChain(chain);
    validateEthereumAddress(address);

    const request: AddWalletRequest = {
      chain,
      address
    };

    await this.http.post('/v1/users/wallets/add', request);
  }

  /**
   * Create a new API key
   * @param name - Optional name for the API key
   * @returns CreateAPIKeyResponse with new API key (shown only once!)
   */
  async createAPIKey(name?: string): Promise<CreateAPIKeyResponse> {
    const request: CreateAPIKeyRequest = name ? { name } : {};

    const response = await this.http.post<CreateAPIKeyResponse>('/v1/api-keys/create', request);

    if (!response.data) {
      throw new Error('Failed to create API key');
    }

    return response.data;
  }

  /**
   * List all API keys for current user
   * @returns Array of APIKey objects (without full key values)
   */
  async listAPIKeys(): Promise<APIKey[]> {
    const response = await this.http.get<{ keys: APIKey[] }>('/v1/api-keys/list');

    if (!response.data) {
      throw new Error('Failed to list API keys');
    }

    return response.data.keys;
  }

  /**
   * Revoke an API key
   * @param keyId - ID of the API key to revoke
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    validateRequired(keyId, 'keyId');

    await this.http.post('/v1/api-keys/revoke', { keyId });
  }

  /**
   * Configure signing service (Render/Railway deployment)
   * @param signingServiceUrl - HTTPS URL of your signing service
   * @param gatewayWalletAddress - Ethereum address of gateway wallet
   * @param testConnection - Optional: test connectivity to signing service
   */
  async configureSigningService(
    signingServiceUrl: string,
    gatewayWalletAddress: string,
    testConnection: boolean = false
  ): Promise<void> {
    validateRequired(signingServiceUrl, 'signingServiceUrl');
    validateRequired(gatewayWalletAddress, 'gatewayWalletAddress');
    validateEthereumAddress(gatewayWalletAddress);

    if (!signingServiceUrl.startsWith('https://')) {
      throw new Error('Signing service URL must use HTTPS');
    }

    await this.http.post('/v1/users/configure-signer', {
      signing_service_url: signingServiceUrl,
      gateway_wallet_address: gatewayWalletAddress,
      test_connection: testConnection
    });
  }
}
