import React, { useRef } from 'react';
import type { ImageFile } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

interface ImageUploaderProps {
  imageFile: ImageFile | null;
  setImageFile: (file: ImageFile | null) => void;
  title?: string;
  hideLabel?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ imageFile, setImageFile, title = "이미지 업로드", hideLabel = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setImageFile({
          file,
          preview: URL.createObjectURL(file),
          base64,
        });
      } catch (error) {
        console.error("Error converting file to base64", error);
        alert("이미지 파일을 처리할 수 없습니다.");
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (imageFile) {
        URL.revokeObjectURL(imageFile.preview);
    }
    setImageFile(null);
    if(inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full h-full">
      {!hideLabel && <label className="block text-sm font-medium text-brand-text-secondary mb-2">{title}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex justify-center items-center w-full ${hideLabel ? 'h-full' : 'h-64'} bg-brand-surface border-2 border-dashed border-brand-border rounded-lg cursor-pointer hover:border-white transition-colors duration-200 group`}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {imageFile ? (
          <>
            <img src={imageFile.preview} alt="미리보기" className="w-full h-full object-contain rounded-lg" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="이미지 제거"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        ) : (
          <div className="text-center text-brand-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm">클릭하여 이미지 업로드</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;