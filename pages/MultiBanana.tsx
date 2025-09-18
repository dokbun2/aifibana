import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconLoader2, IconPhoto, IconSparkles, IconCameraRotate, IconArrowsExchange, IconBrandFramer, IconX, IconPencil } from '@tabler/icons-react';
import { DrawingCanvas } from '../components/DrawingCanvas';

interface ImageFile {
    file: File;
    preview: string;
    base64: string;
}

interface MultiBananaProps {
    ai: GoogleGenAI | null;
}

type FeatureType = 'face-swap' | 'image-prompt' | 'motion' | 'character-turnaround' | 'scene-fusion';

const featureConfig = {
    'face-swap': {
        title: '페이스 스왑',
        description: '얼굴을 제공할 이미지(1번)와 몸/배경을 제공할 이미지(2번)를 업로드하여 페이스 스왑을 실행하세요.',
        icon: IconArrowsExchange,
        inputs: ['얼굴 소스 (이 얼굴을 사용)', '몸/배경 타겟 (이 몸과 배경 사용)'],
        prompt: "Create a composite image by combining elements from both provided images. Use the facial features (eyes, nose, mouth, face shape, facial structure) from the FIRST image and place them onto the person in the SECOND image. Keep everything else from the second image unchanged - the body, clothing, pose, hands, background, setting, and any text. The result should look like the person from image 1 is in the scene from image 2. Make the face replacement look natural and seamless."
    },
    'image-prompt': {
        title: '이미지 생성',
        description: '입력 이미지와 프롬프트를 제공하여 새로운 창작물을 생성하세요.',
        icon: IconSparkles,
        inputs: ['입력 이미지'],
        needsPrompt: true,
        prompt: 'Using the person in the provided image as a reference, generate a new image based on the following description: '
    },
    'motion': {
        title: '모션 테크닉',
        description: '포즈를 위한 라인 드로잉과 캐릭터 이미지들을 결합하여 역동적인 새 이미지를 만드세요.',
        icon: IconBrandFramer,
        inputs: ['라인 드로잉 (포즈)'],
        multipleCharacters: true,
        maxCharacters: 8,
        needsPrompt: true,
        defaultPrompt: '자연스러운 배경',
        prompt: "CRITICAL INSTRUCTION - POSE IS PRIORITY #1: You MUST replicate the EXACT pose, body position, and limb arrangement shown in the first image (the line drawing/sketch). This is the MOST IMPORTANT requirement. The first image shows the precise pose that the character MUST be in - copy it EXACTLY. Use the following character images for the person's appearance/face/clothing. DO NOT show any sketch lines in the final output - create a photorealistic result. The pose from the first image is MANDATORY and takes absolute priority over any text description. Additional scene details (only if pose is perfectly matched): "
    },
    'character-turnaround': {
        title: '캐릭터 턴어라운드',
        description: '단일 이미지(스케치 또는 사진)에서 다각도 뷰를 생성하세요.',
        icon: IconCameraRotate,
        inputs: ['소스 이미지'],
        needsPrompt: true,
        defaultPrompt: '이미지 속 캐릭터의 정면, 오른쪽, 왼쪽, 뒷모습을 보여주는 4패널 턴어라운드를 만드세요. 부드러운 쉐이딩과 일관된 배경을 가진 3D 카툰 스타일로 렌더링하세요.',
        prompt: ""
    },
    'scene-fusion': {
        title: '장면 퓨전',
        description: '여러 캐릭터들을 하나의 일관된 장면으로 결합하세요.',
        icon: IconPhoto,
        inputs: ['캐릭터 이미지 1', '캐릭터 이미지 2'],
        needsPrompt: true,
        defaultPrompt: '이미지 속 인물들이 함께 요트에서 와인을 마시며 여름 휴가를 보내고 있습니다.',
        prompt: "Using the characters from all the provided images, generate a new image based on the following scene description: "
    }
};

