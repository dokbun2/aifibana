# AIFI 바나나 - AI 기능 추가 개발 패턴

## 📋 개발 완료된 기능들
1. **글로 쓰는 편집기** (TextEditor) - 에메랄드 테마
2. **샷 이미지 만들기** (ShotGenerator) - 오렌지 테마  
3. **이미지 앵글 변환** (AngleConverter) - 보라색 테마
4. **가상 옷 입히기** (TryOn) - 시안-블루 테마

## 🔄 표준 개발 패턴

### 1단계: 홈 페이지 카드 추가
**파일**: `/pages/Home.tsx`

```tsx
// 인터페이스 타입에 새 페이지 추가
interface HomeProps {
    onNavigate: (page: 'shot' | 'angle' | 'tryon' | 'texteditor' | 'newfeature') => void;
}

// 카드 컴포넌트 추가 (첫 번째 위치 또는 적절한 위치)
<Card 
    variant="glass" 
    className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
    onClick={() => onNavigate('newfeature')}
>
    <div className="absolute inset-0 bg-gradient-to-br from-테마색상-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="relative">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-테마색상-500/20 rounded-xl">
                <Icon size={32} className="text-테마색상-500" />
            </div>
            <span className="text-xs bg-gradient-to-r from-테마색상-500 to-테마색상2-500 text-white px-3 py-1 rounded-full font-medium animate-pulse">
                배지텍스트
            </span>
        </div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-테마색상-400 to-테마색상2-600 bg-clip-text text-transparent">
            기능 이름
        </h3>
    </CardHeader>
    <CardBody className="relative">
        <p className="text-gray-400 mb-6">
            기능 설명
        </p>
        <ul className="space-y-2 mb-6 text-sm text-gray-500">
            <li className="flex items-center gap-2">
                <span className="text-테마색상-500">✓</span> 기능1
            </li>
            {/* 더 많은 기능들 */}
        </ul>
        <Button 
            variant="primary" 
            fullWidth 
            rightIcon={<IconArrowRight size={18} />}
            className="bg-gradient-to-r from-테마색상-500 to-테마색상2-600 hover:from-테마색상-600 hover:to-테마색상2-700 shadow-lg shadow-테마색상-500/30 hover:shadow-xl hover:shadow-테마색상-500/40 transform hover:scale-105 transition-all duration-300 border-2 border-white animate-pulse"
        >
            <span className="font-bold flex items-center gap-2">
                <IconSparkles size={16} />
                시작하기
            </span>
        </Button>
    </CardBody>
</Card>
```

### 2단계: 새 페이지 컴포넌트 생성
**파일**: `/pages/NewFeature.tsx`

```tsx
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { IconUpload, IconFeature, IconDownload, IconLoader2, IconSparkles } from '@tabler/icons-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea, Input } from '../components/ui/Input';
import { Image } from 'lucide-react';

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-테마색상-500" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

interface NewFeatureProps {
    ai: GoogleGenAI;
}

export const NewFeature: React.FC<NewFeatureProps> = ({ ai }) => {
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // 표준 API 호출 함수
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

    // 표준 파일 처리 함수들
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

    // 메인 처리 함수
    const handleProcess = async () => {
        if (!sourceImage) return;
        
        setIsLoading(true);
        setLoadingMessage("AI가 이미지를 처리하고 있습니다...");
        
        const prompt = `기능별 맞춤 프롬프트`; 
        
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
            <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                <IconFeature size={36} className="text-테마색상-500" />
                <span className="bg-gradient-to-r from-테마색상-400 to-테마색상2-600 bg-clip-text text-transparent">
                    기능 제목
                </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 입력 섹션 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 이미지 업로드 카드 */}
                    {/* 추가 입력 필드들 */}
                    
                    {/* 처리 버튼 */}
                    <Button
                        onClick={handleProcess}
                        disabled={!sourceImage || isLoading}
                        isLoading={isLoading}
                        size="lg"
                        fullWidth
                        variant="primary"
                        leftIcon={!isLoading && <IconFeature size={20} />}
                        className="bg-gradient-to-r from-테마색상-500 to-테마색상2-600 hover:from-테마색상-600 hover:to-테마색상2-700 border-2 border-white/80 shadow-lg shadow-테마색상-500/30 hover:shadow-xl hover:shadow-테마색상-500/40"
                    >
                        {isLoading ? '처리 중...' : '기능 실행하기'}
                    </Button>

                    {/* 팁 섹션 */}
                    <Card variant="glass" className="p-4">
                        <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <IconSparkles size={16} />
                            사용 팁
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-500">
                            {/* 팁들 */}
                        </ul>
                    </Card>
                </div>

                {/* 결과 섹션 */}
                <Card variant="glass" padding="none" className="h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                    {!resultImage && !isLoading && (
                        <div className="text-center text-gray-500 p-8">
                            <IconFeature size={48} className="mx-auto mb-4 opacity-50" />
                            <p>처리된 결과가 여기에 표시됩니다</p>
                        </div>
                    )}
                    {isLoading && <Loader message={loadingMessage} />}
                    {resultImage && !isLoading && (
                        <>
                            <img src={resultImage} alt="Result" className="w-full h-full rounded-md object-contain p-4" />
                            <div className="absolute bottom-4 flex gap-2">
                                <Button
                                    onClick={() => downloadImage(resultImage, 'result.png')}
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
```

