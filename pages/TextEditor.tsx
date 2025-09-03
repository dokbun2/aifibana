import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconUpload, IconEdit, IconDownload, IconLoader2, IconSparkles, IconWand } from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Input';
import { Image } from 'lucide-react';

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-emerald-500" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

interface TextEditorProps {
    ai: GoogleGenAI;
}

export const TextEditor: React.FC<TextEditorProps> = ({ ai }) => {
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('배경을 바다로 바꿔주세요');
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSourceImage(e.target?.result as string);
                setResultImage(null);
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
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = async () => {
        if (!sourceImage || !editPrompt.trim()) return;
        
        setIsLoading(true);
        setLoadingMessage("AI가 이미지를 편집하고 있습니다...");
        
        const prompt = `Edit this image based on the following instruction: "${editPrompt}". 
        Maintain the overall composition and quality while applying the requested changes naturally and realistically.`;
        
        // Extract base64 data
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        
        const resultBase64 = await callImageApi(prompt, [{data: base64Data, type: mimeType}]);
        
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

    const promptSuggestions = [
        "배경을 바다로 바꿔주세요",
        "하늘을 노을로 만들어주세요",
        "사람의 옷 색깔을 빨간색으로 바꿔주세요",
        "흑백 사진으로 변환해주세요",
        "빈티지 필터를 적용해주세요",
        "배경을 흐리게 처리해주세요",
        "더 밝게 만들어주세요",
        "봄 느낌으로 편집해주세요"
    ];

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                <IconEdit size={36} className="text-emerald-500" />
                <span className="bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                    글로 쓰는 편집기
                </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Upload */}
                    <Card variant="elevated" className="p-6">
                        <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="text-emerald-500">1.</span> 편집할 이미지 업로드
                        </h3>
                        <div 
                            className="border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-emerald-500 transition-all duration-300 p-6"
                            onClick={() => document.getElementById('editor-file-input')?.click()}
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
                                    <p className="text-gray-400 text-sm">편집할 이미지를 업로드하세요</p>
                                </>
                            )}
                            <input 
                                type="file" 
                                id="editor-file-input" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                        </div>
                    </Card>

                    {/* Text Input */}
                    <Card variant="elevated" className="p-6">
                        <h3 className="font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="text-emerald-500">2.</span> 편집 명령어 입력
                        </h3>
                        <Textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="어떻게 편집하고 싶은지 자연스럽게 써주세요..."
                            rows={4}
                            variant="filled"
                            className="mb-4"
                        />
                        
                        {/* Quick Suggestions */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-400">빠른 제안</h4>
                            <div className="flex flex-wrap gap-2">
                                {promptSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setEditPrompt(suggestion)}
                                        className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full hover:bg-emerald-500/30 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Edit Button */}
                    <Button
                        onClick={handleEdit}
                        disabled={!sourceImage || !editPrompt.trim() || isLoading}
                        isLoading={isLoading}
                        size="lg"
                        fullWidth
                        variant="primary"
                        leftIcon={!isLoading && <IconWand size={20} />}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-2 border-white/80 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                    >
                        {isLoading ? '편집 중...' : '이미지 편집하기'}
                    </Button>

                    {/* Tips */}
                    <Card variant="glass" className="p-4">
                        <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <IconSparkles size={16} />
                            편집 팁
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-500">
                            <li>• 구체적인 명령어를 사용하세요 (예: "하늘을 파란색으로")</li>
                            <li>• 한 번에 하나의 편집 요청을 해보세요</li>
                            <li>• 자연스러운 한국어 문장으로 작성하세요</li>
                            <li>• 색상, 배경, 효과 등을 명확하게 지정하세요</li>
                        </ul>
                    </Card>
                </div>

                {/* Result Section */}
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
                            <img src={resultImage} alt="Result" className="w-full h-full rounded-md object-contain p-4" />
                            <div className="absolute bottom-4 flex gap-2">
                                <Button
                                    onClick={() => downloadImage(resultImage, 'edited-image.png')}
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