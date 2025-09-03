import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconUpload, IconTransform, IconDownload, IconLoader2, IconCamera } from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Image } from 'lucide-react';

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

interface AngleConverterProps {
    ai: GoogleGenAI;
}

export const AngleConverter: React.FC<AngleConverterProps> = ({ ai }) => {
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [convertedImage, setConvertedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAngle, setSelectedAngle] = useState<string>('front');

    const angles = [
        { id: 'front', name: '정면', description: '얼굴 정면 각도' },
        { id: 'side', name: '측면', description: '90도 측면 프로필' },
        { id: 'three-quarter', name: '3/4 각도', description: '45도 각도' },
        { id: 'back', name: '후면', description: '뒷모습' },
        { id: 'top', name: '상단', description: '위에서 내려다본 각도' },
        { id: 'bottom', name: '하단', description: '아래에서 올려다본 각도' }
    ];

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSourceImage(e.target?.result as string);
                setConvertedImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSourceImage(e.target?.result as string);
                setConvertedImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConvert = async () => {
        if (!sourceImage) return;
        
        setIsLoading(true);
        
        // 선택된 앵글에 따른 프롬프트 생성
        const anglePrompts: {[key: string]: string} = {
            'front': 'Convert this image to show the subject from a direct front view, facing camera straight on',
            'side': 'Convert this image to show the subject from a 90-degree side profile view',
            'three-quarter': 'Convert this image to show the subject from a 45-degree three-quarter angle view',
            'back': 'Convert this image to show the subject from behind, back view',
            'top': 'Convert this image to show the subject from a top-down bird\'s eye view',
            'bottom': 'Convert this image to show the subject from a low angle looking up'
        };

        const prompt = `${anglePrompts[selectedAngle]}. Maintain the same character, clothing, style, and environment. Only change the viewing angle.`;
        
        // base64 데이터 추출
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        
        const resultBase64 = await callImageApi(prompt, [{data: base64Data, type: mimeType}]);
        
        if (resultBase64) {
            setConvertedImage(`data:image/png;base64,${resultBase64}`);
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
                <IconCamera size={36} className="text-purple-500" />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    이미지 앵글 변환
                </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 섹션 */}
                <div className="space-y-6">
                    <Card variant="elevated" className="p-6">
                        <h3 className="font-semibold mb-4 text-gray-200">1. 원본 이미지 업로드</h3>
                        <div 
                            className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-all duration-300 p-8"
                            onClick={() => document.getElementById('angle-file-input')?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {sourceImage ? (
                                <div className="relative">
                                    <img src={sourceImage} alt="Source" className="w-full h-64 object-contain rounded-lg" />
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSourceImage(null);
                                            setConvertedImage(null);
                                        }}
                                        variant="danger"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                    >
                                        제거
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <IconUpload size={48} className="mx-auto mb-2 text-gray-500" />
                                    <p className="text-gray-400">이미지를 드래그하거나 클릭하여 업로드</p>
                                </>
                            )}
                            <input 
                                type="file" 
                                id="angle-file-input" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                        </div>
                    </Card>

                    <Card variant="elevated" className="p-6">
                        <h3 className="font-semibold mb-4 text-gray-200">2. 변환할 앵글 선택</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {angles.map((angle) => (
                                <button
                                    key={angle.id}
                                    onClick={() => setSelectedAngle(angle.id)}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        selectedAngle === angle.id
                                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                            : 'border-gray-700 hover:border-purple-500/50 text-gray-400'
                                    }`}
                                >
                                    <div className="font-medium">{angle.name}</div>
                                    <div className="text-xs opacity-75">{angle.description}</div>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Button
                        onClick={handleConvert}
                        disabled={!sourceImage || isLoading}
                        isLoading={isLoading}
                        size="lg"
                        fullWidth
                        variant="primary"
                        leftIcon={!isLoading && <IconTransform size={20} />}
                    >
                        {isLoading ? '변환 중...' : '앵글 변환하기'}
                    </Button>
                </div>

                {/* 결과 섹션 */}
                <Card variant="glass" padding="none" className="h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                    {!convertedImage && !isLoading && (
                        <div className="text-center text-gray-500 p-8">
                            <Image size={48} className="mx-auto mb-4 opacity-50" />
                            <p>변환된 이미지가 여기에 표시됩니다.</p>
                        </div>
                    )}
                    {isLoading && <Loader message="이미지를 변환하고 있습니다..." />}
                    {convertedImage && !isLoading && (
                        <>
                            <img src={convertedImage} alt="Converted" className="w-full h-full rounded-md object-contain p-4" />
                            <div className="absolute bottom-4 flex gap-2">
                                <Button
                                    onClick={() => downloadImage(convertedImage, `angle-${selectedAngle}.png`)}
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