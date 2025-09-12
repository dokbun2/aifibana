import React, { useState, useCallback } from 'react';
import MultiImageUploader from '../components/MultiImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import { editImage } from '../services/geminiService';
import type { ImageFile } from '../types';

const SceneFusion: React.FC = () => {
  const [characterImages, setCharacterImages] = useState<ImageFile[]>([]);
  const [prompt, setPrompt] = useState<string>("이미지 속 인물들이 함께 요트에서 와인을 마시며 여름 휴가를 보내고 있습니다.");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (characterImages.length === 0 || !prompt) {
      setError("하나 이상의 캐릭터 이미지를 업로드하고 프롬프트를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const fullPrompt = `Using the characters from all the provided images, generate a new image based on the following scene description: ${prompt}.`;
      
      const images = characterImages.map(img => ({ data: img.base64, mimeType: img.file.type }));
      
      const result = await editImage(images, fullPrompt);
      setResultImage(result.base64Image);

    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [characterImages, prompt]);

  const isButtonDisabled = characterImages.length === 0 || !prompt || isLoading;

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">장면 퓨전</h1>
        <p className="mt-4 text-lg text-brand-text-secondary">여러 이미지의 캐릭터들을 하나의 일관된 장면으로 결합하세요.</p>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <MultiImageUploader imageFiles={characterImages} setImageFiles={setCharacterImages} title="캐릭터 이미지" />
        <div className="w-full">
          <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">장면 프롬프트</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="w-full p-3 bg-brand-surface border border-brand-border rounded-lg focus:ring-2 focus:ring-white focus:border-white transition"
            placeholder="최종 장면을 묘사하세요..."
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="px-8 py-3 bg-brand-primary text-brand-text-on-primary font-semibold rounded-lg shadow-md hover:opacity-90 disabled:bg-brand-surface disabled:text-brand-secondary disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? '장면 생성 중...' : '장면 생성'}
      </button>

      <ResultDisplay isLoading={isLoading} error={error} images={[resultImage]} />
    </div>
  );
};

export default SceneFusion;