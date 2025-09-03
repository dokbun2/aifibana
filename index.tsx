/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from '@google/genai';
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import ApiSetup from './components/ApiSetup';
import { 
    IconUpload, 
    IconPhoto, 
    IconSettings, 
    IconRocket, 
    IconEdit, 
    IconZoomIn, 
    IconDownload, 
    IconX, 
    IconChevronDown,
    IconMaximize,
    IconWand,
    IconSparkles,
    IconPhotoPlus,
    IconPhotoEdit,
    IconLoader2
} from '@tabler/icons-react';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from './components/ui/Card';
import { Input, Textarea } from './components/ui/Input';
import { Upload, Image, Wand2, Sparkles } from 'lucide-react';

const MAX_SHOT_FILES = 8;

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

const App: React.FC = () => {
    // Global State
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [activeTab, setActiveTab] = useState('shot');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [needsApiKey, setNeedsApiKey] = useState(false);

    // "Shot" Tab State
    const [shotFiles, setShotFiles] = useState<{name: string, data: string, type: string}[]>([]);
    const [shotPrompt, setShotPrompt] = useState('STYLE: 애니메이션스타일;\nMEDIUM: 사실적인 디지털 사진;\nCAMERA: 전신샷;\nSCENE: 젊은 남녀 둘이 손을 잡고 한강을 산책하고 있다');
    const [shotResult, setShotResult] = useState<string | null>(null);
    const [isShotLoading, setIsShotLoading] = useState(false);
    const [shotLoadingMessage, setShotLoadingMessage] = useState('');

    // "Edit" Tab State
    const [editSourceImage, setEditSourceImage] = useState<string | null>(null);
    const [editBlocks, setEditBlocks] = useState<{key: string, value: string}[]>([]);
    const [editResult, setEditResult] = useState<string | null>(null);
    const [isEditLoading, setIsEditLoading] = useState(false);
    const [editLoadingMessage, setEditLoadingMessage] = useState('');
    
    useEffect(() => {
        // Check for API key in localStorage first
        const storedApiKey = localStorage.getItem('gemini_api_key');
        
        if (storedApiKey) {
            setApiKey(storedApiKey);
            initializeAI(storedApiKey);
        } else if (process.env.API_KEY) {
            initializeAI(process.env.API_KEY);
        } else {
            setNeedsApiKey(true);
        }
    }, []);

    const initializeAI = (key: string) => {
        try {
            const genAI = new GoogleGenAI({ apiKey: key });
            setAi(genAI);
            setNeedsApiKey(false);
            setApiError(null);
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setApiError("Gemini API 초기화에 실패했습니다.");
            setNeedsApiKey(true);
        }
    };

    const handleApiKeySet = (newApiKey: string) => {
        setApiKey(newApiKey);
        initializeAI(newApiKey);
    };

    // --- Utilities ---
    // FIX: Add types to function signature and check if reader.result is a string before splitting to resolve type error.
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
                const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
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
                    // 이미지 생성 품질 설정 (간접적으로 크기에 영향)
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

    // --- "Shot" Tab Handlers ---
    // FIX: Add type `FileList | null` to the files parameter to resolve type errors on `file.name` and spread operator.
    const handleFileChange = useCallback(async (files: FileList | null) => {
        if (!files) return;
        const fileList = Array.from(files);
        const newFiles = fileList.slice(0, MAX_SHOT_FILES - shotFiles.length);
        const processedFiles = await Promise.all(newFiles.map(async (file) => ({ name: file.name, ...(await fileToBase64(file)) })));
        setShotFiles(prev => [...prev, ...processedFiles]);
    }, [shotFiles]);
    
    // FIX: Add type to the event parameter.
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

    const switchToEditTab = () => {
        if (!shotResult) return;
        setEditSourceImage(shotResult);
        const blocks = shotPrompt.split(';').map(b => b.trim()).filter(b => b.includes(':'));
        const parsedBlocks = blocks.map(block => {
            const parts = block.split(/:(.*)/s);
            return { key: parts[0].trim(), value: parts[1].trim() };
        });
        setEditBlocks(parsedBlocks);
        setEditResult(null);
        setActiveTab('edit');
    };

    // --- "Edit" Tab Handlers ---
    const handleBlockChange = (index: number, value: string) => {
        setEditBlocks(prev => prev.map((block, i) => i === index ? { ...block, value } : block));
    };

    const onEditApply = async () => {
        if (!editSourceImage) return;
        setIsEditLoading(true);
        setEditLoadingMessage("수정된 프롬프트를 번역하는 중...");
        setEditResult(null);

        const newPromptText = editBlocks.map(b => `${b.key}: ${b.value}`).join('; ');
        const finalPrompt = await processAndAssemblePrompt(newPromptText);
        if (!finalPrompt) { setIsEditLoading(false); return; }
        
        setEditLoadingMessage("이미지를 수정하고 있습니다...");
        const apiPrompt = `Modify the source image based on these instructions, maintaining overall consistency: ${finalPrompt}`;
        const resultBase64 = await callImageApi(apiPrompt, [{data: editSourceImage, type: 'image/png'}]);

        if (resultBase64) setEditResult(resultBase64);
        setIsEditLoading(false);
    };

    const onEditUpscale = async () => {
        if (!editResult) return;
        setIsEditLoading(true);
        setEditLoadingMessage("이미지를 업스케일링 하는 중...");
        
        const prompt = "Upscale this image to a higher resolution (e.g., 2x), enhancing details and clarity without changing the content or style.";
        const resultBase64 = await callImageApi(prompt, [{data: editResult, type: 'image/png'}]);

        if (resultBase64) setEditResult(resultBase64);
        setIsEditLoading(false);
    };

    if (needsApiKey) {
        return <ApiSetup onApiKeySet={handleApiKeySet} />;
    }

    if (apiError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center">
                <div className="text-red-500 text-xl mb-4">{apiError}</div>
                <button 
                    onClick={() => setNeedsApiKey(true)}
                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition"
                >
                    API 키 다시 설정하기
                </button>
            </div>
        );
    }

    if (!ai) {
        return <div className="h-screen flex items-center justify-center"><Loader message="API 초기화 중..." /></div>
    }
    
    return (
        <>
            {zoomedImage && (
                <div id="image-zoom-modal" className="modal-overlay" onClick={() => setZoomedImage(null)}>
                    <div id="image-zoom-modal-content" onClick={e => e.stopPropagation()}>
                        <img id="zoomed-image" src={`data:image/png;base64,${zoomedImage}`} alt="Zoomed Image" />
                        <div id="image-zoom-close-btn" onClick={() => setZoomedImage(null)}>
                            {/* FIX: Changed strokeWidth from string "2" to number {2} to satisfy TypeScript type requirements for SVG attributes. */}
                            <IconX size={24} />
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-8 relative py-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-purple-500/10 blur-3xl" />
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 relative animate-pulse">
                        <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">AIFI</span>
                        <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent ml-2">바나나</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">AI로 일관성 있는 이미지를 만들고 수정하세요.</p>
                    <Button
                        onClick={() => {
                            if (confirm('API 키를 변경하시겠습니까?')) {
                                localStorage.removeItem('gemini_api_key');
                                setNeedsApiKey(true);
                                setAi(null);
                            }
                        }}
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0"
                        title="API 키 변경"
                        leftIcon={<IconSettings size={16} />}
                    >
                        API 설정
                    </Button>
                </header>
                
                <div className="flex justify-center gap-2 mb-8 p-2 bg-gray-900/50 backdrop-blur-xl rounded-xl">
                    <Button
                        onClick={() => setActiveTab('shot')}
                        variant={activeTab === 'shot' ? 'primary' : 'ghost'}
                        size="md"
                        leftIcon={<IconPhotoPlus size={22} />}
                        className="relative"
                    >
                        샷 이미지 만들기
                        {activeTab !== 'shot' && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded">NEW</span>}
                    </Button>
                    <Button
                        onClick={() => setActiveTab('edit')}
                        variant={activeTab === 'edit' ? 'primary' : 'ghost'}
                        size="md"
                        leftIcon={<IconPhotoEdit size={22} />}
                    >
                        이미지 수정
                    </Button>
                </div>

                <main>
                    {activeTab === 'shot' && (
                        <div id="content-shot">
                            <h2 className="text-2xl font-bold text-accent mb-4 text-center flex items-center justify-center gap-2">
                                <IconSparkles size={28} />
                                일관성 있는 샷 이미지 만들기
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <Card variant="elevated" className="p-6">
                                        <label className="font-semibold mb-4 block text-gray-200">1. 이미지 업로드 (최대 {MAX_SHOT_FILES}개)</label>
                                        <div 
                                            id="shot-dropzone" 
                                            className={`border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-orange-500 transition-all duration-300 ${shotFiles.length === 0 ? 'p-8' : 'p-4'}`}
                                            onClick={() => shotFiles.length < MAX_SHOT_FILES && (document.getElementById('shot-file-input') as HTMLInputElement)?.click()}
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
                                                            <div className="border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center h-24 hover:border-orange-500/50 transition-colors cursor-pointer">
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
                                        id="shot-prompt"
                                        rows={8}
                                        variant="filled"
                                        placeholder="각 요소를 세미콜론(;)으로 구분하여 입력하세요.&#10;예:&#10;STYLE: 애니메이션스타일;&#10;MEDIUM: 사실적인 디지털 사진;&#10;CAMERA: 전신샷;&#10;SCENE: 젊은 남녀 둘이 손을 잡고 한강을 산책하고 있다"
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
                                        variant="secondary"
                                        leftIcon={!isShotLoading && <IconRocket size={20} />}
                                        className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 border-white/20 shadow-xl"
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
                                            <div className="absolute bottom-4 flex space-x-2">
                                                <Button 
                                                    onClick={switchToEditTab} 
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
                    )}
                    {activeTab === 'edit' && (
                        <div id="content-edit">
                            <h2 className="text-2xl font-bold text-accent mb-4 text-center flex items-center justify-center gap-2">
                                <IconWand size={28} />
                                블록 프롬프트 수정
                            </h2>
                            {!editSourceImage ? (
                                 <div className="text-center text-gray-500 py-20">먼저 '샷 이미지 만들기' 탭에서 이미지를 생성하고 '수정' 버튼을 눌러주세요.</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                                            <Card variant="elevated" padding="none" className="flex flex-col items-center justify-center relative overflow-hidden">
                                                <h3 className="font-semibold mb-2 absolute top-4 z-10 bg-gray-900/80 backdrop-blur px-3 py-1 rounded-lg text-sm">수정할 이미지</h3>
                                                <div className="w-full h-full flex items-center justify-center p-8">
                                                    <img src={`data:image/png;base64,${editSourceImage}`} alt="Image to edit" className="w-full h-full rounded-md object-contain" />
                                                </div>
                                                <div className="absolute bottom-4 flex space-x-2">
                                                    <Button 
                                                        onClick={() => setZoomedImage(editSourceImage)}
                                                        variant="secondary"
                                                        size="xs"
                                                        leftIcon={<IconZoomIn size={14} />}
                                                    >
                                                        확대
                                                    </Button>
                                                    <Button 
                                                        onClick={() => downloadImage(editSourceImage, 'aifi-banana-source.png')}
                                                        variant="success"
                                                        size="xs"
                                                        leftIcon={<IconDownload size={14} />}
                                                    >
                                                        저장
                                                    </Button>
                                                </div>
                                            </Card>
                                            <Card variant="elevated" padding="none" className="flex flex-col items-center justify-center relative overflow-hidden">
                                                <h3 className="font-semibold mb-2 absolute top-4 z-10 bg-gray-900/80 backdrop-blur px-3 py-1 rounded-lg text-sm">수정된 이미지</h3>
                                                <div className="w-full h-full flex items-center justify-center p-8">
                                                    {!editResult && !isEditLoading && <div className="text-gray-500 text-sm">수정 결과가 여기에 표시됩니다.</div>}
                                                    {isEditLoading && <Loader message={editLoadingMessage} />}
                                                    {editResult && !isEditLoading && <img src={`data:image/png;base64,${editResult}`} alt="Edited result" className="w-full h-full rounded-md object-contain" />}
                                                </div>
                                                {editResult && !isEditLoading && (
                                                    <div className="absolute bottom-4 flex space-x-2">
                                                        <Button 
                                                            onClick={onEditUpscale}
                                                            variant="primary"
                                                            size="xs"
                                                            leftIcon={<IconMaximize size={14} />}
                                                        >
                                                            업스케일
                                                        </Button>
                                                        <Button 
                                                            onClick={() => setZoomedImage(editResult)}
                                                            variant="secondary"
                                                            size="xs"
                                                            leftIcon={<IconZoomIn size={14} />}
                                                        >
                                                            확대
                                                        </Button>
                                                        <div className="relative group">
                                                            <Button 
                                                                variant="success"
                                                                size="xs"
                                                                leftIcon={<IconDownload size={14} />}
                                                            >
                                                                저장
                                                            </Button>
                                                            <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl p-1 whitespace-nowrap z-10 transition-all duration-200 border border-gray-700">
                                                                <button onClick={() => downloadImage(editResult, 'aifi-edited.png')} className="block w-full text-left text-xs px-3 py-1.5 hover:bg-gray-700/50 rounded transition-colors">원본</button>
                                                                <button onClick={() => downloadImage(editResult, 'aifi-edited-fhd.png', {width: 1920, height: 1080})} className="block w-full text-left text-xs px-3 py-1.5 hover:bg-gray-700/50 rounded transition-colors">FHD</button>
                                                                <button onClick={() => downloadImage(editResult, 'aifi-edited-hd.png', {width: 1280, height: 720})} className="block w-full text-left text-xs px-3 py-1.5 hover:bg-gray-700/50 rounded transition-colors">HD</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {editBlocks.map((block, index) => (
                                                <Input
                                                    key={index}
                                                    label={block.key}
                                                    value={block.value}
                                                    onChange={e => handleBlockChange(index, e.target.value)}
                                                    variant="filled"
                                                />
                                            ))}
                                        </div>
                                        <Button
                                            onClick={onEditApply}
                                            disabled={isEditLoading}
                                            isLoading={isEditLoading}
                                            size="lg"
                                            fullWidth
                                            variant="primary"
                                            leftIcon={!isEditLoading && <IconWand size={20} />}
                                        >
                                            {isEditLoading ? '적용 중...' : '수정 내용 적용하기'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
