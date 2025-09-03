import React from 'react';

interface ImagePanelProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  isInput?: boolean;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Spinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-10 rounded-xl">
    <div className="flex flex-col items-center">
      <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg font-semibold text-gray-200">AI가 마법을 부리는 중...</p>
    </div>
  </div>
);

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const MagicWandIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

export const ImagePanel: React.FC<ImagePanelProps> = ({ title, imageUrl, isLoading, isInput, onFileChange }) => {
  const content = () => {
    if (isLoading) {
      return (
        <div className="relative w-full h-full">
          {imageUrl && (
            <img src={imageUrl} alt="Processing" className="w-full h-full object-contain rounded-xl blur-sm" />
          )}
          <Spinner />
        </div>
      );
    }

    if (imageUrl) {
      return <img src={imageUrl} alt={title} className="w-full h-full object-contain rounded-xl" />;
    }

    if (isInput) {
      return (
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-white transition">
          <UploadIcon/>
          <p className="mt-2 text-center">여기를 클릭하여 이미지 업로드<br/>(PNG, JPG, WEBP)</p>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} accept="image/png, image/jpeg, image/webp" />
        </label>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
        <MagicWandIcon />
        <p className="mt-2 text-center">편집된 이미지가 여기에 표시됩니다.</p>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-4 flex flex-col relative h-full">
      <h2 className="text-xl font-bold text-center text-gray-300 mb-2">{title}</h2>
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 flex items-center justify-center">
            {content()}
        </div>
      </div>
    </div>
  );
};
