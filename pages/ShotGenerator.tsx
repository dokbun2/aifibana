import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import {
    IconUpload, IconRocket, IconEdit, IconZoomIn, IconDownload,
    IconX, IconChevronDown, IconMaximize, IconSparkles, IconLoader2,
    IconAlertCircle, IconQuestionMark
} from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Input';
import { Image } from 'lucide-react';
import { handleApiError, checkRateLimit, trackApiUsage } from '../utils/errorHandler';
import { DEFAULT_MODELS } from '../config/models';
import QuotaStatus from '../components/QuotaStatus';
import HelpModal from '../components/HelpModal';

const MAX_SHOT_FILES = 8;

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

interface ShotGeneratorProps {
    ai: GoogleGenAI;
    onEditImage?: (imageData: string, prompt: string) => void;
    onNavigateToEditor?: () => void;
}

export const ShotGenerator: React.FC<ShotGeneratorProps> = ({ ai, onEditImage, onNavigateToEditor }) => {
    const [shotFiles, setShotFiles] = useState<{name: string, data: string, type: string}[]>([]);
    const [shotPrompt, setShotPrompt] = useState('STYLE: 애니메이션스타일;\nMEDIUM: 사실적인 디지털 사진;\nCAMERA: 전신샷;\nSCENE: 젊은 남녀 둘이 손을 잡고 한강을 산책하고 있다');
    const [shotResult, setShotResult] = useState<string | null>(null);
    const [isShotLoading, setIsShotLoading] = useState(false);
    const [shotLoadingMessage, setShotLoadingMessage] = useState('');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const resizeImage = (base64Data: string, targetWidth: number, targetHeight: number): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL('image/png').split(',')[1]);
            };
            img.src = `data:image/png;base64,${base64Data}`;
        });
    };

    const downloadImage = async (base64Data: string, filename = 'aifi-banana-image.png', resize?: {width: number, height: number}) => {
        let finalData = base64Data;
        if (resize) {
            finalData = await resizeImage(base64Data, resize.width, resize.height);
        }
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${finalData}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const processAndAssemblePrompt = useCallback(async (promptText: string) => {
        if (!ai) return null;
        const blocks = promptText.split(';').map(b => b.trim()).filter(b => b.includes(':'));
        const promptData: { [key: string]: string } = {};
        const koreanValues: string[] = [];
        const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

        blocks.forEach(block => {
            const parts = block.split(/:(.*)/s);
            if (parts.length >= 2) {
                const key = parts[0].trim().toUpperCase();
                const value = parts[1].trim();
                if (key && value) {
                    promptData[key] = value;
                    if (koreanRegex.test(value)) koreanValues.push(value);
                }
            }
        });

        if (koreanValues.length > 0) {
            try {
                const uniqueKoreanValues = Array.from(new Set(koreanValues));
                const prompt = `Translate the following Korean phrases to English. Provide only the translated text, preserving the original order. Input: [${uniqueKoreanValues.join(", ")}]`;
                const result = await ai.models.generateContent({ model: DEFAULT_MODELS.TRANSLATION, contents: prompt });
                const translatedArray = result.text.replace(/\[|\]/g, '').split(',').map(t => t.trim());
                const translationMap: { [key: string]: string } = {};
                uniqueKoreanValues.forEach((original, index) => {
                    translationMap[original] = translatedArray[index] || original;
                });
                Object.keys(promptData).forEach(key => {
                    if (translationMap[promptData[key]]) {
                        promptData[key] = translationMap[promptData[key]];
                    }
                });
            } catch (error) {
                console.error("Translation failed:", error);
                alert("프롬프트 번역에 실패했습니다.");
                return null;
            }
        }
        return Object.entries(promptData).map(([key, value]) => `${key}: ${value}`).join('; ');
    }, [ai]);

    const callImageApi = useCallback(async (prompt: string, images: {data: string, type: string}[]) => {
        if (!ai) return null;

        // Check rate limit before making request
        const rateCheck = checkRateLimit();
        if (!rateCheck.canProceed) {
            setErrorMessage(rateCheck.message || '요청 제한에 도달했습니다.');
            setShowHelpModal(true);
            return null;
        }

        try {
            // Track API usage
            trackApiUsage();
            const imageParts = images.map(img => ({
                inlineData: { data: img.data, mimeType: img.type || 'image/jpeg' }
            }));
            const contents = { parts: [...imageParts, { text: prompt }] };

            const response = await ai.models.generateContent({
                model: DEFAULT_MODELS.IMAGE_GENERATION,
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
        } catch (error: any) {
            console.error("Image API Error:", error);
            const errorResponse = handleApiError(error);
            setErrorMessage(errorResponse.userMessage);

            // Show help modal for quota errors
            if (errorResponse.action === 'upgrade' && errorResponse.showHelp) {
                setShowHelpModal(true);
            }

            return null;
        }
    }, [ai]);

    const handleFileChange = useCallback(async (files: FileList | null) => {
        if (!files) return;
        const fileList = Array.from(files);
        const newFiles = fileList.slice(0, MAX_SHOT_FILES - shotFiles.length);
        const processedFiles = await Promise.all(newFiles.map(async (file) => ({ name: file.name, ...(await fileToBase64(file)) })));
        setShotFiles(prev => [...prev, ...processedFiles]);
    }, [shotFiles]);
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFileChange(e.dataTransfer.files);
    }, [handleFileChange]);

    const removeShotFile = (index: number) => {
        setShotFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onShotGenerate = async () => {
        if (shotFiles.length === 0) { alert('이미지를 먼저 업로드해주세요.'); return; }
        if (!shotPrompt.trim()) { alert('블록화 프롬프트를 입력해주세요.'); return; }
        setIsShotLoading(true);
        setShotLoadingMessage("프롬프트를 분석하고 번역하는 중...");
        setShotResult(null);

        const finalPrompt = await processAndAssemblePrompt(shotPrompt);
        if (!finalPrompt) { setIsShotLoading(false); return; }

        setShotLoadingMessage("AI가 새로운 샷을 구상하고 있습니다...");
        const apiPrompt = `Maintain character and style consistency from uploaded images. Create a new image based on: ${finalPrompt}`;
        const resultBase64 = await callImageApi(apiPrompt, shotFiles);

        if (resultBase64) setShotResult(resultBase64);
        setIsShotLoading(false);
    };

    const onShotUpscale = async () => {
        if (!shotResult) return;
        setIsShotLoading(true);
        setShotLoadingMessage("이미지를 업스케일링 하는 중...");
        
        const prompt = "Upscale this image to a higher resolution (e.g., 2x), enhancing details and clarity without changing the content or style.";
        const resultBase64 = await callImageApi(prompt, [{data: shotResult, type: 'image/png'}]);

        if (resultBase64) setShotResult(resultBase64);
        setIsShotLoading(false);
    };

    return (
        <>
            {/* Help Modal */}
            <HelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                initialSection="quota"
            />

            {zoomedImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
                    <div className="relative max-w-7xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img src={`data:image/png;base64,${zoomedImage}`} alt="Zoomed Image" className="w-full h-full object-contain" />
                        <button 
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-gray-900/80 backdrop-blur rounded-full text-white hover:bg-gray-800"
                        >
                            <IconX size={24} />
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto p-4 md:p-8">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-center flex items-center gap-3">
                            <IconSparkles size={36} className="text-orange-500" />
                            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                                일관성 있는 샷 이미지 만들기
                            </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowHelpModal(true)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <IconQuestionMark size={20} />
                            </Button>
                            <Button
                                onClick={onNavigateToEditor}
                                variant="ghost"
                                leftIcon={<IconEdit size={20} />}
                                className="text-emerald-400 hover:text-emerald-300"
                            >
                                이미지 편집기로 이동
                            </Button>
                        </div>
                    </div>

                    {/* Quota Status */}
                    <div className="w-full">
                        <QuotaStatus
                            onUpgradeClick={() => setShowHelpModal(true)}
                        />
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <IconAlertCircle size={20} className="text-red-500 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-400 whitespace-pre-line">{errorMessage}</p>
                                    <button
                                        onClick={() => setErrorMessage(null)}
                                        className="text-xs text-gray-400 hover:text-white mt-2"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Card variant="elevated" className="p-6">
                            <label className="font-semibold mb-4 block text-gray-200">1. 이미지 업로드 (최대 {MAX_SHOT_FILES}개)</label>
                            <div 
                                className={`border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-orange-500 transition-all duration-300 ${shotFiles.length === 0 ? 'p-8' : 'p-4'}`}
                                onClick={() => {
                                    if (shotFiles.length < MAX_SHOT_FILES) {
                                        const input = document.getElementById('shot-file-input') as HTMLInputElement;
                                        if (input) {
                                            input.click();
                                        }
                                    }
                                }}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                {shotFiles.length === 0 ? (
                                    <>
                                        <IconUpload size={48} className="mx-auto mb-2 text-gray-500" />
                                        <p className="text-gray-400">이미지를 여기에 드래그하거나 클릭하여 업로드</p>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {shotFiles.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    <img 
                                                        src={`data:${file.type};base64,${file.data}`} 
                                                        alt={file.name} 
                                                        className={`w-full h-24 object-cover rounded-lg shadow-lg ${index === 0 ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-gray-900' : ''}`} 
                                                    />
                                                    <button
                                                        className="absolute top-1 right-1 p-1.5 bg-red-500/90 backdrop-blur rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeShotFile(index);
                                                        }}
                                                    >
                                                        <IconX size={12} />
                                                    </button>
                                                    {index === 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-b-lg font-medium">
                                                            기준 이미지
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {shotFiles.length < MAX_SHOT_FILES && (
                                                <div 
                                                    className="border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center h-24 hover:border-orange-500/50 transition-colors cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const input = document.getElementById('shot-file-input') as HTMLInputElement;
                                                        if (input) {
                                                            input.click();
                                                        }
                                                    }}
                                                >
                                                    <IconUpload size={24} className="text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                        {shotFiles.length < MAX_SHOT_FILES && (
                                            <p className="text-xs text-gray-500">클릭하여 이미지 추가 ({shotFiles.length}/{MAX_SHOT_FILES})</p>
                                        )}
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    id="shot-file-input" 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*" 
                                    onChange={e => handleFileChange(e.target.files)} 
                                />
                            </div>
                        </Card>

                        <Textarea
                            label="2. 블록화 프롬프트 입력"
                            rows={8}
                            variant="filled"
                            placeholder="각 요소를 세미콜론(;)으로 구분하여 입력하세요."
                            value={shotPrompt}
                            onChange={e => setShotPrompt(e.target.value)}
                            hint="세미콜론(;)으로 각 요소를 구분하세요"
                        />

                        <Button 
                            onClick={onShotGenerate} 
                            disabled={shotFiles.length === 0} 
                            isLoading={isShotLoading}
                            size="lg"
                            fullWidth
                            variant="primary"
                            leftIcon={!isShotLoading && <IconRocket size={20} />}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-2 border-white/80 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                        >
                            {isShotLoading ? '생성 중...' : '이미지 생성하기'}
                        </Button>
                    </div>

                    <Card variant="glass" padding="none" className="h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
                        {!shotResult && !isShotLoading && (
                            <div className="text-center text-gray-500 p-8">
                                <Image size={48} className="mx-auto mb-4 opacity-50" />
                                <p>생성된 이미지가 여기에 표시됩니다.</p>
                            </div>
                        )}
                        {isShotLoading && <Loader message={shotLoadingMessage} />}
                        {shotResult && !isShotLoading && (
                            <>
                                <img src={`data:image/png;base64,${shotResult}`} alt="Generated shot" className="w-full h-full rounded-md object-contain" />
                                <div className="absolute bottom-4 flex flex-wrap gap-2 justify-center">
                                    <Button 
                                        onClick={() => onEditImage && onEditImage(shotResult, shotPrompt)}
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<IconEdit size={18} />}
                                    >
                                        수정
                                    </Button>
                                    <Button 
                                        onClick={onShotUpscale} 
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<IconMaximize size={18} />}
                                    >
                                        업스케일
                                    </Button>
                                    <Button 
                                        onClick={() => setZoomedImage(shotResult)} 
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<IconZoomIn size={18} />}
                                    >
                                        확대
                                    </Button>
                                    <div className="relative group">
                                        <Button 
                                            variant="success"
                                            size="sm"
                                            leftIcon={<IconDownload size={18} />}
                                            rightIcon={<IconChevronDown size={16} />}
                                        >
                                            저장
                                        </Button>
                                        <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl p-2 whitespace-nowrap transition-all duration-200 border border-gray-700">
                                            <button onClick={() => downloadImage(shotResult)} className="block w-full text-left px-4 py-2 hover:bg-gray-700/50 rounded text-sm transition-colors">원본 크기</button>
                                            <button onClick={() => downloadImage(shotResult, 'aifi-1920x1080.png', {width: 1920, height: 1080})} className="block w-full text-left px-4 py-2 hover:bg-gray-700/50 rounded text-sm transition-colors">1920×1080 (FHD)</button>
                                            <button onClick={() => downloadImage(shotResult, 'aifi-1280x720.png', {width: 1280, height: 720})} className="block w-full text-left px-4 py-2 hover:bg-gray-700/50 rounded text-sm transition-colors">1280×720 (HD)</button>
                                            <button onClick={() => downloadImage(shotResult, 'aifi-1024x1024.png', {width: 1024, height: 1024})} className="block w-full text-left px-4 py-2 hover:bg-gray-700/50 rounded text-sm transition-colors">1024×1024 (Square)</button>
                                            <button onClick={() => downloadImage(shotResult, 'aifi-512x512.png', {width: 512, height: 512})} className="block w-full text-left px-4 py-2 hover:bg-gray-700/50 rounded text-sm transition-colors">512×512 (Icon)</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
};