import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import { editImage } from '../services/geminiService';
import type { ImageFile } from '../types';

const CharacterTurnaround: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>("이미지 속 캐릭터의 정면, 오른쪽, 왼쪽, 뒷모습을 보여주는 4패널 턴어라운드를 만드세요. 부드러운 쉐이딩과 일관된 배경을 가진 3D 카툰 스타일로 렌더링하세요.");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!sourceImage || !prompt) {
      setError("소스 이미지를 업로드하고 프롬프트를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const images = [{ data: sourceImage.base64, mimeType: sourceImage.file.type }];
      const result = await editImage(images, prompt);
      setResultImage(result.base64Image);

    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceImage, prompt]);
  
  const isButtonDisabled = !sourceImage || !prompt || isLoading;

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">캐릭터 턴어라운드</h1>
        <p className="mt-4 text-lg text-brand-text-secondary">단일 이미지(스케치 또는 사진)에서 다각도 뷰를 생성하세요.</p>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <ImageUploader imageFile={sourceImage} setImageFile={setSourceImage} title="소스 이미지 (스케치 또는 사진)" />
        <div className="w-full">
          <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">프롬프트</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="w-full p-3 bg-brand-surface border border-brand-border rounded-lg focus:ring-2 focus:ring-white focus:border-white transition"
            placeholder="예: 전신 4패널 턴어라운드를 만드세요..."
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="px-8 py-3 bg-brand-primary text-brand-text-on-primary font-semibold rounded-lg shadow-md hover:opacity-90 disabled:bg-brand-surface disabled:text-brand-secondary disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? '생성 중...' : '턴어라운드 생성'}
      </button>

      <ResultDisplay isLoading={isLoading} error={error} images={[resultImage]} />
    </div>
  );
};

export default CharacterTurnaround;