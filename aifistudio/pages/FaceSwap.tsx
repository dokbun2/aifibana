import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import { editImage } from '../services/geminiService';
import type { ImageFile } from '../types';

const FaceSwap: React.FC = () => {
  const [inspirationImage, setInspirationImage] = useState<ImageFile | null>(null);
  const [targetImage, setTargetImage] = useState<ImageFile | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!inspirationImage || !targetImage) {
      setError("영감 이미지와 대상 이미지를 모두 업로드해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const prompt = "From the first image provided, extract the person's face. From the second image, use the overall scene, body, and style. Combine these by swapping the face from the first image onto the person in the second image. Ensure the lighting, color grading, and style of the final image match the second image perfectly.";
      const images = [
        { data: inspirationImage.base64, mimeType: inspirationImage.file.type },
        { data: targetImage.base64, mimeType: targetImage.file.type },
      ];
      
      const result = await editImage(images, prompt);
      setResultImage(result.base64Image);

    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [inspirationImage, targetImage]);
  
  const isButtonDisabled = !inspirationImage || !targetImage || isLoading;

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">페이스 스왑</h1>
        <p className="mt-4 text-lg text-brand-text-secondary">얼굴을 바꿀 영감 이미지와 대상 이미지를 업로드하여 페이스 스왑을 실행하세요.</p>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <ImageUploader imageFile={inspirationImage} setImageFile={setInspirationImage} title="영감 이미지 (얼굴)" />
        <ImageUploader imageFile={targetImage} setImageFile={setTargetImage} title="대상 이미지 (장면/몸)" />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="px-8 py-3 bg-brand-primary text-brand-text-on-primary font-semibold rounded-lg shadow-md hover:opacity-90 disabled:bg-brand-surface disabled:text-brand-secondary disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? '생성 중...' : '페이스 스왑 생성'}
      </button>

      <ResultDisplay isLoading={isLoading} error={error} images={[resultImage]} />
    </div>
  );
};

export default FaceSwap;