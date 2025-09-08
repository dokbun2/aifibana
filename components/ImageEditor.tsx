import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IconBrush, IconEraser, IconRefresh, IconDownload, IconAdjustments } from '@tabler/icons-react';
import { Button } from './ui/Button';

interface ImageEditorProps {
    imageUrl: string;
    onMaskGenerated: (maskData: string) => void;
    onSelectNewImage?: () => void;
    className?: string;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
    imageUrl,
    onMaskGenerated,
    onSelectNewImage,
    className = ''
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    const drawOnCanvas = useCallback((x: number, y: number, isErasing: boolean = false) => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const ctx = overlayCanvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
        ctx.fillStyle = isErasing ? 'rgba(0,0,0,1)' : 'rgba(0,255,0,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }, [brushSize]);

    const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const coords = getCanvasCoordinates(e);
        drawOnCanvas(coords.x, coords.y, tool === 'eraser');
    }, [drawOnCanvas, getCanvasCoordinates, tool]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const coords = getCanvasCoordinates(e);
        drawOnCanvas(coords.x, coords.y, tool === 'eraser');
    }, [isDrawing, drawOnCanvas, getCanvasCoordinates, tool]);

    const handleMouseUp = useCallback(() => {
        setIsDrawing(false);
        generateMask();
    }, []);

    const generateMask = useCallback(() => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        // Create a black and white mask from the red overlay
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCanvas.width = overlayCanvas.width;
        tempCanvas.height = overlayCanvas.height;

        // Fill with black background
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw white where green overlay exists
        const overlayData = overlayCanvas.getContext('2d')?.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
        if (!overlayData) return;

        const maskData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
        
        for (let i = 0; i < overlayData.data.length; i += 4) {
            const green = overlayData.data[i + 1];
            const alpha = overlayData.data[i + 3];
            
            if (green > 0 && alpha > 0) {
                // White for selected area
                maskData.data[i] = 255;     // R
                maskData.data[i + 1] = 255; // G
                maskData.data[i + 2] = 255; // B
                maskData.data[i + 3] = 255; // A
            } else {
                // Black for non-selected area
                maskData.data[i] = 0;       // R
                maskData.data[i + 1] = 0;   // G
                maskData.data[i + 2] = 0;   // B
                maskData.data[i + 3] = 255; // A
            }
        }

        tempCtx.putImageData(maskData, 0, 0);
        const maskDataUrl = tempCanvas.toDataURL();
        onMaskGenerated(maskDataUrl.split(',')[1]); // Remove data:image/png;base64, prefix
    }, [onMaskGenerated]);

    const clearMask = useCallback(() => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const ctx = overlayCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        onMaskGenerated('');
    }, [onMaskGenerated]);

    // 이미지 로딩
    useEffect(() => {
        if (!imageUrl) {
            setImageLoaded(false);
            return;
        }

        setImageLoaded(false);
        
        const img = new Image();
        imageRef.current = img;
        
        img.onload = () => {
            setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
            setImageLoaded(true);
        };

        img.onerror = () => {
            setImageLoaded(false);
        };

        img.src = imageUrl;
        
        return () => {
            if (imageRef.current) {
                imageRef.current.onload = null;
                imageRef.current.onerror = null;
            }
        };
    }, [imageUrl]);

    // Canvas 설정
    useEffect(() => {
        if (!imageLoaded || !imageRef.current) return;

        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        
        if (!canvas || !overlayCanvas) return;

        const containerWidth = 550;
        const containerHeight = 500;
        const { width: imgWidth, height: imgHeight } = imageDimensions;
        
        // 이미지 비율 계산 (컨테이너에 맞게 fit)
        const imgAspectRatio = imgWidth / imgHeight;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let canvasWidth, canvasHeight;
        if (imgAspectRatio > containerAspectRatio) {
            // 이미지가 더 넓음 - 너비를 컨테이너에 맞춤
            canvasWidth = containerWidth;
            canvasHeight = containerWidth / imgAspectRatio;
        } else {
            // 이미지가 더 높음 - 높이를 컨테이너에 맞춤
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * imgAspectRatio;
        }
        
        // Canvas 크기 설정
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        overlayCanvas.width = canvasWidth;
        overlayCanvas.height = canvasHeight;

        // 이미지 그리기 (컨테이너에 맞게)
        const ctx = canvas.getContext('2d');
        if (ctx && imageRef.current) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(imageRef.current, 0, 0, canvasWidth, canvasHeight);
        }
    }, [imageLoaded, imageDimensions]);

    const showLoading = !imageLoaded;

    return (
        <div className={`space-y-4 ${className}`}>
            {showLoading ? (
                <div className="flex items-center justify-center h-[600px] bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">이미지를 로딩중...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* 도구 모음 */}
                    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                        <div className="flex gap-2">
                            <Button
                                variant={tool === 'brush' ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setTool('brush')}
                                leftIcon={<IconBrush size={16} />}
                            >
                                브러시
                            </Button>
                            <Button
                                variant={tool === 'eraser' ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setTool('eraser')}
                                leftIcon={<IconEraser size={16} />}
                            >
                                지우개
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-300">크기:</label>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-20"
                            />
                            <span className="text-sm text-gray-400 min-w-[2rem]">{brushSize}px</span>
                        </div>

                        <Button
                            variant="warning"
                            size="sm"
                            onClick={clearMask}
                            leftIcon={<IconRefresh size={16} />}
                        >
                            초기화
                        </Button>

                        {onSelectNewImage && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onSelectNewImage}
                                leftIcon={<IconDownload size={16} />}
                            >
                                다른 이미지 선택
                            </Button>
                        )}
                    </div>

                    {/* 캔버스 영역 */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden w-[550px] h-[500px] flex items-center justify-center mx-auto">
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                className="block max-w-full max-h-full"
                                style={{ 
                                    border: '1px solid #374151',
                                    borderRadius: '8px'
                                }}
                            />
                            <canvas
                                ref={overlayCanvasRef}
                                className="absolute top-0 left-0 cursor-crosshair"
                                style={{ 
                                    border: '1px solid #374151',
                                    borderRadius: '8px'
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={() => setIsDrawing(false)}
                            />
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};