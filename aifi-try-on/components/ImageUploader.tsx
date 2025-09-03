
import React, { useRef } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (file: File) => void;
  previewSrc?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, previewSrc }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full aspect-square bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center p-4 transition-all duration-300 hover:border-purple-500 hover:bg-gray-800 cursor-pointer" onClick={handleClick}>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {previewSrc ? (
        <img src={previewSrc} alt={title} className="w-full h-full object-contain rounded-md" />
      ) : (
        <div className="text-center text-gray-400">
          <UploadIcon />
          <h3 className="mt-4 text-lg font-semibold">{title}</h3>
          <p className="text-sm">클릭해서 이미지를 업로드하세요</p>
          <p className="text-xs text-gray-500 mt-1">최대 4MB</p>
        </div>
      )}
    </div>
  );
};
