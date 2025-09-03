import React from 'react';
import type { GeneratedResult } from '../types';
import { DownloadIcon } from './Icons';

interface GalleryDisplayProps {
  galleryItems: GeneratedResult[];
}

export const GalleryDisplay: React.FC<GalleryDisplayProps> = ({ galleryItems }) => {
    const handleDownload = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const mimeType = imageUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1];
        const extension = mimeType ? mimeType.split('/')[1] : 'png';
        link.download = `aifi-try-on-${index + 1}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  if (galleryItems.length === 0) {
    return (
      <div className="text-center text-gray-400 p-8 bg-gray-800/50 rounded-lg">
        <h2 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">갤러리</h2>
        <p className="text-lg">아직 생성된 이미지가 없습니다.</p>
        <p>생성 탭으로 이동하여 새로운 이미지를 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">갤러리</h2>
      <div className="flex flex-col items-center gap-8">
        {galleryItems.map((result, index) => (
          <div key={index} className="w-full max-w-2xl bg-gray-800/50 rounded-lg shadow-lg overflow-hidden border border-gray-700 group transition-all duration-300 hover:shadow-orange-500/20 hover:border-orange-500">
            <div className="w-full bg-black/20 flex justify-center items-center relative">
                 {result.image ? (
                   <>
                    <img src={result.image} alt={`Generated result ${index + 1}`} className="max-w-full max-h-[80vh] object-contain transition-transform duration-300 group-hover:scale-105" />
                    <button 
                       onClick={() => result.image && handleDownload(result.image, index)}
                       className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                       aria-label="Download image"
                     >
                       <DownloadIcon className="w-6 h-6" />
                     </button>
                   </>
                ) : (
                  <div className="h-64 w-full flex items-center justify-center text-gray-400">이미지 없음</div>
                )}
            </div>
            {result.text && <p className="p-4 text-sm text-gray-300 italic bg-gray-900/50">{result.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