### 3단계: 메인 앱 통합
**파일**: `/index.tsx`

```tsx
// import 추가
import { NewFeature } from './pages/NewFeature';

// 타입에 추가
type PageType = 'home' | 'shot' | 'angle' | 'tryon' | 'texteditor' | 'newfeature' | 'api';

// 라우팅에 추가
{currentPage === 'newfeature' && ai && (
    <NewFeature ai={ai} />
)}

// Home 컴포넌트 onNavigate 타입 업데이트
<Home onNavigate={(page: 'shot' | 'angle' | 'tryon' | 'texteditor' | 'newfeature') => setCurrentPage(page)} />
```

### 4단계: 헤더 네비게이션 추가
**파일**: `/components/Header.tsx`

```tsx
// 인터페이스 타입 업데이트
interface HeaderProps {
    currentPage: 'home' | 'shot' | 'angle' | 'tryon' | 'texteditor' | 'newfeature' | 'api';
    onNavigate: (page: 'home' | 'shot' | 'angle' | 'tryon' | 'texteditor' | 'newfeature' | 'api') => void;
    onApiSettingsClick: () => void;
}

// 데스크톱 네비게이션에 버튼 추가
<Button
    variant={currentPage === 'newfeature' ? 'primary' : 'ghost'}
    size="sm"
    onClick={() => onNavigate('newfeature')}
    className={currentPage === 'newfeature' ? 'bg-gradient-to-r from-테마색상-500 to-테마색상2-600' : ''}
>
    기능 이름
</Button>

// 모바일 네비게이션에도 동일하게 추가
```

## 🎨 테마 색상 가이드

### 사용된 테마들
- **에메랄드**: `emerald-500`, `green-600` (글로 쓰는 편집기)
- **오렌지**: `orange-500`, `orange-600` (샷 이미지 만들기)
- **보라색**: `purple-500`, `purple-600` (앵글 변환)
- **시안-블루**: `cyan-500`, `blue-600` (가상 옷 입히기)

### 추천 미사용 테마들
- **레드**: `red-500`, `pink-600`
- **옐로우**: `yellow-500`, `amber-600`
- **인디고**: `indigo-500`, `blue-800`
- **틸**: `teal-500`, `cyan-800`

## 🔧 표준 컴포넌트 패턴

### 버튼 스타일
```tsx
className="bg-gradient-to-r from-테마색상-500 to-테마색상2-600 hover:from-테마색상-600 hover:to-테마색상2-700 border-2 border-white/80 shadow-lg shadow-테마색상-500/30 hover:shadow-xl hover:shadow-테마색상-500/40"
```

### 카드 호버 효과
```tsx
className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
```

### 로더 컴포넌트
```tsx
const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-테마색상-500" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);
```

## ✅ 체크리스트

새 AI 기능 추가 시 확인사항:
- [ ] 홈 페이지 카드 추가 (적절한 위치)
- [ ] 고유 테마 색상 선택
- [ ] 페이지 컴포넌트 생성 (표준 패턴 적용)
- [ ] Gemini API 통합 (callImageApi 함수)
- [ ] 메인 앱 라우팅 추가
- [ ] 헤더 네비게이션 추가
- [ ] Props 인터페이스 타입 업데이트
- [ ] 로딩 상태 및 에러 처리
- [ ] 반응형 디자인 적용
- [ ] 다운로드 기능 구현

이 패턴을 따르면 일관성 있고 완성도 높은 AI 기능을 빠르게 추가할 수 있습니다! 🚀