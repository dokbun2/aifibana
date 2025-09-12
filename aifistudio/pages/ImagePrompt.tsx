import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import { editImage } from '../services/geminiService';
import type { ImageFile } from '../types';

const ImagePrompt: React.FC = () => {
  const [inputImage, setInputImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>("주황색 우주복을 입은 남자가 하늘색 배경에서 우주비행사로 있는 클로즈업 샷");
  const [resultImages, setResultImages] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!inputImage || !prompt) {
      setError("이미지를 업로드하고 프롬프트를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImages([]);

    try {
        const imageInfo = { data: inputImage.base64, mimeType: inputImage.file.type };
        const fullPrompt = `Using the person in the provided image as a reference, generate a new image based on the following description: ${prompt}.`;

        const promises = Array(4).fill(null).map(() => editImage([imageInfo], fullPrompt));
        const results = await Promise.all(promises);

        setResultImages(results.map(r => r.base64Image));
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [inputImage, prompt]);
  
  const isButtonDisabled = !inputImage || !prompt || isLoading;

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">이미지 생성</h1>
        <p className="mt-4 text-lg text-brand-text-secondary">입력 이미지와 프롬프트를 제공하여 새로운 창작물을 생성하세요.</p>
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <ImageUploader imageFile={inputImage} setImageFile={setInputImage} title="입력 이미지" />
        <div className="w-full">
          <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">프롬프트</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="w-full p-3 bg-brand-surface border border-brand-border rounded-lg focus:ring-2 focus:ring-white focus:border-white transition"
            placeholder="예: 거대한 파도 위에서 서핑하는 사람의 사진"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="px-8 py-3 bg-brand-primary text-brand-text-on-primary font-semibold rounded-lg shadow-md hover:opacity-90 disabled:bg-brand-surface disabled:text-brand-secondary disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? '4개 이미지 생성 중...' : '이미지 생성'}
      </button>

      <ResultDisplay isLoading={isLoading} error={error} images={resultImages} title="생성된 이미지"/>
    </div>
  );
};

export default ImagePrompt;