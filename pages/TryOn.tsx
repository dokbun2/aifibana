import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconUpload, IconHanger, IconDownload, IconLoader2, IconSparkles, IconPhoto, IconEdit } from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ImageEditor } from '../components/ImageEditor';
import { DrawableImageUpload } from '../components/DrawableImageUpload';
import { generateCompositeImage, editImage as editImageAPI } from '../services/geminiService';
import type { UploadedImage, GeneratedResult, CompositeImageRequest, EditImageRequest, TabType } from '../types';

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-cyan-500" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

interface TryOnProps {
    ai: GoogleGenAI;
}

export const TryOn: React.FC<TryOnProps> = ({ ai }) => {
    // 탭 관리
    const [activeTab, setActiveTab] = useState<TabType>('tryOn');
    
    // 가상 착용 상태
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [clothingImage, setClothingImage] = useState<string | null>(null);
    
    // 이미지 합성 상태
    const [baseImage, setBaseImage] = useState<UploadedImage | null>(null);
    const [overlayImage, setOverlayImage] = useState<UploadedImage | null>(null);
    const [compositePrompt, setCompositePrompt] = useState<string>('');
    const [drawnArea, setDrawnArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    
    // 이미지 편집 상태
    const [editImage, setEditImage] = useState<UploadedImage | null>(null);
    const [maskData, setMaskData] = useState<string>('');
    const [editPrompt, setEditPrompt] = useState<string>('');
    
    // 공통 상태
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [results, setResults] = useState<GeneratedResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fileToBase64 = (file: File): Promise<{ data: string; type: string }> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve({data: reader.result.split(',')[1], type: file.type});
            } else {
                reject(new Error("File could not be read as a base64 string."));
            }
        };
        reader.onerror = error => reject(error);
    });

    const convertToUploadedImage = (file: File): Promise<UploadedImage> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64String = reader.result.split(',')[1];
                
                resolve({
                    base64: base64String,
                    preview: reader.result, // Use data URL directly instead of blob URL
                    mimeType: file.type,
                });
            } else {
                reject(new Error("File could not be read as a base64 string."));
            }
        };
        
        reader.onerror = error => {
            reject(error);
        };
    });

    const callImageApi = useCallback(async (prompt: string, images: {data: string, type: string}[]) => {
        if (!ai) return null;
        try {
            const imageParts = images.map(img => ({
                inlineData: { data: img.data, mimeType: img.type || 'image/jpeg' }
            }));
            const contents = { parts: [...imageParts, { text: prompt }] };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: contents,
                config: { 
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 4096,
                    }
                },
            });
            
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
            throw new Error("API 응답에서 이미지를 찾을 수 없습니다.");
        } catch (error) {
            console.error("Image API Error:", error);
            alert("이미지 처리 중 오류발생. 구글 정책 제한 및 일일 할당량 확인 후 다시 시도해주세요");
            return null;
        }
    }, [ai]);

    const handlePersonImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPersonImage(e.target?.result as string);
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClothingImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setClothingImage(e.target?.result as string);
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePersonDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPersonImage(e.target?.result as string);
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClothingDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setClothingImage(e.target?.result as string);
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTryOn = async () => {
        if (!personImage || !clothingImage) return;
        
        setIsLoading(true);
        setError(null);
        setLoadingMessage("AI가 옷을 입혀보고 있습니다...");
        
        const prompt = `Virtual try-on: Take the clothing item from the second image and realistically place it on the person in the first image. 
        Maintain the person's pose, body shape, and background. The clothing should fit naturally with proper wrinkles, shadows, and lighting. 
        Ensure the clothing adapts to the person's body shape and posture. Keep the person's face, hair, and other features unchanged.`;
        
        try {
            // Extract base64 data
            const personData = personImage.split(',')[1];
            const personType = personImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
            const clothingData = clothingImage.split(',')[1];
            const clothingType = clothingImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
            
            const resultBase64 = await callImageApi(prompt, [
                {data: personData, type: personType},
                {data: clothingData, type: clothingType}
            ]);
            
            if (resultBase64) {
                const resultImageUrl = `data:image/png;base64,${resultBase64}`;
                setResultImage(resultImageUrl);
                
                const result: GeneratedResult = {
                    image: resultImageUrl,
                    text: null,
                    timestamp: Date.now(),
                    type: 'tryOn',
                };
                setResults(prev => [result, ...prev]);
            }
        } catch (error) {
            console.error('Try-on error:', error);
            setError('가상 착용 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const uploadedImage = await convertToUploadedImage(file);
                setBaseImage(uploadedImage);
                setResultImage(null);
                setError(null);
            } catch (error) {
                console.error('Base image upload error:', error);
                setError('이미지 업로드 중 오류가 발생했습니다.');
            }
        }
    };

    const handleOverlayImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const uploadedImage = await convertToUploadedImage(file);
                setOverlayImage(uploadedImage);
                setResultImage(null);
                setError(null);
            } catch (error) {
                console.error('Overlay image upload error:', error);
                setError('이미지 업로드 중 오류가 발생했습니다.');
            }
        }
    };

    const handleComposite = async () => {
        if (!baseImage || !compositePrompt.trim()) return;

        if (!overlayImage) {
            setError("추가 이미지를 업로드해주세요.");
            return;
        }

        if (!drawnArea) {
            setError("기본 이미지에 합성할 영역을 그려주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setLoadingMessage("AI가 이미지를 합성하고 있습니다...");

        try {
            // 드로잉 영역 정보를 포함한 프롬프트 생성
            const areaInfo = `Selected area: position (${Math.round(drawnArea.x)}, ${Math.round(drawnArea.y)}), size ${Math.round(drawnArea.width)}x${Math.round(drawnArea.height)} pixels.`;
            const enhancedPrompt = `${areaInfo}\n\nInstructions:\n1. Take the base image as the foundation\n2. In the marked area, seamlessly blend elements from the overlay image\n3. ${compositePrompt}\n4. Ensure natural lighting, perspective, and color matching`;

            const request: CompositeImageRequest = {
                baseImage,
                overlayImage,
                prompt: enhancedPrompt,
            };

            const result = await generateCompositeImage(ai, request);
            
            if (result.image) {
                setResultImage(result.image);
                setResults(prev => [result, ...prev]);
            }
        } catch (error) {
            console.error('Composite error:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('이미지 합성 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        
        if (file) {
            try {
                const uploadedImage = await convertToUploadedImage(file);
                
                setEditImage(uploadedImage);
                setResultImage(null);
                setError(null);
                setMaskData('');
            } catch (error) {
                console.error('Edit image upload error:', error);
                setError('이미지 업로드 중 오류가 발생했습니다.');
            }
        }
    };

    const handleImageEdit = async () => {
        if (!editImage || !editPrompt.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setLoadingMessage("AI가 이미지를 편집하고 있습니다...");
        
        try {
            const request: EditImageRequest = {
                baseImage: editImage,
                maskData: maskData || undefined,
                prompt: editPrompt,
            };
            
            const result = await editImageAPI(ai, request);
            
            if (result.image) {
                setResultImage(result.image);
                setResults(prev => [result, ...prev]);
            }
        } catch (error) {
            console.error('Edit error:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('이미지 편집 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const downloadImage = (imageData: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabClass = (tabName: TabType) =>
        `px-6 py-3 text-lg font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-t-md ${
            activeTab === tabName
                ? 'border-b-2 border-cyan-500 text-white bg-gray-800/50'
                : 'border-b-2 border-transparent text-gray-400 hover:text-white'
        }`;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                <IconHanger size={36} className="text-cyan-500" />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                    AI 이미지 스튜디오
                </span>
            </h2>

            {/* 탭 네비게이션 */}
            <div className="flex justify-center border-b border-gray-700 w-full max-w-lg mx-auto mb-8" role="tablist">
                <button 
                    className={tabClass('tryOn')} 
                    onClick={() => setActiveTab('tryOn')} 
                    id="tryOn-tab" 
                    role="tab" 
                    aria-controls="tryOn-panel" 
                    aria-selected={activeTab === 'tryOn'}
                >
                    가상 착용
                </button>
                <button 
                    className={tabClass('composite')} 
                    onClick={() => setActiveTab('composite')} 
                    id="composite-tab" 
                    role="tab" 
                    aria-controls="composite-panel" 
                    aria-selected={activeTab === 'composite'}
                >
                    이미지 합성
                </button>
                <button 
                    className={tabClass('edit')} 
                    onClick={() => setActiveTab('edit')} 
                    id="edit-tab" 
                    role="tab" 
                    aria-controls="edit-panel" 
                    aria-selected={activeTab === 'edit'}
                >
                    이미지 편집
                </button>
            </div>

            {/* 가상 착용 탭 */}
            <div className={`${activeTab === 'tryOn' ? 'block' : 'hidden'}`} id="tryOn-panel" role="tabpanel" aria-labelledby="tryOn-tab">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Person Image Upload */}
                            <Card variant="elevated" className="p-6">
                                <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                                    <span className="text-cyan-500">1.</span> 사람 이미지
                                </h3>
                                <div 
                                    className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-cyan-500 transition-all duration-300 p-6 flex flex-col items-center justify-center"
                                    style={{aspectRatio: '1'}}
                                    onClick={() => document.getElementById('person-file-input')?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handlePersonDrop}
                                >
                                    {personImage ? (
                                        <div className="relative">
                                            <img src={personImage} alt="Person" className="w-full h-full object-contain rounded-lg" />
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPersonImage(null);
                                                    setResultImage(null);
                                                }}
                                                variant="danger"
                                                size="xs"
                                                className="absolute top-2 right-2"
                                            >
                                                제거
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <IconUpload size={40} className="mx-auto mb-2 text-gray-500" />
                                            <p className="text-gray-400 text-sm">사람 이미지 업로드</p>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        id="person-file-input" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handlePersonImageChange} 
                                    />
                                </div>
                            </Card>

                            {/* Clothing Image Upload */}
                            <Card variant="elevated" className="p-6">
                                <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                                    <span className="text-cyan-500">2.</span> 옷 이미지
                                </h3>
                                <div 
                                    className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-cyan-500 transition-all duration-300 p-6 flex flex-col items-center justify-center"
                                    style={{aspectRatio: '1'}}
                                    onClick={() => document.getElementById('clothing-file-input')?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleClothingDrop}
                                >
                                    {clothingImage ? (
                                        <div className="relative">
                                            <img src={clothingImage} alt="Clothing" className="w-full h-full object-contain rounded-lg" />
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setClothingImage(null);
                                                    setResultImage(null);
                                                }}
                                                variant="danger"
                                                size="xs"
                                                className="absolute top-2 right-2"
                                            >
                                                제거
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <IconUpload size={40} className="mx-auto mb-2 text-gray-500" />
                                            <p className="text-gray-400 text-sm">옷 이미지 업로드</p>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        id="clothing-file-input" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleClothingImageChange} 
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Try-On Button */}
                        <Button
                            onClick={handleTryOn}
                            disabled={!personImage || !clothingImage || isLoading}
                            isLoading={isLoading}
                            size="lg"
                            fullWidth
                            variant="primary"
                            leftIcon={!isLoading && <IconSparkles size={20} />}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-2 border-white/80 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40"
                        >
                            {isLoading ? '옷을 입히는 중...' : '가상으로 입혀보기'}
                        </Button>

                        {/* Tips */}
                        <Card variant="glass" className="p-4">
                            <h4 className="font-semibold text-gray-300 mb-2">💡 최상의 결과를 위한 팁</h4>
                            <ul className="space-y-1 text-sm text-gray-500">
                                <li>• 사람 이미지는 전신 또는 상반신이 잘 보이는 사진을 사용하세요</li>
                                <li>• 옷 이미지는 평평하게 놓인 제품 사진이 가장 좋습니다</li>
                                <li>• 배경이 단순한 이미지일수록 더 좋은 결과를 얻을 수 있습니다</li>
                                <li>• 정면을 바라보는 포즈가 가장 자연스럽게 합성됩니다</li>
                            </ul>
                        </Card>
                    </div>

                    {/* Result Section */}
                    <Card variant="glass" padding="none" className="h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                        {!resultImage && !isLoading && (
                            <div className="text-center text-gray-500 p-8">
                                <IconHanger size={48} className="mx-auto mb-4 opacity-50" />
                                <p>가상으로 입혀본 결과가 여기에 표시됩니다</p>
                            </div>
                        )}
                        {isLoading && <Loader message={loadingMessage} />}
                        {resultImage && !isLoading && (
                            <>
                                <img src={resultImage} alt="Result" className="w-full h-full rounded-md object-contain p-4" />
                                <div className="absolute bottom-4 flex gap-2">
                                    <Button
                                        onClick={() => downloadImage(resultImage, 'virtual-tryon-result.png')}
                                        variant="success"
                                        size="sm"
                                        leftIcon={<IconDownload size={18} />}
                                    >
                                        다운로드
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>

            {/* 이미지 합성 탭 */}
            <div className={`${activeTab === 'composite' ? 'block' : 'hidden'}`} id="composite-panel" role="tabpanel" aria-labelledby="composite-tab">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Base Image with Drawing */}
                    <Card variant="elevated" className="p-6">
                        <DrawableImageUpload
                            imageFile={baseImage}
                            setImageFile={setBaseImage}
                            title="기본 이미지 (합성 영역 그리기)"
                            drawnArea={drawnArea}
                            setDrawnArea={setDrawnArea}
                        />
                    </Card>

                    {/* Overlay Image */}
                    <Card variant="elevated" className="p-6">
                        <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="text-purple-500">2.</span> 추가 이미지 (합성할 요소)
                        </h3>
                        <div
                            className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-all duration-300 flex flex-col items-center justify-center"
                            style={{height: '400px'}}
                            onClick={() => document.getElementById('overlay-file-input')?.click()}
                        >
                            {overlayImage ? (
                                <div className="relative">
                                    <img src={overlayImage.preview} alt="Overlay" className="w-full h-full object-contain rounded-lg" />
                                    <Button
                                        onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOverlayImage(null);
                                                    setResultImage(null);
                                                }}
                                                variant="danger"
                                                size="xs"
                                                className="absolute top-2 right-2"
                                            >
                                                제거
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <IconPhoto size={40} className="mx-auto mb-2 text-gray-500" />
                                            <p className="text-gray-400 text-sm">추가 이미지 업로드</p>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        id="overlay-file-input" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleOverlayImageUpload} 
                                    />
                                </div>
                    </Card>

                    {/* Result Section */}
                    <Card variant="elevated" className="p-6">
                        <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="text-purple-500">3.</span> 결과 이미지
                        </h3>
                        <div
                            className="border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-900"
                            style={{height: '400px'}}
                        >
                            {resultImage ? (
                                <img src={resultImage} alt="Result" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                                <div className="text-center p-6">
                                    <p className="text-gray-400 text-sm">
                                        {isLoading ? '이미지 합성 중...' : '합성된 이미지가 여기에 표시됩니다'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Prompt Input */}
                <Card variant="elevated" className="p-6 mt-6">
                    <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                        <span className="text-purple-500">4.</span> 합성 내용 설명
                    </h3>
                            <textarea
                                value={compositePrompt}
                                onChange={(e) => setCompositePrompt(e.target.value)}
                                placeholder="어떤 식으로 이미지를 합성하고 싶은지 자세히 설명해주세요. 예: '배경을 해변으로 바꿔주세요', '사진에 나비를 추가해주세요', '밤 풍경으로 변경해주세요'"
                                className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                maxLength={500}
                            />
                            <div className="text-right text-sm text-gray-400 mt-1">
                                {compositePrompt.length}/500
                            </div>
                        </Card>

                        {/* Composite Button */}
                        <Button
                            onClick={handleComposite}
                            disabled={!baseImage || !overlayImage || !drawnArea || !compositePrompt.trim() || isLoading}
                            isLoading={isLoading}
                            size="lg"
                            fullWidth
                            variant="primary"
                            leftIcon={!isLoading && <IconSparkles size={20} />}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 border-2 border-white/80 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
                        >
                            {isLoading ? '합성 중...' : '이미지 합성하기'}
                        </Button>

                        {/* Error Message */}
                        {error && (
                            <Card variant="glass" className="p-4 mt-4 border-red-500">
                                <p className="text-red-400 text-sm">{error}</p>
                            </Card>
                        )}

                        {/* Tips */}
                        <Card variant="glass" className="p-4 mt-4">
                            <h4 className="font-semibold text-gray-300 mb-2">💡 이미지 합성 팁</h4>
                            <ul className="space-y-1 text-sm text-gray-500">
                                <li>• 구체적이고 상세한 설명을 제공하면 더 좋은 결과를 얻을 수 있습니다</li>
                                <li>• 추가 이미지가 없어도 기본 이미지만으로도 합성이 가능합니다</li>
                                <li>• 배경 변경, 객체 추가, 스타일 변경 등 다양한 합성이 가능합니다</li>
                                <li>• 조명, 그림자, 원근감 등을 언급하면 더 자연스러운 결과를 얻을 수 있습니다</li>
                            </ul>
                        </Card>

                        {error && (
                            <Card variant="danger" className="p-4">
                                <p className="text-red-400">{error}</p>
                            </Card>
                        )}
            </div>

            {/* 이미지 편집 탭 */}
            <div className={`${activeTab === 'edit' ? 'block' : 'hidden'}`} id="edit-panel" role="tabpanel" aria-labelledby="edit-tab">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 좌측: 대형 이미지 편집 영역 */}
                    <div className="space-y-6">
                        {!editImage ? (
                            <Card variant="elevated" className="p-8 h-[600px] flex flex-col items-center justify-center">
                                <div 
                                    className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-all duration-300"
                                    onClick={() => document.getElementById('edit-file-input')?.click()}
                                >
                                    <IconUpload size={60} className="mb-4 text-gray-500" />
                                    <h3 className="text-xl font-semibold text-gray-300 mb-2">편집할 이미지 업로드</h3>
                                    <p className="text-gray-500 text-center">
                                        클릭하여 이미지를 업로드하고<br />
                                        브러시로 편집할 영역을 선택하세요
                                    </p>
                                    <input 
                                        type="file" 
                                        id="edit-file-input" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleEditImageUpload} 
                                    />
                                </div>
                            </Card>
                        ) : (
                            <ImageEditor
                                imageUrl={editImage.preview}
                                onMaskGenerated={setMaskData}
                                onSelectNewImage={() => setEditImage(null)}
                                className="h-[600px]"
                            />
                        )}

                        {/* 편집 내용 설명 - 이미지 업로드/편집 창 아래로 이동 */}
                        <Card variant="elevated" className="p-6">
                            <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                                <IconEdit className="text-orange-500" size={20} />
                                편집 내용 설명
                            </h3>
                            <textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="어떤 편집을 원하시나요? 예: '하늘을 밤하늘로 바꿔주세요', '배경을 바다로 변경해주세요', '꽃을 추가해주세요'"
                                className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                maxLength={500}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-sm text-gray-400">
                                    {editPrompt.length}/500
                                </div>
                                {maskData && (
                                    <div className="text-sm text-green-400 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        편집 영역 선택됨
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* 편집 버튼 - 편집 내용 설명 아래로 이동 */}
                        <Button
                            onClick={handleImageEdit}
                            disabled={!editImage || !editPrompt.trim() || isLoading}
                            isLoading={isLoading}
                            size="lg"
                            fullWidth
                            variant="primary"
                            leftIcon={!isLoading && <IconSparkles size={20} />}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-2 border-white/80 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                        >
                            {isLoading ? '편집 중...' : '이미지 편집하기'}
                        </Button>

                    </div>

                    {/* 우측: 결과 영역 */}
                    <div className="space-y-6">

                        {/* 결과 영역 */}
                        <Card variant="glass" padding="none" className="h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                            {!resultImage && !isLoading && (
                                <div className="text-center text-gray-500 p-8">
                                    <IconEdit size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>편집된 이미지가 여기에 표시됩니다</p>
                                </div>
                            )}
                            {isLoading && <Loader message={loadingMessage} />}
                            {resultImage && !isLoading && (
                                <>
                                    <img src={resultImage} alt="Edited Result" className="w-full h-full rounded-md object-contain p-4" />
                                    <div className="absolute bottom-4 flex gap-2">
                                        <Button
                                            onClick={() => downloadImage(resultImage, 'edited-result.png')}
                                            variant="success"
                                            size="sm"
                                            leftIcon={<IconDownload size={18} />}
                                        >
                                            다운로드
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Card>

                        {/* 팁 */}
                        <Card variant="glass" className="p-4">
                            <h4 className="font-semibold text-gray-300 mb-2">💡 이미지 편집 팁</h4>
                            <ul className="space-y-1 text-sm text-gray-500">
                                <li>• 녹색 브러시로 편집하고 싶은 영역을 칠해주세요</li>
                                <li>• 영역을 선택하지 않으면 전체 이미지가 편집됩니다</li>
                                <li>• 구체적인 설명을 제공하면 더 정확한 결과를 얻을 수 있습니다</li>
                                <li>• 지우개 도구로 선택 영역을 수정할 수 있습니다</li>
                            </ul>
                        </Card>

                        {error && (
                            <Card variant="danger" className="p-4">
                                <p className="text-red-400">{error}</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};