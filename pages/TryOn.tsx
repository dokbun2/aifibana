import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconUpload, IconHanger, IconDownload, IconLoader2, IconSparkles } from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Image } from 'lucide-react';

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
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [clothingImage, setClothingImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

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
            alert("이미지 처리 중 오류가 발생했습니다. API 할당량을 확인하거나 잠시 후 다시 시도해주세요.");
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
        setLoadingMessage("AI가 옷을 입혀보고 있습니다...");
        
        const prompt = `Virtual try-on: Take the clothing item from the second image and realistically place it on the person in the first image. 
        Maintain the person's pose, body shape, and background. The clothing should fit naturally with proper wrinkles, shadows, and lighting. 
        Ensure the clothing adapts to the person's body shape and posture. Keep the person's face, hair, and other features unchanged.`;
        
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
            setResultImage(`data:image/png;base64,${resultBase64}`);
        }
        
        setIsLoading(false);
    };

    const downloadImage = (imageData: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                <IconHanger size={36} className="text-cyan-500" />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                    가상 옷 입히기
                </span>
            </h2>

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
                                className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-cyan-500 transition-all duration-300 p-6"
                                onClick={() => document.getElementById('person-file-input')?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handlePersonDrop}
                            >
                                {personImage ? (
                                    <div className="relative">
                                        <img src={personImage} alt="Person" className="w-full h-48 object-contain rounded-lg" />
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
                                className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-cyan-500 transition-all duration-300 p-6"
                                onClick={() => document.getElementById('clothing-file-input')?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleClothingDrop}
                            >
                                {clothingImage ? (
                                    <div className="relative">
                                        <img src={clothingImage} alt="Clothing" className="w-full h-48 object-contain rounded-lg" />
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
    );
};