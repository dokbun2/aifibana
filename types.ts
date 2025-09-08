// 이미지 합성 관련 타입 정의

export interface UploadedImage {
  base64: string;
  preview: string;
  mimeType: string;
}

export interface CompositeImageRequest {
  baseImage: UploadedImage;
  overlayImage?: UploadedImage;
  prompt: string;
}

export interface GeneratedResult {
  image: string | null;
  text: string | null;
  timestamp: number;
  type: 'tryOn' | 'composite' | 'edit';
}

export type TabType = 'tryOn' | 'composite' | 'edit';

export interface EditImageRequest {
  baseImage: UploadedImage;
  maskData?: string;
  prompt: string;
}