const ImageUploader: React.FC<{
    imageFile: ImageFile | null;
    setImageFile: (file: ImageFile | null) => void;
    title: string;
}> = ({ imageFile, setImageFile, title }) => {
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImageFile({
                    file,
                    preview: base64,
                    base64: base64.split(',')[1]
                });
            };
            reader.readAsDataURL(file);
        }
    }, [setImageFile]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImageFile({
                    file,
                    preview: base64,
                    base64: base64.split(',')[1]
                });
            };
            reader.readAsDataURL(file);
        }
    }, [setImageFile]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">{title}</label>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-primary transition-colors cursor-pointer bg-gray-800/50"
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imageFile ? (
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-700">
                        <img 
                            src={imageFile.preview} 
                            alt={title} 
                            className="absolute inset-0 w-full h-full object-contain" 
                        />
                    </div>
                ) : (
                    <div className="aspect-square flex flex-col items-center justify-center">
                        <IconPhoto className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-400">클릭하거나 드래그하여 이미지 업로드</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const MultiBanana: React.FC<MultiBananaProps> = ({ ai }) => {
    const [selectedFeature, setSelectedFeature] = useState<FeatureType>('face-swap');
    const [images, setImages] = useState<(ImageFile | null)[]>([null, null, null, null]); // 4개로 확장 (scene-fusion 지원)
    const [characterImages, setCharacterImages] = useState<(ImageFile | null)[]>([null]); // 모션 테크닉용 캐릭터 이미지 배열
    const [customPrompt, setCustomPrompt] = useState('');
    const [resultImages, setResultImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useDrawingCanvas, setUseDrawingCanvas] = useState(false); // 드로잉 캔버스 사용 여부
    const [drawingData, setDrawingData] = useState<string | null>(null); // 드로잉 데이터

    const config = featureConfig[selectedFeature] as any;
    
    // 기능이 바뀔 때 기본 프롬프트 설정 및 이미지 배열 초기화
    React.useEffect(() => {
        if ('defaultPrompt' in config) {
            setCustomPrompt(config.defaultPrompt || '');
        } else {
            setCustomPrompt('');
        }
        // 이미지 배열 초기화
        setImages([null, null, null, null]);
        setResultImages([]);
        setError(null);
        // 기능 변경 시 드로잉 관련 상태도 초기화
        setUseDrawingCanvas(false);
        setDrawingData(null);
        setCharacterImages([null]);
    }, [selectedFeature]);

    const handleImageChange = (index: number, file: ImageFile | null) => {
        const newImages = [...images];
        // 배열 크기 확인 및 확장
        while (newImages.length <= index) {
            newImages.push(null);
        }
        newImages[index] = file;
        setImages(newImages);
    };

    const handleCharacterImageChange = (index: number, file: ImageFile | null) => {
        const newImages = [...characterImages];
        newImages[index] = file;
        setCharacterImages(newImages);
    };

    const addCharacterSlot = () => {
        if (characterImages.length < config.maxCharacters) {
            setCharacterImages([...characterImages, null]);
        }
    };

    const removeCharacterSlot = (index: number) => {
        if (characterImages.length > 1) {
            const newImages = characterImages.filter((_, i) => i !== index);
            setCharacterImages(newImages);
        }
    };

    const editImage = async (
        images: { data: string; mimeType: string }[],
        prompt: string
    ): Promise<{ base64Image: string | null; text: string | null }> => {
        if (!ai) {
            throw new Error('AI가 초기화되지 않았습니다.');
        }

        try {
            const imageParts = images.map(img => ({
                inlineData: {
                    data: img.data,
                    mimeType: img.mimeType,
                },
            }));
            
            const contents = { 
                parts: [...imageParts, { text: prompt }] 
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: contents,
                config: { 
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                    generationConfig: {
                        temperature: 0.9,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                },
            });
            
            let base64Image: string | null = null;
            let text: string | null = null;
            
            // Extract image from response
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    base64Image = part.inlineData.data;
                } else if (part.text) {
                    text = part.text;
                }
            }
            
            if (!base64Image) {
                throw new Error("API 응답에서 이미지를 찾을 수 없습니다.");
            }

            return { base64Image, text };
        } catch (error) {
            console.error('Error editing image with Gemini API:', error);
            throw error;
        }
    };

    const handleGenerate = useCallback(async () => {
        // 모션 테크닉 특별 처리
        if (selectedFeature === 'motion') {
            // 포즈 입력 체크 (업로드 이미지 또는 드로잉)
            if (!useDrawingCanvas && !images[0]) {
                setError('라인 드로잉 이미지를 업로드해주세요.');
                return;
            }

            if (useDrawingCanvas && !drawingData) {
                setError('포즈를 그려주세요.');
                return;
            }

            // 캐릭터 이미지 체크
            const validCharacters = characterImages.filter(img => img !== null);
            if (validCharacters.length === 0) {
                setError('최소 1개 이상의 캐릭터 이미지를 업로드해주세요.');
                return;
            }

            if (config.needsPrompt && !customPrompt.trim()) {
                setError('프롬프트를 입력해주세요.');
                return;
            }

            setIsLoading(true);
            setError(null);
            setResultImages([]);

            try {
                // 포즈 데이터 준비 (업로드된 이미지 또는 드로잉)
                let poseImageData;
                if (useDrawingCanvas && drawingData) {
                    // 드로잉 데이터 검증 및 변환
                    if (!drawingData.startsWith('data:image')) {
                        throw new Error('잘못된 이미지 데이터 형식입니다.');
                    }
                    // data:image/png;base64, 부분을 제거하고 순수 base64만 추출
                    const base64Match = drawingData.match(/^data:image\/[a-z]+;base64,(.+)$/i);
                    if (!base64Match || !base64Match[1]) {
                        throw new Error('이미지 데이터를 파싱할 수 없습니다.');
                    }
                    poseImageData = { data: base64Match[1], mimeType: 'image/png' };
                } else if (images[0]) {
                    poseImageData = { data: images[0].base64, mimeType: images[0].file.type };
                } else {
                    throw new Error('포즈 데이터가 없습니다.');
                }

                // 포즈 + 모든 캐릭터 이미지들을 하나의 배열로 합침
                const allImages = [
                    poseImageData,
                    ...validCharacters.map(img => ({
                        data: img!.base64,
                        mimeType: img!.file.type
                    }))
                ];

                const finalPrompt = config.prompt + customPrompt;

                console.log('Sending to API:', {
                    imageCount: allImages.length,
                    poseType: useDrawingCanvas ? 'drawing' : 'upload',
                    promptLength: finalPrompt.length
                });

                const result = await editImage(allImages, finalPrompt);

                if (result.base64Image) {
                    setResultImages([result.base64Image]);
                } else {
                    throw new Error('이미지 생성에 실패했습니다.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // scene-fusion 특별 처리
        if (selectedFeature === 'scene-fusion') {
            const validImages = images.filter(img => img !== null);
            
            if (validImages.length === 0) {
                setError('최소 1개 이상의 캐릭터 이미지를 업로드해주세요.');
                return;
            }

            if (!customPrompt.trim()) {
                setError('장면 프롬프트를 입력해주세요.');
                return;
            }

            setIsLoading(true);
            setError(null);
            setResultImages([]);

            try {
                const imageData = validImages.map(img => ({
                    data: img!.base64,
                    mimeType: img!.file.type
                }));

                const finalPrompt = `Using the characters from all the provided images, generate a new image based on the following scene description: ${customPrompt}.`;
                
                const result = await editImage(imageData, finalPrompt);
                
                if (result.base64Image) {
                    setResultImages([result.base64Image]);
                } else {
                    throw new Error('이미지 생성에 실패했습니다.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // 기존 기능들 처리
        const requiredImages = config.inputs.length;
        const validImages = images.slice(0, requiredImages).filter(img => img !== null);

        if (validImages.length !== requiredImages) {
            setError(`${requiredImages}개의 이미지를 모두 업로드해주세요.`);
            return;
        }

        if (config.needsPrompt && !customPrompt.trim()) {
            setError('프롬프트를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImages([]);

        try {
            const imageData = validImages.map(img => ({
                data: img!.base64,
                mimeType: img!.file.type
            }));

            let finalPrompt = config.prompt;
            if (config.needsPrompt) {
                if (selectedFeature === 'character-turnaround') {
                    // 캐릭터 턴어라운드는 프롬프트를 그대로 사용
                    finalPrompt = customPrompt;
                } else {
                    finalPrompt = config.prompt + customPrompt;
                }
            }

            // Generate multiple results for image-prompt feature
            const numResults = selectedFeature === 'image-prompt' ? 4 : 1;
            const promises = Array(numResults).fill(null).map(() => editImage(imageData, finalPrompt));
            const results = await Promise.all(promises);

            const validResults = results
                .filter(r => r.base64Image)
                .map(r => r.base64Image!);

            if (validResults.length === 0) {
                throw new Error('이미지 생성에 실패했습니다.');
            }

            setResultImages(validResults);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [ai, selectedFeature, images, characterImages, customPrompt, config, useDrawingCanvas, drawingData]);

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Feature Selection */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">멀티바나나 - AI 이미지 도구</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(featureConfig).map(([key, feature]) => {
                        const Icon = feature.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedFeature(key as FeatureType);
                                    // useEffect에서 초기화를 처리하므로 여기서는 기능만 변경
                                }}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    selectedFeature === key
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-gray-600 hover:border-gray-500 text-gray-300'
                                }`}
                            >
                                <Icon className="w-8 h-8 mx-auto mb-2" />
                                <div className="text-sm font-medium">{feature.title}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feature Description */}
            <div className="mb-8 p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-white">{config.title}</h3>
                <p className="text-gray-400">{config.description}</p>
            </div>

            {/* Special layout for image-prompt */}
            {selectedFeature === 'image-prompt' ? (
                <div>
                    {/* Input and Results Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Input Image Section */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">입력 이미지</h4>
                            <div
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type.startsWith('image/')) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const base64 = reader.result as string;
                                            handleImageChange(0, {
                                                file,
                                                preview: base64,
                                                base64: base64.split(',')[1]
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-primary transition-colors cursor-pointer bg-gray-800/50"
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64 = reader.result as string;
                                                handleImageChange(0, {
                                                    file,
                                                    preview: base64,
                                                    base64: base64.split(',')[1]
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {images[0] ? (
                                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-700">
                                        <img 
                                            src={images[0].preview} 
                                            alt="입력 이미지" 
                                            className="absolute inset-0 w-full h-full object-contain" 
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-square flex flex-col items-center justify-center">
                                        <IconPhoto className="h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-400">클릭하거나 드래그하여 이미지 업로드</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Result Section */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">생성 결과</h4>
                            <div className="relative group">
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg bg-gray-800">
                                    {resultImages.length > 0 ? (
                                        <>
                                            <img
                                                src={`data:image/png;base64,${resultImages[0]}`}
                                                alt="Result"
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                            <a
                                                href={`data:image/png;base64,${resultImages[0]}`}
                                                download={`image-prompt-result.png`}
                                                className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                                            >
                                                다운로드
                                            </a>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            {isLoading ? (
                                                <div className="text-center">
                                                    <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-2" />
                                                    <p className="text-sm">생성 중...</p>
                                                </div>
                                            ) : (
                                                <p>생성 버튼을 눌러 결과를 확인하세요</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Section for Motion */}
                    {config.needsPrompt && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                배경/환경 설정 (선택사항)
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition text-white"
                                placeholder="배경이나 환경만 설명하세요 (예: 해변가, 우주 공간, 숲 속). 포즈는 드로잉을 따릅니다."
                            />
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !ai || !images[0]}
                            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? '생성 중...' : '이미지 생성'}
                        </button>
                    </div>
                </div>
            ) : selectedFeature === 'motion' ? (
                <div>
                    {/* 포즈 입력 방식 선택 */}
                    <div className="mb-4">
                        <div className="flex gap-4 mb-2">
                            <button
                                onClick={() => {
                                    setUseDrawingCanvas(false);
                                    setDrawingData(null);
                                }}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    !useDrawingCanvas
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <IconPhoto className="inline-block w-3 h-3 mr-1" />
                                포즈 이미지 업로드
                            </button>
                            <button
                                onClick={() => {
                                    setUseDrawingCanvas(true);
                                    // 드로잉 모드로 전환할 때 업로드된 이미지만 제거
                                    handleImageChange(0, null);
                                }}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    useDrawingCanvas
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <IconPencil className="inline-block w-3 h-3 mr-1" />
                                커스텀 드로잉
                            </button>
                        </div>
                    </div>

                    {/* 3열 수평 레이아웃 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {/* 첫 번째 열: 포즈 입력 (업로드 또는 드로잉) */}
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-300 mb-1">
                                {useDrawingCanvas ? '커스텀 드로잉 (포즈 가이드)' : '라인 드로잉 (포즈 참조)'}
                            </label>

                            {useDrawingCanvas ? (
                                <DrawingCanvas
                                    width={380}
                                    height={380}
                                    onCanvasUpdate={(imageData) => {
                                        setDrawingData(imageData);
                                    }}
                                    className="w-full"
                                />
                            ) : (
                                <div
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type.startsWith('image/')) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64 = reader.result as string;
                                                handleImageChange(0, {
                                                    file,
                                                    preview: base64,
                                                    base64: base64.split(',')[1]
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer bg-gray-800/50"
                                    style={{ width: '100%', height: '380px' }}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const base64 = reader.result as string;
                                                    handleImageChange(0, {
                                                        file,
                                                        preview: base64,
                                                        base64: base64.split(',')[1]
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {images[0] ? (
                                        <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-700">
                                            <img
                                                src={images[0].preview}
                                                alt="라인 드로잉"
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <IconPhoto className="h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-xs text-gray-400 text-center">
                                                클릭하거나 드래그하여<br />포즈 이미지 업로드
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 두 번째 열: 캐릭터 이미지들 */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-gray-300">
                                    캐릭터 이미지 ({characterImages.filter(img => img !== null).length}/{config.maxCharacters})
                                </label>
                                {characterImages.length < config.maxCharacters && (
                                    <button
                                        onClick={addCharacterSlot}
                                        className="px-2 py-0.5 text-xs bg-primary/20 text-primary border border-primary rounded hover:bg-primary/30 transition-colors"
                                    >
                                        + 추가
                                    </button>
                                )}
                            </div>
                            <div
                                className="grid grid-cols-2 gap-2 p-2 border-2 border-gray-600 rounded-lg bg-gray-800/30"
                                style={{ width: '100%', height: '380px', overflow: 'auto' }}
                            >
                                {characterImages.map((image, index) => (
                                    <div key={`character-${index}`} className="relative h-fit">
                                        <div className="relative border border-dashed border-gray-600 rounded p-1 hover:border-primary transition-colors bg-gray-800/50">
                                            {characterImages.length > 1 && (
                                                <button
                                                    onClick={() => removeCharacterSlot(index)}
                                                    className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                                                >
                                                    ×
                                                </button>
                                            )}
                                            <div
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];
                                                    if (file && file.type.startsWith('image/')) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const base64 = reader.result as string;
                                                            handleCharacterImageChange(index, {
                                                                file,
                                                                preview: base64,
                                                                base64: base64.split(',')[1]
                                                            });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                className="cursor-pointer"
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const base64 = reader.result as string;
                                                                handleCharacterImageChange(index, {
                                                                    file,
                                                                    preview: base64,
                                                                    base64: base64.split(',')[1]
                                                                });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                {image ? (
                                                    <div className="aspect-square overflow-hidden rounded bg-gray-700">
                                                        <img
                                                            src={image.preview}
                                                            alt={`캐릭터 ${index + 1}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-square flex flex-col items-center justify-center bg-gray-900/50 rounded">
                                                        <IconPhoto className="h-6 w-6 text-gray-400" />
                                                        <p className="mt-1 text-[10px] text-gray-400">캐릭터 {index + 1}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 세 번째 열: 결과 이미지 */}
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-300 mb-1">
                                생성 결과
                            </label>
                            <div
                                className="relative border-2 border-gray-600 rounded-lg bg-gray-800/50 overflow-hidden"
                                style={{ width: '100%', height: '380px' }}
                            >
                                {resultImages.length > 0 ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={`data:image/png;base64,${resultImages[0]}`}
                                            alt="Motion Result"
                                            className="absolute inset-0 w-full h-full object-contain"
                                        />
                                        <a
                                            href={`data:image/png;base64,${resultImages[0]}`}
                                            download={`motion-result.png`}
                                            className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs hover:bg-black/90"
                                        >
                                            다운로드
                                        </a>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {isLoading ? (
                                            <div className="text-center">
                                                <IconLoader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-2" />
                                                <p className="text-xs text-gray-400">생성 중...</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4">
                                                <IconSparkles className="h-10 w-10 mx-auto text-gray-600 mb-2" />
                                                <p className="text-xs text-gray-400">
                                                    포즈와 캐릭터를<br />
                                                    업로드한 후<br />
                                                    생성 버튼을 누르세요
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : selectedFeature !== 'scene-fusion' && selectedFeature !== 'image-prompt' && selectedFeature !== 'character-turnaround' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {config.inputs.map((inputTitle, index) => (
                        <ImageUploader
                            key={`${selectedFeature}-${index}`}
                            imageFile={images[index]}
                            setImageFile={(file) => handleImageChange(index, file)}
                            title={inputTitle}
                        />
                    ))}
                </div>
            ) : null}

            {/* Custom Prompt Input (if needed) - not for scene-fusion, image-prompt, and character-turnaround as they have their own */}
            {config.needsPrompt && selectedFeature !== 'scene-fusion' && selectedFeature !== 'image-prompt' && selectedFeature !== 'character-turnaround' && (
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-300 mb-2">프롬프트</label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={4}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition text-white"
                        placeholder="예: 주황색 우주복을 입은 남자가 하늘색 배경에서 우주비행사로 있는 클로즈업 샷"
                    />
                </div>
            )}

            {/* Special layout for scene-fusion */}
            {selectedFeature === 'scene-fusion' ? (
                <div>
                    {/* Characters and Result Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Character Images Section */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">캐릭터 이미지 (최대 4개)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[0, 1, 2, 3].map((index) => (
                                    <div
                                        key={index}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files[0];
                                            if (file && file.type.startsWith('image/')) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const base64 = reader.result as string;
                                                    handleImageChange(index, {
                                                        file,
                                                        preview: base64,
                                                        base64: base64.split(',')[1]
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="relative border-2 border-dashed border-gray-600 rounded-lg hover:border-primary transition-colors cursor-pointer bg-gray-800/50"
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64 = reader.result as string;
                                                        handleImageChange(index, {
                                                            file,
                                                            preview: base64,
                                                            base64: base64.split(',')[1]
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="aspect-square overflow-hidden rounded-lg">
                                            {images[index] ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={images[index].preview}
                                                        alt={`캐릭터 ${index + 1}`}
                                                        className="absolute inset-0 w-full h-full object-contain"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageChange(index, null);
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full hover:bg-red-600/90 z-20"
                                                    >
                                                        <IconX className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-4">
                                                    <IconPhoto className="h-8 w-8 text-gray-500" />
                                                    <p className="text-xs text-gray-500 mt-1">캐릭터 {index + 1}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Result Section */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">장면 생성 결과</h4>
                            <div className="relative group">
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg bg-gray-800">
                                    {resultImages.length > 0 ? (
                                        <>
                                            <img
                                                src={`data:image/png;base64,${resultImages[0]}`}
                                                alt="Scene Fusion Result"
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                            <a
                                                href={`data:image/png;base64,${resultImages[0]}`}
                                                download={`scene-fusion-result.png`}
                                                className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                                            >
                                                다운로드
                                            </a>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            {isLoading ? (
                                                <div className="text-center">
                                                    <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-2" />
                                                    <p className="text-sm">장면 생성 중...</p>
                                                </div>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <IconSparkles className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                                                    <p>캐릭터를 업로드하고</p>
                                                    <p>프롬프트를 입력한 후</p>
                                                    <p>생성 버튼을 누르세요</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-2">장면 프롬프트</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition text-white"
                            placeholder="예: 이미지 속 인물들이 함께 요트에서 와인을 마시며 여름 휴가를 보내고 있습니다."
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !ai || images.filter(img => img !== null).length === 0 || !customPrompt}
                            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? (
                                <>
                                    <IconLoader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                                    장면 생성 중...
                                </>
                            ) : (
                                '장면 생성'
                            )}
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Character Turnaround Layout - Source Upload and Result Side by Side */}
            {selectedFeature === 'character-turnaround' && (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Source Upload Section */}
                        <div>
                            <ImageUploader
                                imageFile={images[0]}
                                setImageFile={(file) => handleImageChange(0, file)}
                                title="소스 이미지 (스케치 또는 사진)"
                            />
                        </div>
                        
                        {/* Result Section */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">턴어라운드 결과</h4>
                            <div className="relative group">
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg bg-gray-800">
                                    {resultImages.length > 0 ? (
                                        <>
                                            <img
                                                src={`data:image/png;base64,${resultImages[0]}`}
                                                alt="Turnaround Result"
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                            <a
                                                href={`data:image/png;base64,${resultImages[0]}`}
                                                download={`character-turnaround-result.png`}
                                                className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                                            >
                                                다운로드
                                            </a>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            {isLoading ? (
                                                <div className="text-center">
                                                    <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-2" />
                                                    <p className="text-sm">턴어라운드 생성 중...</p>
                                                </div>
                                            ) : (
                                                <div className="text-center p-8">
                                                    <IconCameraRotate className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                                                    <p className="text-sm">생성 버튼을 눌러</p>
                                                    <p className="text-sm">결과를 확인하세요</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Prompt Section for Character Turnaround */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-2">프롬프트</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition text-white"
                            placeholder="예: 이미지 속 캐릭터의 정면, 오른쪽, 왼쪽, 뒷모습을 보여주는 4패널 턴어라운드를 만드세요."
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !ai || !images[0]}
                            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? '생성 중...' : '캐릭터 턴어라운드 생성'}
                        </button>
                    </div>
                </div>
            )}

            {/* Default layout for other features */}
            {selectedFeature !== 'scene-fusion' && selectedFeature !== 'image-prompt' && selectedFeature !== 'character-turnaround' && (
                /* Default layout for other features */
                <>
                    {/* Generate Button */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !ai}
                            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? '생성 중...' : `${config.title} 생성`}
                        </button>
                    </div>

                    {/* Results Display for other features */}
                    {resultImages.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-4 text-white">결과</h3>
                            <div className={`grid gap-4 ${resultImages.length > 1 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
                                {resultImages.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg bg-gray-800">
                                            <img
                                                src={`data:image/png;base64,${image}`}
                                                alt={`Result ${index + 1}`}
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                            <a
                                                href={`data:image/png;base64,${image}`}
                                                download={`${selectedFeature}-result-${index + 1}.png`}
                                                className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                                            >
                                                다운로드
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
};