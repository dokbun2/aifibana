/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from '@google/genai';
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import ApiSetup from './components/ApiSetup';

const MAX_SHOT_FILES = 8;

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <div className="loader mx-auto"></div>
        <p className="mt-4">{message}</p>
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
    const [shotPrompt, setShotPrompt] = useState('STYLE: 시네마틱 픽사 애니메이션 스타일;\nSCENE: 소년과 소녀가 카페 테이블에 앉아있다;\nCHARACTER_1: 교복 입은 한국 소년;');
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-8 relative">
                    <h1 className="text-4xl md:text-5xl font-bold">
                        <span className="text-primary">AIFI</span><span className="text-accent"> 바나나</span>
                    </h1>
                    <p className="text-gray-400 mt-2">AI로 일관성 있는 이미지를 만들고 수정하세요.</p>
                    <button 
                        onClick={() => {
                            if (confirm('API 키를 변경하시겠습니까?')) {
                                localStorage.removeItem('gemini_api_key');
                                setNeedsApiKey(true);
                                setAi(null);
                            }
                        }}
                        className="absolute top-0 right-0 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm transition"
                        title="API 키 변경"
                    >
                        ⚙️ API 설정
                    </button>
                </header>
                
                <div className="flex justify-center border-b border-gray-700 mb-8">
                    <div className={`tab ${activeTab === 'shot' ? 'active' : ''}`} onClick={() => setActiveTab('shot')}>샷 이미지 만들기</div>
                    <div className={`tab ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>이미지 수정</div>
                </div>

                <main>
                    {activeTab === 'shot' && (
                        <div id="content-shot">
                            <h2 className="text-2xl font-bold text-accent mb-4 text-center">일관성 있는 샷 이미지 만들기</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="font-semibold mb-2 block">1. 이미지 업로드 (최대 {MAX_SHOT_FILES}개)</label>
                                        <div 
                                            id="shot-dropzone" 
                                            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
                                            onClick={() => (document.getElementById('shot-file-input') as HTMLInputElement)?.click()}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={handleDrop}
                                        >
                                            <p className="text-gray-400">+ 이미지를 여기에 드래그하거나 클릭하여 업로드</p>
                                            <input type="file" id="shot-file-input" className="hidden" multiple accept="image/*" onChange={e => handleFileChange(e.target.files)} />
                                        </div>
                                        <div id="shot-thumbnails" className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {shotFiles.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className={`w-full h-24 object-cover rounded-md ${index === 0 ? 'border-2 border-accent' : ''}`} />
                                                    <div className="absolute top-0 right-0 m-1 p-0.5 bg-red-500 rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100" onClick={() => removeShotFile(index)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </div>
                                                    {index === 0 && <div className="absolute bottom-0 text-xs bg-accent text-white px-1 rounded-t-sm">기준</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="shot-prompt" className="font-semibold mb-2 block">2. 블록화 프롬프트 입력</label>
                                        <textarea id="shot-prompt" rows={8} className="form-textarea text-sm" placeholder="각 요소를 세미콜론(;)으로 구분하여 입력하세요.&#10;예:&#10;STYLE: 시네마틱 픽사 애니메이션 스타일;&#10;SCENE: 소년과 소녀가 카페 테이블에 앉아있다;&#10;CHARACTER_1: 교복 입은 한국 소년;" value={shotPrompt} onChange={e => setShotPrompt(e.target.value)}></textarea>
                                    </div>
                                    <button onClick={onShotGenerate} disabled={shotFiles.length === 0 || isShotLoading} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isShotLoading ? '생성 중...' : '이미지 생성하기 🚀'}
                                    </button>
                                </div>
                                <div className="bg-gray-900 rounded-lg flex flex-col items-center justify-center h-[500px] p-4 border border-gray-800 relative overflow-hidden">
                                    {!shotResult && !isShotLoading && <div className="text-center text-gray-500"><p>생성된 이미지가 여기에 표시됩니다.</p></div>}
                                    {isShotLoading && <Loader message={shotLoadingMessage} />}
                                    {shotResult && !isShotLoading && (
                                        <>
                                            <img src={`data:image/png;base64,${shotResult}`} alt="Generated shot" className="w-full h-full rounded-md object-contain" />
                                            <div className="absolute bottom-4 flex space-x-2">
                                                <button onClick={switchToEditTab} className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">수정</button>
                                                <button onClick={onShotUpscale} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">업스케일</button>
                                                <button onClick={() => setZoomedImage(shotResult)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">확대</button>
                                                <div className="relative group">
                                                    <button className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">저장 ▼</button>
                                                    <div className="absolute bottom-full left-0 mb-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-800 rounded-lg shadow-lg p-2 whitespace-nowrap transition-all duration-200">
                                                        <button onClick={() => downloadImage(shotResult)} className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded">원본 크기</button>
                                                        <button onClick={() => downloadImage(shotResult, 'aifi-1920x1080.png', {width: 1920, height: 1080})} className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded">1920×1080 (FHD)</button>
                                                        <button onClick={() => downloadImage(shotResult, 'aifi-1280x720.png', {width: 1280, height: 720})} className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded">1280×720 (HD)</button>
                                                        <button onClick={() => downloadImage(shotResult, 'aifi-1024x1024.png', {width: 1024, height: 1024})} className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded">1024×1024 (Square)</button>
                                                        <button onClick={() => downloadImage(shotResult, 'aifi-512x512.png', {width: 512, height: 512})} className="block w-full text-left px-3 py-1 hover:bg-gray-700 rounded">512×512 (Icon)</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'edit' && (
                        <div id="content-edit">
                            <h2 className="text-2xl font-bold text-accent mb-4 text-center">블록 프롬프트 수정</h2>
                            {!editSourceImage ? (
                                 <div className="text-center text-gray-500 py-20">먼저 '샷 이미지 만들기' 탭에서 이미지를 생성하고 '수정' 버튼을 눌러주세요.</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                                            <div className="bg-gray-900 rounded-lg flex flex-col items-center justify-center p-2 border border-gray-800 relative overflow-hidden">
                                                <h3 className="font-semibold mb-2 absolute top-2 z-10 bg-gray-900 px-2 rounded">수정할 이미지</h3>
                                                <div className="w-full h-full flex items-center justify-center p-8">
                                                    <img src={`data:image/png;base64,${editSourceImage}`} alt="Image to edit" className="w-full h-full rounded-md object-contain" />
                                                </div>
                                                <div className="absolute bottom-2 flex space-x-2">
                                                    <button onClick={() => setZoomedImage(editSourceImage)} className="bg-gray-600 text-white text-xs font-bold py-1 px-2 rounded-lg hover:opacity-90 transition">확대</button>
                                                    <button onClick={() => downloadImage(editSourceImage, 'aifi-banana-source.png')} className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-lg hover:opacity-90 transition">저장</button>
                                                </div>
                                            </div>
                                            <div className="bg-gray-900 rounded-lg flex flex-col items-center justify-center p-2 border border-gray-800 relative overflow-hidden">
                                                <h3 className="font-semibold mb-2 absolute top-2 z-10 bg-gray-900 px-2 rounded">수정된 이미지</h3>
                                                <div className="w-full h-full flex items-center justify-center p-8">
                                                    {!editResult && !isEditLoading && <div className="text-gray-500 text-sm">수정 결과가 여기에 표시됩니다.</div>}
                                                    {isEditLoading && <Loader message={editLoadingMessage} />}
                                                    {editResult && !isEditLoading && <img src={`data:image/png;base64,${editResult}`} alt="Edited result" className="w-full h-full rounded-md object-contain" />}
                                                </div>
                                                {editResult && !isEditLoading && (
                                                    <div className="absolute bottom-2 flex space-x-2">
                                                        <button onClick={onEditUpscale} className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-lg hover:opacity-90 transition">업스케일</button>
                                                        <button onClick={() => setZoomedImage(editResult)} className="bg-gray-600 text-white text-xs font-bold py-1 px-2 rounded-lg hover:opacity-90 transition">확대</button>
                                                        <div className="relative group">
                                                            <button className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-lg hover:opacity-90 transition">저장</button>
                                                            <div className="absolute bottom-full left-0 mb-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-800 rounded-lg shadow-lg p-1 whitespace-nowrap z-10 transition-all duration-200">
                                                                <button onClick={() => downloadImage(editResult, 'aifi-edited.png')} className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-700 rounded">원본</button>
                                                                <button onClick={() => downloadImage(editResult, 'aifi-edited-fhd.png', {width: 1920, height: 1080})} className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-700 rounded">FHD</button>
                                                                <button onClick={() => downloadImage(editResult, 'aifi-edited-hd.png', {width: 1280, height: 720})} className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-700 rounded">HD</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {editBlocks.map((block, index) => (
                                                <div key={index}>
                                                    <label className="text-sm font-medium text-gray-300">{block.key}</label>
                                                    <input type="text" value={block.value} onChange={e => handleBlockChange(index, e.target.value)} className="form-input mt-1" />
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={onEditApply} disabled={isEditLoading} className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isEditLoading ? '적용 중...' : '수정 내용 적용하기'}
                                        </button>
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
