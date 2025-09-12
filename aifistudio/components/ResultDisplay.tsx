import React from 'react';

interface ResultDisplayProps {
  isLoading: boolean;
  error: string | null;
  images: (string | null)[];
  title?: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-dashed border-white border-t-transparent rounded-full animate-spin"></div>
    <p className="text-brand-secondary">AI가 생각 중입니다...</p>
  </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, error, images, title = "결과" }) => {
  const hasResults = images.some(img => img !== null);

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-semibold text-brand-text-primary mb-4">{title}</h2>
      <div className="w-full min-h-[20rem] bg-black border border-brand-border rounded-lg flex items-center justify-center p-4">
        {isLoading && <LoadingSpinner />}
        {!isLoading && error && (
          <div className="text-center text-red-400">
            <p><strong>오류가 발생했습니다:</strong></p>
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && !hasResults && (
          <p className="text-brand-secondary">생성된 이미지가 여기에 표시됩니다.</p>
        )}
        {!isLoading && !error && hasResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {images.map((img, index) => (
              img ? (
                <div key={index} className="bg-brand-surface rounded-md overflow-hidden aspect-square">
                   <img src={`data:image/png;base64,${img}`} alt={`생성된 결과 ${index + 1}`} className="w-full h-full object-contain" />
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;