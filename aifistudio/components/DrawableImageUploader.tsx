import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Brush, Eraser, Undo } from 'lucide-react';
import type { ImageFile } from '../types';

interface DrawableImageUploaderProps {
  imageFile: ImageFile | null;
  setImageFile: (file: ImageFile | null) => void;
  title?: string;
  drawnArea: { x: number; y: number; width: number; height: number } | null;
  setDrawnArea: (area: { x: number; y: number; width: number; height: number } | null) => void;
}

const DrawableImageUploader: React.FC<DrawableImageUploaderProps> = ({
  imageFile,
  setImageFile,
  title = "이미지 업로드",
  drawnArea,
  setDrawnArea
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'draw' | 'erase'>('draw');
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageFile({ file, base64, preview: URL.createObjectURL(file) });
      setDrawnArea(null);
      setCurrentRect(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageFile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawMode === 'draw') {
      setIsDrawing(true);
      setStartPoint({ x, y });
      // 새로운 드로잉 시작 시에만 currentRect을 null로 설정
      if (!isDrawing) {
        setCurrentRect(null);
      }
    } else if (drawMode === 'erase') {
      setDrawnArea(null);
      setCurrentRect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const newRect = {
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(currentX - startPoint.x),
      height: Math.abs(currentY - startPoint.y)
    };

    setCurrentRect(newRect);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect) {
      setDrawnArea(currentRect);
      // currentRect을 null로 설정하지 않고 유지
      // setCurrentRect(null); 제거
    }
    setIsDrawing(false);
    setStartPoint(null);
  };

  useEffect(() => {
    if (!canvasRef.current || !imageFile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // 이미지를 캔버스에 맞게 그리기
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, width, height);

      // 드로잉 영역 표시 - drawnArea를 우선 표시
      const rect = drawnArea || currentRect;
      if (rect) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        // 영역 내부를 반투명하게 표시
        ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    };
    img.src = imageFile.base64;
  }, [imageFile, currentRect, drawnArea]);

  const clearDrawnArea = () => {
    setDrawnArea(null);
    setCurrentRect(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-brand-text-secondary">
          {title}
        </label>
        {imageFile && (
          <div className="flex gap-2">
            <button
              onClick={() => setDrawMode('draw')}
              className={`p-2 rounded-lg transition-colors ${
                drawMode === 'draw'
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface/80'
              }`}
              title="영역 그리기"
            >
              <Brush className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setDrawMode('erase');
                clearDrawnArea();
              }}
              className={`p-2 rounded-lg transition-colors ${
                drawMode === 'erase'
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface/80'
              }`}
              title="영역 지우기"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={clearDrawnArea}
              className="p-2 bg-brand-surface text-brand-text-secondary rounded-lg hover:bg-brand-surface/80 transition-colors"
              title="초기화"
            >
              <Undo className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          isDragging
            ? 'border-brand-primary bg-brand-primary/10'
            : 'border-brand-border hover:border-brand-primary/50'
        }`}
        style={{ height: '500px' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !imageFile && fileInputRef.current?.click()}
      >
        {imageFile ? (
          <div className="relative w-full h-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImageFile(null);
                setDrawnArea(null);
                setCurrentRect(null);
              }}
              className="absolute top-3 right-3 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {drawnArea && (
              <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm z-10">
                영역 선택됨: {Math.round(drawnArea.width)}x{Math.round(drawnArea.height)}px
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Upload className="w-16 h-16 text-brand-text-secondary mb-4" />
            <p className="text-brand-text-secondary text-center mb-2">
              클릭하거나 이미지를 드래그하여 업로드
            </p>
            <p className="text-sm text-brand-text-tertiary">
              PNG, JPG, GIF, WEBP (최대 10MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
      </div>

      {drawMode === 'draw' && imageFile && !drawnArea && (
        <p className="mt-2 text-sm text-brand-text-tertiary">
          마우스로 드래그하여 합성할 영역을 지정하세요
        </p>
      )}
    </div>
  );
};

export default DrawableImageUploader;