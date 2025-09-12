import React, { useRef } from 'react';
import type { ImageFile } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

interface MultiImageUploaderProps {
  imageFiles: ImageFile[];
  setImageFiles: (files: ImageFile[]) => void;
  title: string;
  maxFiles?: number;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ imageFiles, setImageFiles, title, maxFiles }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImageFiles: ImageFile[] = [...imageFiles];
      for (const file of Array.from(files)) {
        if (maxFiles && newImageFiles.length >= maxFiles) {
            alert(`최대 ${maxFiles}개의 이미지만 업로드할 수 있습니다.`);
            break;
        }
        try {
          const base64 = await fileToBase64(file);
          newImageFiles.push({
            file,
            preview: URL.createObjectURL(file),
            base64,
          });
        } catch (error) {
          console.error("Error converting file to base64", error);
          alert(`이미지 파일을 처리할 수 없습니다: ${file.name}`);
        }
      }
      setImageFiles(newImageFiles);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImageFiles = [...imageFiles];
    const removedFile = newImageFiles.splice(index, 1)[0];
    if (removedFile) {
        URL.revokeObjectURL(removedFile.preview);
    }
    setImageFiles(newImageFiles);
  };

  const canUpload = !maxFiles || imageFiles.length < maxFiles;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-brand-text-secondary mb-2">{title}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {imageFiles.map((imageFile, index) => (
          <div key={index} className="relative group aspect-square">
            <img src={imageFile.preview} alt={`미리보기 ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-1 right-1 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100"
              aria-label={`이미지 ${index + 1} 제거`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}

        {canUpload && (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex justify-center items-center w-full h-full aspect-square bg-brand-surface border-2 border-dashed border-brand-border rounded-lg cursor-pointer hover:border-white transition-colors duration-200"
          >
            <input
              type="file"
              ref={inputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              multiple
            />
            <div className="text-center text-brand-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <p className="mt-1 text-xs">이미지 추가</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiImageUploader;