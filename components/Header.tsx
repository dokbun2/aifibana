import React from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Button } from './ui/Button';

interface HeaderProps {
    currentPage: 'home' | 'shot' | 'angle' | 'api';
    onNavigate: (page: 'home' | 'shot' | 'angle' | 'api') => void;
    onApiSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, onApiSettingsClick }) => {
    return (
        <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => onNavigate('home')}
                    >
                        <h1 className="text-2xl md:text-3xl font-bold">
                            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">AIFI</span>
                            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent ml-1">바나나</span>
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-4">
                        <Button
                            variant={currentPage === 'shot' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => onNavigate('shot')}
                        >
                            이미지 생성
                        </Button>
                        <Button
                            variant={currentPage === 'angle' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => onNavigate('angle')}
                        >
                            앵글 변환
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onApiSettingsClick}
                            leftIcon={<IconSettings size={16} />}
                        >
                            API 연결
                        </Button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onApiSettingsClick}
                        >
                            <IconSettings size={20} />
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden mt-4 flex gap-2">
                    <Button
                        variant={currentPage === 'shot' ? 'secondary' : 'ghost'}
                        size="sm"
                        fullWidth
                        onClick={() => onNavigate('shot')}
                    >
                        이미지 생성
                    </Button>
                    <Button
                        variant={currentPage === 'angle' ? 'primary' : 'ghost'}
                        size="sm"
                        fullWidth
                        onClick={() => onNavigate('angle')}
                    >
                        앵글 변환
                    </Button>
                </div>
            </div>
        </header>
    );
};