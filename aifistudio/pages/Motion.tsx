import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import MultiImageUploader from '../components/MultiImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import { editImage } from '../services/geminiService';
import type { ImageFile } from '../types';

const Motion: React.FC = () => {
  const [drawingImage, setDrawingImage] = useState<ImageFile | null>(null);
  const [characterImages, setCharacterImages] = useState<ImageFile[]>([]);
  const [prompt, setPrompt] = useState<string>("라인 드로잉과 같은 포즈로 소용돌이치는 모래와 구름이 있는 하늘을 날고 있는 두 캐릭터의 얼굴을 확대");
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!drawingImage || characterImages.length === 0 || !prompt) {
      setError("라인 드로잉, 하나 이상의 캐릭터 이미지, 그리고 프롬프트를 제공해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const fullPrompt = `Generate the final image with a ${aspectRatio} aspect ratio. The first image is a line drawing that defines the pose and composition. The subsequent images provide the character(s) to use. Generate a new image based on the following instruction, applying the character(s) to the pose in a new scene: ${prompt}.`;
      
      const characterImageParts = characterImages.map(img => ({ data: img.base64, mimeType: img.file.type }));
      const images = [
        { data: drawingImage.base64, mimeType: drawingImage.file.type },
        ...characterImageParts,
      ];
      
      const result = await editImage(images, fullPrompt);
      setResultImage(result.base64Image);

    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [drawingImage, characterImages, prompt, aspectRatio]);

  const isButtonDisabled = !drawingImage || characterImages.length === 0 || !prompt || isLoading;

  const aspectRatios = [
    { label: '정사각형', value: '1:1' },
    { label: '가로', value: '16:9' },
    { label: '세로', value: '9:16' },
    { label: '와이드', value: '4:3' },
    { label: '톨', value: '3:4' },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">모션 테크닉</h1>
        <p className="mt-4 text-lg text-brand-text-secondary">포즈를 위한 라인 드로잉, 캐릭터 이미지, 그리고 설명 프롬프트를 결합하여 역동적인 새 이미지를 만드세요.</p>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <ImageUploader imageFile={drawingImage} setImageFile={setDrawingImage} title="이미지 1 (포즈용 라인 드로잉)" />
        <MultiImageUploader imageFiles={characterImages} setImageFiles={setCharacterImages} title="캐릭터 이미지" />
      </div>
      
      <div className="w-full max-w-4xl mb-8 space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">프롬프트</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full p-3 bg-brand-surface border border-brand-border rounded-lg focus:ring-2 focus:ring-white focus:border-white transition"
            placeholder="최종 장면을 묘사하세요..."
          />
        </div>
        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-brand-text-secondary mb-2">종횡비</label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full p-3 bg-brand-surface border border-brand-border rounded-lg focus:ring-2 focus:ring-white focus:border-white transition"
          >
            {aspectRatios.map(ratio => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label} ({ratio.value})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="px-8 py-3 bg-brand-primary text-brand-text-on-primary font-semibold rounded-lg shadow-md hover:opacity-90 disabled:bg-brand-surface disabled:text-brand-secondary disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? '생성 중...' : '이미지 생성'}
      </button>

      <ResultDisplay isLoading={isLoading} error={error} images={[resultImage]} />
    </div>
  );
};

export default Motion;