import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { GalleryDisplay } from './components/GalleryDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateStyledImage } from './services/geminiService';
import type { GeneratedResult, UploadedImage } from './types';
import { ArrowRightIcon, SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [clothingImage, setClothingImage] = useState<UploadedImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [galleryItems, setGalleryItems] = useState<GeneratedResult[]>([]);

  const handleImageUpload = useCallback((file: File, type: 'person' | 'clothing') => {
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

    if (file.size > MAX_FILE_SIZE) {
      setError(`이미지 파일 크기는 4MB를 초과할 수 없습니다. '${file.name}' 파일이 너무 큽니다.`);
      if (type === 'person') setPersonImage(null);
      if (type === 'clothing') setClothingImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      const previewUrl = URL.createObjectURL(file);
      const uploadedImage = {
        base64: base64String,
        preview: previewUrl,
        mimeType: file.type,
      };
      if (type === 'person') {
        setPersonImage(uploadedImage);
      } else {
        setClothingImage(uploadedImage);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!personImage || !clothingImage) {
      setError('인물 사진과 의상 사진을 모두 업로드해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateStyledImage(personImage, clothingImage);
      setGalleryItems(prev => [result, ...prev]);
      setActiveTab('gallery');
    } catch (err) {
      console.error(err);
      let errorMessage = '이미지 생성 중 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      if (err instanceof Error) {
        // The service now provides a user-friendly message
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const tabClass = (tabName: 'create' | 'gallery') =>
    `px-6 py-3 text-lg font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-t-md ${
      activeTab === tabName
        ? 'border-b-2 border-orange-500 text-white bg-gray-800/50'
        : 'border-b-2 border-transparent text-gray-400 hover:text-white'
    }`;


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8 font-sans">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center gap-3">
            <SparklesIcon />
            AIFI TRY ON
        </h1>
        <p className="text-gray-400 mt-2">AI를 이용해 가상으로 옷을 입어보세요.</p>
      </header>

      <main className="w-full max-w-5xl flex flex-col items-center">
        <div className="flex justify-center border-b border-gray-700 w-full max-w-md mb-8" role="tablist">
          <button className={tabClass('create')} onClick={() => setActiveTab('create')} id="create-tab" role="tab" aria-controls="create-panel" aria-selected={activeTab === 'create'}>
            생성하기
          </button>
          <button className={tabClass('gallery')} onClick={() => setActiveTab('gallery')} id="gallery-tab" role="tab" aria-controls="gallery-panel" aria-selected={activeTab === 'gallery'}>
            갤러리
          </button>
        </div>

        <div className={`${activeTab === 'create' ? 'block' : 'hidden'} w-full`} id="create-panel" role="tabpanel" aria-labelledby="create-tab">
           <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center justify-center mb-4 animate-fade-in">
              <ImageUploader
                title="인물 사진"
                onImageUpload={(file) => handleImageUpload(file, 'person')}
                previewSrc={personImage?.preview}
              />
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={handleGenerate}
                  disabled={!personImage || !clothingImage || isLoading}
                  className="group relative w-20 h-20 flex items-center justify-center bg-gray-800 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  aria-label="Generate Image"
                >
                  {isLoading ? <LoadingSpinner /> : <ArrowRightIcon className="w-10 h-10 text-white transition-transform duration-200 group-hover:translate-x-1" />}
                </button>
              </div>
              <ImageUploader
                title="의상 사진"
                onImageUpload={(file) => handleImageUpload(file, 'clothing')}
                previewSrc={clothingImage?.preview}
              />
            </div>
            <p className="text-center text-xs text-gray-500 mb-6 max-w-lg mx-auto">
              팁: 최상의 결과를 얻고 AI 안전 필터를 피하려면, 얼굴이 선명하게 나오고 노출이 적은 고화질 이미지를 사용하세요.
            </p>
            {error && <div className="text-center mt-6 text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}
        </div>
        
        <div className={`${activeTab === 'gallery' ? 'block' : 'hidden'} w-full`} id="gallery-panel" role="tabpanel" aria-labelledby="gallery-tab">
             <div className="animate-fade-in">
                <GalleryDisplay galleryItems={galleryItems} />
            </div>
        </div>
      </main>
      
      <footer className="text-center text-gray-500 mt-12 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
