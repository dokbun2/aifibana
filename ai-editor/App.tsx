import React, { useState, useCallback } from 'react';
import { ImagePanel } from './components/ImagePanel';
import { editImageWithPrompt } from './services/geminiService';

interface UploadedImage {
  file: File;
  base64: string;
  dataUrl: string;
}

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('유효한 이미지 파일(PNG, JPG, WEBP)을 업로드해주세요.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setOriginalImage({ file, base64, dataUrl });
        setEditedImage(null);
        setError(null);
      };
      reader.onerror = () => {
        setError('이미지 파일을 읽는 데 실패했습니다.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt.trim()) {
      setError('이미지를 업로드하고 편집 지시사항을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const result = await editImageWithPrompt(
        originalImage.base64,
        originalImage.file.type,
        prompt
      );
      setEditedImage(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI 이미지 편집기
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            편집하고 싶은 내용을 자연어로 설명해주세요. AI가 마법을 보여줄 거예요.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh] min-h-[400px]">
          <ImagePanel 
            title="원본 이미지"
            imageUrl={originalImage?.dataUrl ?? null}
            isInput={true}
            onFileChange={handleFileChange}
          />
          <ImagePanel
            title="편집된 이미지"
            imageUrl={editedImage}
            isLoading={isLoading}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 배경 제거, 생일 모자 추가, 흑백으로 변경..."
            className="flex-grow bg-gray-800 border-2 border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition duration-200 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !originalImage || !prompt}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                편집 중...
              </>
            ) : (
              '편집 적용'
            )}
          </button>
        </div>

        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative text-center" role="alert">
                <strong className="font-bold">오류: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;