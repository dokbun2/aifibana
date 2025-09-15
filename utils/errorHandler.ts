/**
 * Centralized error handler for Gemini API errors
 */

export interface ApiError {
  code: number;
  message: string;
  details?: string;
  retryAfter?: number;
}

export interface ErrorResponse {
  error: ApiError;
  userMessage: string;
  action: 'retry' | 'upgrade' | 'wait' | 'check_key';
  showHelp: boolean;
}

/**
 * Parse and handle Gemini API errors
 */
export function handleApiError(error: any): ErrorResponse {
  console.error('API Error:', error);

  // Extract error code and message
  const errorCode = error?.status || error?.response?.status || 500;
  const errorMessage = error?.message || error?.response?.data?.error?.message || 'Unknown error';

  // Get current time in Korea for quota reset calculation
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const midnightPacific = new Date(pacificTime);
  midnightPacific.setHours(24, 0, 0, 0);
  const hoursUntilReset = Math.ceil((midnightPacific.getTime() - pacificTime.getTime()) / (1000 * 60 * 60));

  switch (errorCode) {
    case 429:
      return {
        error: {
          code: 429,
          message: 'API 할당량 초과',
          details: errorMessage,
          retryAfter: hoursUntilReset * 3600
        },
        userMessage: `무료 등급 할당량을 초과했습니다.\n` +
                    `• 무료 제한: 분당 5개, 일일 25개 요청\n` +
                    `• 리셋 시간: 약 ${hoursUntilReset}시간 후 (한국시간 오후 5시)\n` +
                    `• 해결 방법: 유료 등급으로 업그레이드하거나 리셋을 기다려주세요.`,
        action: 'upgrade',
        showHelp: true
      };

    case 400:
      if (errorMessage.includes('API key')) {
        return {
          error: {
            code: 400,
            message: 'API 키 오류',
            details: errorMessage
          },
          userMessage: 'API 키가 유효하지 않습니다. 설정에서 올바른 키를 입력해주세요.',
          action: 'check_key',
          showHelp: false
        };
      }
      return {
        error: {
          code: 400,
          message: '잘못된 요청',
          details: errorMessage
        },
        userMessage: '요청 형식이 올바르지 않습니다. 이미지 형식이나 프롬프트를 확인해주세요.',
        action: 'retry',
        showHelp: false
      };

    case 401:
    case 403:
      return {
        error: {
          code: errorCode,
          message: '인증 실패',
          details: errorMessage
        },
        userMessage: 'API 키 인증에 실패했습니다. 설정에서 API 키를 확인해주세요.',
        action: 'check_key',
        showHelp: false
      };

    case 500:
    case 502:
    case 503:
      return {
        error: {
          code: errorCode,
          message: '서버 오류',
          details: errorMessage
        },
        userMessage: 'Google 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
        action: 'wait',
        showHelp: false
      };

    default:
      if (errorMessage.includes('policy')) {
        return {
          error: {
            code: errorCode,
            message: '콘텐츠 정책 위반',
            details: errorMessage
          },
          userMessage: '요청이 Google의 콘텐츠 정책을 위반했습니다. 다른 내용으로 시도해주세요.',
          action: 'retry',
          showHelp: false
        };
      }
      return {
        error: {
          code: errorCode,
          message: '알 수 없는 오류',
          details: errorMessage
        },
        userMessage: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        action: 'retry',
        showHelp: false
      };
  }
}

/**
 * Track API usage in localStorage
 */
export function trackApiUsage() {
  const today = new Date().toDateString();
  const usage = JSON.parse(localStorage.getItem('api_usage') || '{}');

  if (usage.date !== today) {
    usage.date = today;
    usage.count = 0;
    usage.timestamps = [];
  }

  usage.count++;
  usage.timestamps.push(Date.now());

  // Keep only last hour's timestamps for rate limit tracking
  const oneHourAgo = Date.now() - 3600000;
  usage.timestamps = usage.timestamps.filter((ts: number) => ts > oneHourAgo);

  localStorage.setItem('api_usage', JSON.stringify(usage));

  return usage;
}

/**
 * Check if we're approaching rate limits
 */
export function checkRateLimit(): { canProceed: boolean; message?: string } {
  const usage = JSON.parse(localStorage.getItem('api_usage') || '{}');

  // Check daily limit (25 for free tier)
  if (usage.count >= 25) {
    return {
      canProceed: false,
      message: '일일 할당량(25개)에 도달했습니다. 내일 오후 5시에 리셋됩니다.'
    };
  }

  // Check rate limit (5 per minute for free tier)
  const oneMinuteAgo = Date.now() - 60000;
  const recentRequests = (usage.timestamps || []).filter((ts: number) => ts > oneMinuteAgo);

  if (recentRequests.length >= 5) {
    return {
      canProceed: false,
      message: '분당 요청 제한(5개)에 도달했습니다. 1분 후 다시 시도해주세요.'
    };
  }

  return { canProceed: true };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ErrorResponse): string {
  return error.userMessage;
}

/**
 * Get help URL based on error type
 */
export function getHelpUrl(action: ErrorResponse['action']): string {
  switch (action) {
    case 'upgrade':
      return 'https://aistudio.google.com/app/plan';
    case 'check_key':
      return 'https://aistudio.google.com/app/apikey';
    default:
      return 'https://ai.google.dev/gemini-api/docs/troubleshooting';
  }
}