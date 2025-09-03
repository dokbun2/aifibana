
export interface UploadedImage {
  base64: string;
  preview: string;
  mimeType: string;
}

export interface GeneratedResult {
  image: string | null;
  text: string | null;
}
