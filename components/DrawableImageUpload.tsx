import React, { useState, useRef, useEffect } from 'react';
import { IconUpload, IconX, IconBrush, IconEraser, IconArrowBack } from '@tabler/icons-react';
import { Button } from './ui/Button';

interface DrawableImageUploadProps {
  imageFile: { preview: string; file: File } | null;
  setImageFile: (file: { preview: string; file: File } | null) => void;
  title: string;
  drawnArea: { x: number; y: number; width: number; height: number } | null;
  setDrawnArea: (area: { x: number; y: number; width: number; height: number } | null) => void;
}

export const DrawableImageUpload: React.FC<DrawableImageUploadProps> = ({
  imageFile,
  setImageFile,
  title,
  drawnArea,
  setDrawnArea
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'draw' | 'erase'>('draw');
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile({ file, preview: URL.createObjectURL(file) });
      setDrawnArea(null);
      setCurrentRect(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile({ file, preview: URL.createObjectURL(file) });
      setDrawnArea(null);
      setCurrentRect(null);
    }
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
      // 새로운 드로잉을 시작할 때는 이전 currentRect을 초기화
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
    }
    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearDrawnArea = () => {
    setDrawnArea(null);
    setCurrentRect(null);
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

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, width, height);

      // drawnArea가 있으면 drawnArea를 표시, 없으면 현재 드로잉 중인 currentRect 표시
      if (drawnArea) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(drawnArea.x, drawnArea.y, drawnArea.width, drawnArea.height);

        ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        ctx.fillRect(drawnArea.x, drawnArea.y, drawnArea.width, drawnArea.height);
      } else if (currentRect) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);

        ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      }
    };
    img.src = imageFile.preview;
  }, [imageFile, currentRect, drawnArea]);

  return (
    <div className="w-full">
      <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
        <span className="text-purple-500">1.</span> {title}
      </h3>

      {imageFile && (
        <div className="flex gap-2 mb-2">
          <Button
            onClick={() => setDrawMode('draw')}
            variant={drawMode === 'draw' ? 'primary' : 'secondary'}
            size="xs"
            leftIcon={<IconBrush size={14} />}
          >
            영역 그리기
          </Button>
          <Button
            onClick={() => {
              setDrawMode('erase');
              clearDrawnArea();
            }}
            variant={drawMode === 'erase' ? 'primary' : 'secondary'}
            size="xs"
            leftIcon={<IconEraser size={14} />}
          >
            지우기
          </Button>
          <Button
            onClick={clearDrawnArea}
            variant="secondary"
            size="xs"
            leftIcon={<IconArrowBack size={14} />}
          >
            초기화
          </Button>
        </div>
      )}

      <div
        className="relative border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-all duration-300"
        style={{ height: '400px' }}
        onClick={() => !imageFile && fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {imageFile ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setImageFile(null);
                setDrawnArea(null);
                setCurrentRect(null);
              }}
              variant="danger"
              size="xs"
              className="absolute top-2 right-2"
            >
              <IconX size={16} />
            </Button>
            {drawnArea && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                영역: {Math.round(drawnArea.width)}×{Math.round(drawnArea.height)}px
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <IconUpload size={40} className="mb-2 text-gray-500" />
            <p className="text-gray-400 text-sm">이미지 업로드</p>
            <p className="text-xs text-gray-500 mt-1">클릭하거나 드래그하여 업로드</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {drawMode === 'draw' && imageFile && !drawnArea && (
        <p className="mt-2 text-xs text-gray-400">
          마우스로 드래그하여 합성할 영역을 지정하세요
        </p>
      )}
    </div>
  );
};