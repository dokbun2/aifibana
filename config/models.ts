/**
 * Gemini Model Configuration
 */

export interface ModelConfig {
  name: string;
  displayName: string;
  description: string;
  features: string[];
  limits: {
    maxTokens: number;
    maxImages: number;
    maxImageSize: number; // in MB
  };
  fallback?: string;
}

export const MODELS: Record<string, ModelConfig> = {
  'gemini-2.5-flash-image-preview': {
    name: 'gemini-2.5-flash-image-preview',
    displayName: 'Gemini 2.5 Flash (Image)',
    description: '최신 이미지 생성 모델 - 빠르고 효율적',
    features: ['이미지 생성', '이미지 편집', '스타일 전환', '각도 변환'],
    limits: {
      maxTokens: 1000000,
      maxImages: 8,
      maxImageSize: 4
    },
    fallback: 'gemini-2.5-flash'
  },
  'gemini-2.5-flash': {
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: '빠른 텍스트 처리 및 번역',
    features: ['텍스트 생성', '번역', '요약', '분석'],
    limits: {
      maxTokens: 1000000,
      maxImages: 0,
      maxImageSize: 0
    },
    fallback: 'gemini-1.5-flash'
  },
  'gemini-1.5-flash': {
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: '이전 버전 - 안정적인 대체 모델',
    features: ['텍스트 생성', '번역', '기본 이미지 처리'],
    limits: {
      maxTokens: 1000000,
      maxImages: 4,
      maxImageSize: 4
    }
  }
};

// Default models for different tasks
export const DEFAULT_MODELS = {
  IMAGE_GENERATION: 'gemini-2.5-flash-image-preview',
  TRANSLATION: 'gemini-2.5-flash',
  TEXT_PROCESSING: 'gemini-2.5-flash'
} as const;

/**
 * Get model configuration
 */
export function getModelConfig(modelName: string): ModelConfig {
  return MODELS[modelName] || MODELS[DEFAULT_MODELS.IMAGE_GENERATION];
}

/**
 * Get fallback model if primary fails
 */
export function getFallbackModel(modelName: string): string | null {
  const config = MODELS[modelName];
  return config?.fallback || null;
}

/**
 * Check if model supports image generation
 */
export function supportsImageGeneration(modelName: string): boolean {
  const config = MODELS[modelName];
  return config?.features.includes('이미지 생성') || false;
}

/**
 * Get model limits
 */
export function getModelLimits(modelName: string) {
  const config = MODELS[modelName];
  return config?.limits || {
    maxTokens: 100000,
    maxImages: 1,
    maxImageSize: 1
  };
}

/**
 * Validate image file against model limits
 */
export function validateImageFile(file: File, modelName: string): { valid: boolean; error?: string } {
  const limits = getModelLimits(modelName);

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > limits.maxImageSize) {
    return {
      valid: false,
      error: `이미지 파일 크기는 ${limits.maxImageSize}MB를 초과할 수 없습니다. 현재: ${fileSizeMB.toFixed(1)}MB`
    };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '지원되는 이미지 형식: JPEG, PNG, WebP, GIF'
    };
  }

  return { valid: true };
}

/**
 * Get optimal model for task
 */
export function getOptimalModel(task: 'image' | 'text' | 'translation'): string {
  switch (task) {
    case 'image':
      return DEFAULT_MODELS.IMAGE_GENERATION;
    case 'translation':
      return DEFAULT_MODELS.TRANSLATION;
    case 'text':
      return DEFAULT_MODELS.TEXT_PROCESSING;
    default:
      return DEFAULT_MODELS.IMAGE_GENERATION;
  }
}