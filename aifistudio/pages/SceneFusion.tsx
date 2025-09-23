import React, { useState, useCallback } from 'react';
import DrawableImageUploader from '../components/DrawableImageUploader';
import ImageUploader from '../components/ImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import { editImage } from '../services/geminiService';
import type { ImageFile } from '../types';

const SceneFusion: React.FC = () => {
  const [baseImage, setBaseImage] = useState<ImageFile | null>(null);
  const [additionalImage, setAdditionalImage] = useState<ImageFile | null>(null);
  const [drawnArea, setDrawnArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [fusionDescription, setFusionDescription] = useState<string>("선택한 영역에 추가 이미지의 요소를 자연스럽게 합성합니다.");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!baseImage || !additionalImage) {
      setError("기본 이미지와 추가 이미지를 모두 업로드해주세요.");
      return;
    }

    if (!drawnArea) {
      setError("기본 이미지에 합성할 영역을 그려주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      // 드로잉 영역 정보를 포함한 프롬프트 생성
      const areaInfo = `Selected area: position (${Math.round(drawnArea.x)}, ${Math.round(drawnArea.y)}), size ${Math.round(drawnArea.width)}x${Math.round(drawnArea.height)} pixels.`;

      const fullPrompt = `
        ${areaInfo}

        Instructions:
        1. Take the base image (first image) as the foundation
        2. In the marked area, seamlessly blend elements from the additional image (second image)
        3. Fusion description: ${fusionDescription}
        4. Ensure natural lighting, perspective, and color matching
        5. Maintain the overall composition of the base image while integrating new elements

        Create a photorealistic, professionally composited result.
      `;

      const images = [
        { data: baseImage.base64, mimeType: baseImage.file.type },
        { data: additionalImage.base64, mimeType: additionalImage.file.type }
      ];

      const result = await editImage(images, fullPrompt);
      setResultImage(result.base64Image);

    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, additionalImage, drawnArea, fusionDescription]);

  const isButtonDisabled = !baseImage || !additionalImage || !drawnArea || isLoading;

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">이미지 합성</h1>
        <p className="mt-4 text-lg text-brand-text-secondary">
          기본 이미지의 특정 영역에 추가 이미지의 요소를 자연스럽게 합성합니다.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 기본 이미지 - 드로잉 가능 */}
        <div className="lg:col-span-1">
          <DrawableImageUploader
            imageFile={baseImage}
            setImageFile={setBaseImage}
            title="기본 이미지 (합성 영역 그리기)"
            drawnArea={drawnArea}
            setDrawnArea={setDrawnArea}
          />
        </div>

        {/* 추가 이미지 */}
        <div className="lg:col-span-1">
          <div className="h-full flex flex-col">
            <label className="block text-sm font-medium text-brand-text-secondary mb-3">
              추가 이미지 (합성할 요소)
            </label>
            <div style={{ height: '500px' }}>
              <ImageUploader
                imageFile={additionalImage}
                setImageFile={setAdditionalImage}
                hideLabel={true}
              />
            </div>
          </div>
        </div>

        {/* 결과 이미지 표시 영역 */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-brand-text-secondary mb-3">
            결과 이미지
          </label>
          <div
            className="border-2 border-dashed border-brand-border rounded-lg flex items-center justify-center bg-brand-surface"
            style={{ height: '500px' }}
          >
            {resultImage ? (
              <img
                src={`data:image/png;base64,${resultImage}`}
                alt="Result"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center p-8">
                <p className="text-brand-text-tertiary">
                  {isLoading ? '이미지 합성 중...' : '합성된 이미지가 여기에 표시됩니다'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 합성 설명 입력 */}
      <div className="w-full mb-6">
        <label htmlFor="fusion-desc" className="block text-sm font-medium text-brand-text-secondary mb-2">
          합성 내용 설명
        </label>
        <textarea
          id="fusion-desc"
          value={fusionDescription}
          onChange={(e) => setFusionDescription(e.target.value)}
          rows={3}
          className="w-full p-3 bg-brand-surface border border-brand-border rounded-lg focus:ring-2 focus:ring-white focus:border-white transition"
          placeholder="어떻게 합성할지 설명해주세요. 예: 추가 이미지의 인물을 기본 이미지의 선택 영역에 자연스럽게 배치"
        />
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="px-8 py-3 bg-brand-primary text-brand-text-on-primary font-semibold rounded-lg shadow-md hover:opacity-90 disabled:bg-brand-surface disabled:text-brand-secondary disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? '이미지 합성 중...' : '이미지 합성하기'}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* 안내 메시지 */}
      {!baseImage && (
        <div className="mt-6 p-4 bg-brand-surface border border-brand-border rounded-lg max-w-2xl">
          <h3 className="font-semibold text-white mb-2">사용 방법:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-brand-text-secondary">
            <li>기본 이미지를 업로드합니다</li>
            <li>마우스로 드래그하여 합성할 영역을 지정합니다</li>
            <li>추가 이미지를 업로드합니다</li>
            <li>합성 내용을 설명합니다 (선택사항)</li>
            <li>'이미지 합성하기' 버튼을 클릭합니다</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default SceneFusion;