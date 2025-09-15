import React, { useState } from 'react';
import { IconX, IconInfoCircle, IconExternalLink } from '@tabler/icons-react';

interface ApiSetupProps {
    onApiKeySet: (apiKey: string) => void;
    onClose?: () => void;
    showCloseButton?: boolean;
}

const ApiSetup: React.FC<ApiSetupProps> = ({ onApiKeySet, onClose, showCloseButton = false }) => {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!apiKey.trim()) {
            setError('API 키를 입력해주세요.');
            return;
        }

        if (!apiKey.startsWith('AIza')) {
            setError('유효한 Google Gemini API 키 형식이 아닙니다.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Test the API key with a simple request
            const testResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
            
            if (!testResponse.ok) {
                throw new Error('API 키가 유효하지 않습니다.');
            }

            // Store in localStorage for persistence
            localStorage.setItem('gemini_api_key', apiKey);
            onApiKeySet(apiKey);
        } catch (err) {
            setError('API 키 검증에 실패했습니다. 올바른 키인지 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-primary">AIFI</span><span className="text-accent"> 바나나</span>
                    </h1>
                    <p className="text-gray-400">AI로 일관성 있는 이미지를 만들고 수정하세요.</p>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 relative">
                    {showCloseButton && onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="닫기"
                        >
                            <IconX size={20} className="text-gray-400 hover:text-white" />
                        </button>
                    )}
                    <h2 className="text-xl font-semibold text-white mb-4">Google Gemini API 설정</h2>
                    
                    <div className="mb-4 text-sm text-gray-400 space-y-2">
                        <p>이 앱을 사용하려면 Google Gemini API 키가 필요합니다.</p>
                        <p>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                                여기서 무료 API 키를 발급받으세요
                                <IconExternalLink size={14} />
                            </a>
                        </p>
                    </div>

                    {/* Quota Information */}
                    <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start gap-2 mb-3">
                            <IconInfoCircle size={20} className="text-yellow-500 mt-0.5" />
                            <h3 className="text-sm font-semibold text-white">API 등급별 제한 사항</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                                <h4 className="text-gray-300 font-medium">📌 무료 등급 (Free Tier)</h4>
                                <ul className="space-y-1 text-gray-400">
                                    <li>• 분당 5개 요청 (12초 간격)</li>
                                    <li>• 일일 25개 요청 제한</li>
                                    <li>• 매일 오후 5시 리셋 (한국시간)</li>
                                    <li className="text-yellow-500">⚠️ 테스트용으로만 권장</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-gray-300 font-medium">💎 유료 등급 (Paid Tier)</h4>
                                <ul className="space-y-1 text-gray-400">
                                    <li>• 분당 360개 요청</li>
                                    <li>• 일일 제한 없음</li>
                                    <li>• 안정적인 서비스</li>
                                    <li className="text-green-500">✅ 실제 사용 권장</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-gray-400">
                                💡 할당량 초과 시 "429 Error"가 발생합니다.
                                <a
                                    href="https://aistudio.google.com/app/plan"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
                                >
                                    유료 업그레이드 방법
                                    <IconExternalLink size={12} />
                                </a>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="apikey" className="block text-sm font-medium text-gray-300 mb-2">
                                API 키
                            </label>
                            <input
                                type="password"
                                id="apikey"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '검증 중...' : 'API 키 설정하기'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <div className="text-xs text-gray-500">
                            <p className="mb-2">💡 API 키는 브라우저 로컬 저장소에 안전하게 보관됩니다.</p>
                            <p>🔒 키는 서버로 전송되지 않으며, 오직 Google API와의 직접 통신에만 사용됩니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiSetup;