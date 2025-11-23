/**
 * Payments Module
 * Handles x402 payment submission, verification, and wallet integration
 */

import { HttpClient } from '../utils/http';
import {
  validateRequired,
  validateTxHash,
  validateChain,
  validateToken,
  validateAmount,
  validateMandateToken,
  validateEthereumAddress
} from '../utils/validation';
import {
  Chain,
  Token,
  SubmitPaymentRequest,
  SubmitPaymentResponse,
  PayWithWalletRequest,
  PaymentVerification,
  PaymentStatus,
  PaymentListQuery,
  Payment,
  InvalidTransactionError
} from '../types';

export class PaymentsModule {
  constructor(private http: HttpClient) {}

  /**
   * Submit a payment using an existing blockchain transaction
   *
   * Supports two-transaction model:
   * - txHash: Primary payment transaction
   * - txHashCommission: Optional commission transaction (if gateway requires commission split)
   *
   * @param mandate - AP2 mandate token
   * @param txHash - Primary transaction hash (0x...)
   * @param txHashCommission - Optional commission transaction hash (0x...)
   * @param chain - Optional chain (defaults to 'base')
   * @param token - Optional token (defaults to 'USDC')
   * @param priceUsd - Optional explicit price in USD (defaults to endpoint price)
   * @returns Payment result with resource access
   */
  async submitTxHash(
    mandate: string,
    txHash: string,
    txHashCommission?: string,
    chain: Chain = 'base',
    token: Token = 'USDC',
    priceUsd?: number
  ): Promise<SubmitPaymentResponse> {
    // Validate inputs
    validateRequired(mandate, 'mandate');
    validateRequired(txHash, 'txHash');
    validateMandateToken(mandate);
    validateTxHash(txHash);
    validateChain(chain);
    validateToken(token);

    // Validate commission tx if provided
    if (txHashCommission) {
      validateTxHash(txHashCommission);
    }

    // Validate price if provided
    if (priceUsd !== undefined) {
      validateAmount(priceUsd, 'priceUsd');
    }

    // Build payment payload
    const paymentPayload: any = {
      scheme: 'eip3009',
      tx_hash: txHash
    };

    // Add commission tx if provided
    if (txHashCommission) {
      paymentPayload.tx_hash_commission = txHashCommission;
    }

    // Call x402/resource endpoint with payment
    const headers = {
      'x-mandate': mandate,
      'x-payment': JSON.stringify(paymentPayload)
    };

    // Build URL with query params
    let url = `/x402/resource?chain=${chain}&token=${token}`;
    if (priceUsd !== undefined) {
      url += `&price_usd=${priceUsd}`;
    }

    try {
      const response = await this.http.get<any>(url, { headers });

      return {
        success: true,
        status: 'completed',
        txHash: txHash,
        txHashCommission: txHashCommission,
        amountUsd: response.data?.amount_usd || priceUsd || 0,
        budgetRemaining: response.data?.budget_remaining || 0,
        resource: response.data
      };
    } catch (error: any) {
      if (error instanceof InvalidTransactionError) {
        return {
          success: false,
          status: 'failed',
          txHash: txHash,
          txHashCommission: txHashCommission,
          amountUsd: 0,
          budgetRemaining: 0,
          error: error.reason
        };
      }
      throw error;
    }
  }

  /**
   * Pay for a resource using ethers.js wallet (Web3 integration)
   * This method builds and sends the transaction for you
   *
   * REQUIRES: ethers.js v6 as a peer dependency
   *
   * @param mandate - AP2 mandate token
   * @param wallet - ethers.Wallet instance
   * @param recipientAddress - Payment recipient address
   * @param amountUsd - Amount in USD
   * @param chain - Blockchain network (defaults to 'base')
   * @param token - Token symbol (defaults to 'USDC')
   * @returns Payment result with transaction hash
   */
  async payWithWallet(
    mandate: string,
    wallet: any, // ethers.Wallet
    recipientAddress: string,
    amountUsd: number,
    chain: Chain = 'base',
    token: Token = 'USDC'
  ): Promise<SubmitPaymentResponse> {
    // Validate inputs
    validateRequired(mandate, 'mandate');
    validateRequired(wallet, 'wallet');
    validateRequired(recipientAddress, 'recipientAddress');
    validateMandateToken(mandate);
    validateEthereumAddress(recipientAddress);
    validateAmount(amountUsd, 'amountUsd');
    validateChain(chain);
    validateToken(token);

    // Check if ethers is available
    if (!wallet.sendTransaction) {
      throw new Error(
        'Invalid wallet object. Please provide an ethers.Wallet instance. ' +
        'Install ethers.js: npm install ethers@^6.0.0'
      );
    }

    try {
      // Import ethers dynamically (peer dependency)
      const { Contract } = await import('ethers');

      // Get token contract addresses (hardcoded from backend config)
      const contractAddresses: Record<Chain, Record<Token, string>> = {
        ethereum: {
          USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        },
        base: {
          USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          USDT: '0x0000000000000000000000000000000000000000', // Not deployed
          DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
        },
        polygon: {
          USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
        },
        arbitrum: {
          USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
          USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
        }
      };

      const tokenAddress = contractAddresses[chain][token];
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`${token} not available on ${chain}`);
      }

