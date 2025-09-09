import React from 'react';
import { IconSparkles, IconCamera, IconArrowRight, IconHanger, IconEdit } from '@tabler/icons-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface HomeProps {
    onNavigate: (page: 'shot' | 'angle' | 'tryon' | 'texteditor') => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    return (
        <div className="container mx-auto p-4 md:p-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-pulse">
                    <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">AIFI</span>
                    <span className="bg-gradient-to-b from-green-400 to-orange-600 bg-clip-text text-transparent">와</span>
                    <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent ml-2">나노바나나가 만났다.</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8">
                    AI로 일관성 있는 이미지를 만들고 수정하세요
                </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-8xl mx-auto">
                {/* Text Editor Card */}
                <Card 
                    variant="glass" 
                    className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => onNavigate('texteditor')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <IconEdit size={32} className="text-emerald-500" />
                            </div>
                            <span className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1 rounded-full font-medium animate-pulse">
                                NEW
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                            글로 쓰는 편집기
                        </h3>
                    </CardHeader>
                    <CardBody className="relative">
                        <p className="text-gray-400 mb-6">
                            이제는 나노바나나에서 텍스트로 이미지를 편집하세요. 
                            자연어 명령 만으로 이미지를 수정, 변환, 보정할 수 있습니다.
                        </p>
                        <ul className="space-y-2 mb-6 text-sm text-gray-500">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> 자연어 명령 처리
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> 실시간 편집 미리보기
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> 다양한 편집 효과
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> 한국어 지원
                            </li>
                        </ul>
                        <Button 
                            variant="primary" 
                            fullWidth 
                            rightIcon={<IconArrowRight size={18} />}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300 border-2 border-white animate-pulse"
                        >
                            <span className="font-bold flex items-center gap-2">
                                <IconSparkles size={16} />
                                시작하기
                            </span>
                        </Button>
                    </CardBody>
                </Card>

                {/* Shot Generator Card */}
                <Card 
                    variant="glass" 
                    className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => onNavigate('shot')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-500/20 rounded-xl">
                                <IconSparkles size={32} className="text-orange-500" />
                            </div>
                            <span className="text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                                인기
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                            샷 이미지 만들기
                        </h3>
                    </CardHeader>
                    <CardBody className="relative">
                        <p className="text-gray-400 mb-6">
                            업로드한 이미지를 기반으로 일관성 있는 새로운 이미지를 생성합니다. 
                            캐릭터의 스타일,특징,다양한 장면과 각도의 이미지를 만드세요.
                        </p>
                        <ul className="space-y-2 mb-6 text-sm text-gray-500">
                            <li className="flex items-center gap-2">
                                <span className="text-orange-500">✓</span> 최대 8개 이미지 업로드
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-orange-500">✓</span> 블록화 프롬프트 지원
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-orange-500">✓</span> 한국어 자동 번역
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-orange-500">✓</span> 다양한 크기로 다운로드
                            </li>
                        </ul>
                        <Button 
                            variant="primary" 
                            fullWidth 
                            rightIcon={<IconArrowRight size={18} />}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transform hover:scale-105 transition-all duration-300 border-2 border-white"
                        >
                            <span className="font-bold">시작하기</span>
                        </Button>
                    </CardBody>
                </Card>

                {/* Angle Converter Card */}
                <Card 
                    variant="glass" 
                    className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => onNavigate('angle')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <IconCamera size={32} className="text-purple-500" />
                            </div>
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                                새기능
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                            이미지 앵글 변환
                        </h3>
                    </CardHeader>
                    <CardBody className="relative">
                        <p className="text-gray-400 mb-6">
                            하나의 이미지를 다양한 각도로 변환합니다. 
                            정면, 측면, 3/4 각도 등 원하는 앵글로 이미지를 자연스럽게 변환해보세요.
                        </p>
                        <ul className="space-y-2 mb-6 text-sm text-gray-500">
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span> 6가지 앵글 지원
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span> 실시간 변환
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span> 높은 품질 유지
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span> 간편한 다운로드
                            </li>
                        </ul>
                        <Button 
                            variant="primary" 
                            fullWidth 
                            rightIcon={<IconArrowRight size={18} />}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-300 border-2 border-white"
                        >
                            <span className="font-bold">시작하기</span>
                        </Button>
                    </CardBody>
                </Card>

                {/* Virtual Try-On Card */}
                <Card 
                    variant="glass" 
                    className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => onNavigate('tryon')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl">
                                <IconHanger size={32} className="text-cyan-500" />
                            </div>
                            <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full font-medium">
                                HOT
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                            AI 스튜디오
                        </h3>
                    </CardHeader>
                    <CardBody className="relative">
                        <p className="text-gray-400 mb-6">
                            올인원 이미지 AI 스튜디오입니다.
                            가상 착용, 이미지 합성, 이미지 편집 기능을 한 곳에서 사용하세요.
                        </p>
                        <ul className="space-y-2 mb-6 text-sm text-gray-500">
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-500">✓</span> 가상 착용 시뮬레이션
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-500">✓</span> 고급 이미지 합성
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-500">✓</span> 정밀 이미지 편집
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-500">✓</span> 브러시 기반 영역 선택
                            </li>
                        </ul>
                        <Button 
                            variant="primary" 
                            fullWidth 
                            rightIcon={<IconArrowRight size={18} />}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:scale-105 transition-all duration-300 animate-pulse border-2 border-white"
                        >
                            <span className="font-bold flex items-center gap-2">
                                <IconSparkles size={16} />
                                시작하기
                            </span>
                        </Button>
                    </CardBody>
                </Card>

            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center">
                <p className="text-gray-500 mb-4">
                    Google Gemini API를 활용한 최신 AI 이미지 생성 기술, Copyrights 2025. AIFI All rights Reserved.
                </p>

            </div>
        </div>
    );
};