import React, { useRef, useState, useEffect, useCallback } from 'react';
import { IconEraser, IconBrush, IconTrash, IconDownload, IconPencil } from '@tabler/icons-react';

interface DrawingCanvasProps {
    onCanvasUpdate?: (imageData: string) => void;
    className?: string;
    width?: number;
    height?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    onCanvasUpdate,
    className = '',
    width = 512,
    height = 512
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(2);
    const [brushColor, setBrushColor] = useState('#00FF00'); // 녹색으로 변경 - 포즈 가이드라인임을 명확히
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 초기 캔버스 설정 - 검은색 배경
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
    }, [width, height]);

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setLastPoint({ x, y });
    }, []);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !lastPoint) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        setLastPoint({ x, y });
    }, [isDrawing, lastPoint, tool, brushSize, brushColor]);

    const updateCanvasData = useCallback(() => {
        if (onCanvasUpdate) {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64 = reader.result as string;
                            onCanvasUpdate(base64);
                        };
                        reader.readAsDataURL(blob);
                    }
                }, 'image/png');
            }
        }
    }, [onCanvasUpdate]);

    const stopDrawing = useCallback(() => {
        if (isDrawing) {
            updateCanvasData();
        }
        setIsDrawing(false);
        setLastPoint(null);
    }, [isDrawing, updateCanvasData]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        if (onCanvasUpdate) {
            onCanvasUpdate('');
        }
    }, [width, height, onCanvasUpdate]);

    const downloadCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = canvas.toDataURL();
        link.click();
    }, []);

    // Touch events for mobile support
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        setIsDrawing(true);
        setLastPoint({ x, y });
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing || !lastPoint) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        setLastPoint({ x, y });
    }, [isDrawing, lastPoint, tool, brushSize, brushColor]);

    const handleTouchEnd = useCallback(() => {
        stopDrawing();
    }, [stopDrawing]);

    return (
        <div className={`drawing-canvas-container ${className}`}>
            <div className="mb-2 flex flex-wrap gap-1 items-center">
                {/* 도구 선택 */}
                <div className="flex gap-1 bg-gray-800 rounded p-0.5">
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-1 rounded transition-colors ${
                            tool === 'pen' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                        }`}
                        title="펜"
                    >
                        <IconPencil size={16} />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-1 rounded transition-colors ${
                            tool === 'eraser' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                        }`}
                        title="지우개"
                    >
                        <IconEraser size={16} />
                    </button>
                </div>

                {/* 브러시 크기 */}
                <div className="flex items-center gap-1">
                    <IconBrush size={16} className="text-gray-400" />
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-16"
                    />
                    <span className="text-xs text-gray-400 w-6">{brushSize}</span>
                </div>

                {/* 색상 선택 */}
                <div className="flex items-center gap-1">
                    <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                        disabled={tool === 'eraser'}
                    />
                    <span className="text-xs text-gray-400">색상</span>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-1 ml-auto">
                    <button
                        onClick={clearCanvas}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="전체 지우기"
                    >
                        <IconTrash size={16} />
                    </button>
                    <button
                        onClick={downloadCanvas}
                        className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="다운로드"
                    >
                        <IconDownload size={16} />
                    </button>
                </div>
            </div>

            <div className="relative inline-block">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="border-2 border-gray-600 rounded-lg cursor-crosshair bg-black"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ touchAction: 'none' }}
                />
            </div>

            <div className="mt-1 text-[10px] text-gray-500">
                <p>💡 포즈 가이드라인을 그려주세요. 선은 결과에 나타나지 않습니다.</p>
            </div>
        </div>
    );
};