      // Get token decimals
      const decimals = token === 'DAI' ? 18 : 6; // DAI uses 18 decimals, USDC/USDT use 6

      // Calculate amount in atomic units
      const amountAtomic = BigInt(Math.floor(amountUsd * (10 ** decimals)));

      // ERC20 transfer ABI
      const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
      const contract = new Contract(tokenAddress, abi, wallet);

      // Send transaction
      console.log(`Sending ${amountUsd} ${token} on ${chain} to ${recipientAddress}...`);
      const tx = await contract.transfer(recipientAddress, amountAtomic);
      console.log(`Transaction sent: ${tx.hash}`);

      // Wait for transaction to be mined
      console.log('Waiting for confirmation...');
      await tx.wait();
      console.log('Transaction confirmed!');

      // Submit to AgentPay
      return await this.submitTxHash(mandate, tx.hash, chain, token);

    } catch (error: any) {
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Verify a payment by transaction hash (Merchant use case)
   * Public endpoint - no authentication required
   *
   * @param txHash - Blockchain transaction hash
   * @returns Payment verification details
   */
  async verify(txHash: string): Promise<PaymentVerification> {
    validateRequired(txHash, 'txHash');
    validateTxHash(txHash);

    const response = await this.http.get<PaymentVerification>(`/v1/payments/verify/${txHash}`);

    if (!response.data) {
      throw new Error('Failed to verify payment');
    }

    return response.data;
  }

  /**
   * Get payment status by transaction hash
   * Public endpoint - no authentication required
   *
   * @param txHash - Blockchain transaction hash
   * @returns Payment status
   */
  async getStatus(txHash: string): Promise<PaymentStatus> {
    validateRequired(txHash, 'txHash');
    validateTxHash(txHash);

    const response = await this.http.get<PaymentStatus>(`/v1/payments/status/${txHash}`);

    if (!response.data) {
      throw new Error('Failed to get payment status');
    }

    return response.data;
  }

  /**
   * List payment history for merchant wallet
   * Requires API key authentication
   *
   * @param query - Optional query parameters (date range, pagination)
   * @returns Array of payments
   */
  async list(query?: PaymentListQuery): Promise<Payment[]> {
    const params = new URLSearchParams();

    if (query?.startDate) params.append('start_date', query.startDate);
    if (query?.endDate) params.append('end_date', query.endDate);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const url = `/v1/payments/list?${params.toString()}`;
    const response = await this.http.get<{ payments: Payment[] }>(url);

    if (!response.data) {
      throw new Error('Failed to list payments');
    }

    return response.data.payments;
  }

  /**
   * Poll for transaction confirmation (useful for fast chains like Base)
   *
   * @param txHash - Transaction hash to poll
   * @param maxAttempts - Maximum polling attempts (default: 30)
   * @param intervalMs - Interval between attempts in ms (default: 2000)
   * @returns PaymentVerification when confirmed
   */
  async waitForConfirmation(
    txHash: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<PaymentVerification> {
    validateRequired(txHash, 'txHash');
    validateTxHash(txHash);

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const verification = await this.verify(txHash);

        if (verification.status === 'completed') {
          return verification;
        }

        if (verification.status === 'failed') {
          throw new InvalidTransactionError(
            `Transaction failed: ${verification.error}`,
            verification.error || 'Unknown error'
          );
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));

      } catch (error: any) {
        // If it's not a "not found" error, rethrow
        if (error.statusCode !== 404) {
          throw error;
        }
        // Otherwise, keep polling
      }
    }

    throw new Error(`Transaction ${txHash} not confirmed after ${maxAttempts} attempts`);
  }
}
