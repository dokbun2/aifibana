/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ApiSetup from './components/ApiSetup';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ShotGenerator } from './pages/ShotGenerator';
import { AngleConverter } from './pages/AngleConverter';
import { TryOn } from './pages/TryOn';
import { IconLoader2 } from '@tabler/icons-react';

type PageType = 'home' | 'shot' | 'angle' | 'tryon' | 'api';

const Loader = ({ message }: { message: string }) => (
    <div className="text-center">
        <IconLoader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <p className="mt-4 text-gray-400">{message}</p>
    </div>
);

const App: React.FC = () => {
    // Global State
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [currentPage, setCurrentPage] = useState<PageType>('home');
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [needsApiKey, setNeedsApiKey] = useState(false);
    const [showApiSettings, setShowApiSettings] = useState(false);

    
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
        setShowApiSettings(false);
    };

    const handleNavigate = (page: PageType) => {
        if (page === 'api') {
            setShowApiSettings(true);
        } else {
            setCurrentPage(page);
        }
    };

    const handleApiSettingsClick = () => {
        setShowApiSettings(true);
    };

    if (needsApiKey || showApiSettings) {
        return <ApiSetup onApiKeySet={handleApiKeySet} />;
    }

    if (apiError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-900">
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
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <Loader message="API 초기화 중..." />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Header 
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onApiSettingsClick={handleApiSettingsClick}
            />
            
            <main className="container mx-auto">
                {currentPage === 'home' && (
                    <Home onNavigate={(page: 'shot' | 'angle' | 'tryon') => setCurrentPage(page)} />
                )}
                {currentPage === 'shot' && ai && (
                    <ShotGenerator ai={ai} />
                )}
                {currentPage === 'angle' && ai && (
                    <AngleConverter ai={ai} />
                )}
                {currentPage === 'tryon' && ai && (
                    <TryOn ai={ai} />
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
