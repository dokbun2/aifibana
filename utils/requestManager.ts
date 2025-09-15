/**
 * API Request Manager with rate limiting and queue management
 */

import { GoogleGenAI } from '@google/genai';
import { trackApiUsage, checkRateLimit, handleApiError } from './errorHandler';

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
  priority: number;
}

class RequestManager {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 12000; // 12 seconds for free tier (5 req/min)
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 3000, 5000]; // Exponential backoff

  /**
   * Add a request to the queue
   */
  async queueRequest<T>(
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    // Check rate limit before queuing
    const rateCheck = checkRateLimit();
    if (!rateCheck.canProceed) {
      throw new Error(rateCheck.message);
    }

    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${Date.now()}_${Math.random()}`,
        execute,
        resolve,
        reject,
        retries: 0,
        priority
      };

      // Insert based on priority
      const insertIndex = this.queue.findIndex(r => r.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIndex, 0, request);
      }

      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;

      // Ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await this.sleep(waitTime);
      }

      try {
        // Track usage before making request
        trackApiUsage();

        // Execute the request
        this.lastRequestTime = Date.now();
        const result = await request.execute();
        request.resolve(result);
      } catch (error: any) {
        // Handle rate limit errors with retry
        if (error?.status === 429 && request.retries < this.MAX_RETRIES) {
          request.retries++;
          const delay = this.RETRY_DELAYS[request.retries - 1];

          console.log(`Rate limited. Retrying in ${delay}ms (attempt ${request.retries}/${this.MAX_RETRIES})`);

          // Re-queue with delay
          setTimeout(() => {
            this.queue.unshift(request);
            this.processQueue();
          }, delay);
        } else {
          // Final failure
          request.reject(error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      lastRequestTime: this.lastRequestTime
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Singleton instance
export const requestManager = new RequestManager();

/**
 * Wrapper for Gemini API calls with automatic queuing and error handling
 */
export async function makeGeminiRequest(
  ai: GoogleGenAI,
  model: string,
  contents: any,
  config?: any,
  priority: number = 0
): Promise<any> {
  try {
    return await requestManager.queueRequest(
      async () => {
        const response = await ai.models.generateContent({
          model,
          contents,
          config
        });
        return response;
      },
      priority
    );
  } catch (error) {
    const errorResponse = handleApiError(error);

    // Show user-friendly error message
    if (errorResponse.showHelp) {
      // This would be replaced with a proper toast notification in production
      console.error('API Error:', errorResponse.userMessage);
    }

    throw error;
  }
}

/**
 * Get current usage statistics
 */
export function getUsageStats() {
  const usage = JSON.parse(localStorage.getItem('api_usage') || '{}');
  const queueStatus = requestManager.getQueueStatus();

  return {
    dailyUsage: usage.count || 0,
    dailyLimit: 25,
    remainingRequests: Math.max(0, 25 - (usage.count || 0)),
    queueLength: queueStatus.queueLength,
    processing: queueStatus.processing,
    lastRequestTime: queueStatus.lastRequestTime,
    resetTime: getResetTime()
  };
}

/**
 * Get the next quota reset time
 */
function getResetTime(): Date {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const midnightPacific = new Date(pacificTime);
  midnightPacific.setHours(24, 0, 0, 0);

  // Convert back to local time
  const resetTime = new Date(midnightPacific.toLocaleString("en-US", {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone}));

  return resetTime;
}

/**
 * Check if user should upgrade to paid tier
 */
export function shouldSuggestUpgrade(): boolean {
  const usage = JSON.parse(localStorage.getItem('api_usage') || '{}');

  // Suggest upgrade if user hits limits frequently
  const hitLimitCount = parseInt(localStorage.getItem('hit_limit_count') || '0');

  return usage.count >= 20 || hitLimitCount >= 3;
}