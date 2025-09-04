import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconUpload, IconEdit, IconDownload, IconLoader2, IconWand, IconPlus, IconX, IconTrash, IconSparkles } from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Image } from 'lucide-react';

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-emerald-500" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

interface TextEditorProps {
    ai: GoogleGenAI;
    initialImage?: string;
    initialPrompt?: string;
    onNavigateToShot?: () => void;
}

interface PromptBlock {
    key: string;
    value: string;
    id: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({ ai, initialImage, initialPrompt, onNavigateToShot }) => {
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Set initial values when received from ShotGenerator
    useEffect(() => {
        if (initialImage) {
            // Convert base64 to data URL format
            setSourceImage(`data:image/png;base64,${initialImage}`);
            setResultImage(null);
        }
        if (initialPrompt) {
            // Parse block prompt into individual blocks
            const blocks = initialPrompt.split(';').map(b => b.trim()).filter(b => b.includes(':'));
            const parsedBlocks = blocks.map((block, index) => {
                const parts = block.split(/:(.*)/s);
                if (parts.length >= 2) {
                    return {
                        key: parts[0].trim().toUpperCase(),
                        value: parts[1].trim(),
                        id: `block-${Date.now()}-${index}`
                    };
                }
                return null;
            }).filter(b => b !== null) as PromptBlock[];
            
            if (parsedBlocks.length > 0) {
                setPromptBlocks(parsedBlocks);
            } else {
                // Default blocks if no prompt provided
                setPromptBlocks([
                    { key: 'STYLE', value: '원본 스타일 유지', id: `block-${Date.now()}-1` },
                    { key: 'EDIT', value: '배경을 바꿔주세요', id: `block-${Date.now()}-2` }
                ]);
            }
        } else if (!initialPrompt && !initialImage) {
            // Default blocks for new edit
            setPromptBlocks([
                { key: 'STYLE', value: '원본 스타일 유지', id: `block-${Date.now()}-1` },
                { key: 'EDIT', value: '배경을 바다로 바꿔주세요', id: `block-${Date.now()}-2` }
            ]);
        }
    }, [initialImage, initialPrompt]);

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

    const updateBlock = (id: string, field: 'key' | 'value', value: string) => {
        setPromptBlocks(prev => prev.map(block => 
            block.id === id ? { ...block, [field]: value } : block
        ));
    };

    const addBlock = () => {
        const newBlock: PromptBlock = {
            key: 'NEW',
            value: '',
            id: `block-${Date.now()}`
        };
        setPromptBlocks(prev => [...prev, newBlock]);
    };

    const removeBlock = (id: string) => {
        setPromptBlocks(prev => prev.filter(block => block.id !== id));
    };

    const handleEdit = async () => {
        if (!sourceImage || promptBlocks.length === 0) return;
        
        setIsLoading(true);
        setLoadingMessage("AI가 이미지를 편집하고 있습니다...");
        
        // Assemble prompt from blocks
        const editInstruction = promptBlocks
            .map(block => `${block.key}: ${block.value}`)
            .join('; ');
        
        const prompt = `Edit this image based on the following instructions: ${editInstruction}. 
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

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-center flex items-center gap-3">
                    <IconEdit size={36} className="text-emerald-500" />
                    <span className="bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                        글로 쓰는 편집기
                    </span>
                </h2>
                <Button
                    onClick={onNavigateToShot}
                    variant="ghost"
                    leftIcon={<IconSparkles size={20} />}
                    className="text-orange-400 hover:text-orange-300"
                >
                    샷 이미지 생성으로 이동
                </Button>
            </div>

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
                                            setPromptBlocks([
                                                { key: 'STYLE', value: '원본 스타일 유지', id: `block-${Date.now()}-1` },
                                                { key: 'EDIT', value: '배경을 바꿔주세요', id: `block-${Date.now()}-2` }
                                            ]);
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

                    {/* Block Editor */}
                    <Card variant="elevated" className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                                <span className="text-emerald-500">2.</span> 블록 편집 명령어
                            </h3>
                            <Button
                                onClick={addBlock}
                                variant="ghost"
                                size="xs"
                                leftIcon={<IconPlus size={16} />}
                                className="text-emerald-400 hover:text-emerald-300"
                            >
                                블록 추가
                            </Button>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {promptBlocks.map((block) => (
                                <div key={block.id} className="flex gap-2 items-start group">
                                    <input
                                        type="text"
                                        value={block.key}
                                        onChange={(e) => updateBlock(block.id, 'key', e.target.value.toUpperCase())}
                                        placeholder="KEY"
                                        className="w-1/4 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-emerald-400 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                    />
                                    <input
                                        type="text"
                                        value={block.value}
                                        onChange={(e) => updateBlock(block.id, 'value', e.target.value)}
                                        placeholder="값을 입력하세요..."
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                    />
                                    <button
                                        onClick={() => removeBlock(block.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </div>
                            ))}
                            
                            {promptBlocks.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="mb-2">편집 블록이 없습니다</p>
                                    <Button
                                        onClick={addBlock}
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<IconPlus size={16} />}
                                    >
                                        첫 번째 블록 추가하기
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Edit Button */}
                    <Button
                        onClick={handleEdit}
                        disabled={!sourceImage || promptBlocks.length === 0 || isLoading}
                        isLoading={isLoading}
                        size="lg"
                        fullWidth
                        variant="primary"
                        leftIcon={!isLoading && <IconWand size={20} />}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-2 border-white/80 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                    >
                        {isLoading ? '편집 중...' : '이미지 편집하기'}
                    </Button>

                    {/* Block Guide */}
                    <Card variant="glass" className="p-4">
                        <h4 className="font-semibold text-gray-300 mb-2">편집 블록 가이드</h4>
                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex gap-2">
                                <span className="text-emerald-400 font-mono">STYLE:</span>
                                <span>스타일 유지 또는 변경</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-emerald-400 font-mono">EDIT:</span>
                                <span>수정할 내용</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-emerald-400 font-mono">SCENE:</span>
                                <span>장면 변경</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-emerald-400 font-mono">COLOR:</span>
                                <span>색상 조정</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-emerald-400 font-mono">EFFECT:</span>
                                <span>효과 추가</span>
                            </div>
                        </div>
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