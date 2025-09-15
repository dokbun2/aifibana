import React, { useState } from 'react';
import { IconX, IconQuestionMark, IconExternalLink, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: 'faq' | 'quota' | 'troubleshooting';
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'quota' | 'api' | 'usage' | 'error';
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, initialSection = 'faq' }) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  if (!isOpen) return null;

  const faqItems: FAQItem[] = [
    {
      question: '429 Error (할당량 초과)가 계속 발생해요',
      answer: '무료 등급은 분당 5개, 일일 25개 요청으로 제한됩니다. 다음 방법을 시도해보세요:\n\n1. 한국 시간 오후 5시까지 기다리기 (일일 할당량 리셋)\n2. 요청 간격을 12초 이상으로 늘리기\n3. 유료 등급으로 업그레이드하기 (권장)',
      category: 'quota'
    },
    {
      question: '새로 API 키를 만들었는데도 할당량 초과가 떠요',
      answer: '할당량은 API 키가 아닌 Google 계정/프로젝트 단위로 관리됩니다. 새 API 키를 만들어도 같은 프로젝트라면 할당량이 공유됩니다.\n\n해결 방법:\n• 새 Google 계정으로 새 프로젝트 생성\n• 유료 등급으로 업그레이드',
      category: 'quota'
    },
    {
      question: '무료와 유료 등급의 차이가 뭔가요?',
      answer: '무료 등급:\n• 분당 5개 요청 (12초 간격)\n• 일일 25개 요청\n• 테스트/개발용\n\n유료 등급:\n• 분당 360개 요청\n• 일일 제한 없음\n• 실제 서비스용\n• 더 안정적인 성능',
      category: 'api'
    },
    {
      question: '유료 등급으로 어떻게 업그레이드하나요?',
      answer: '1. Google AI Studio (https://aistudio.google.com) 접속\n2. 좌측 하단 Settings > Plan Information 클릭\n3. "Set up Billing" 버튼 클릭\n4. 결제 정보 입력\n5. 프로젝트 결제 활성화 완료',
      category: 'api'
    },
    {
      question: '이미지가 생성되지 않아요',
      answer: '다음을 확인해주세요:\n\n1. API 키가 올바른지 확인\n2. 이미지 크기가 4MB 이하인지 확인\n3. 지원 형식인지 확인 (JPEG, PNG, WebP, GIF)\n4. 할당량이 남아있는지 확인\n5. 프롬프트가 Google 정책을 위반하지 않는지 확인',
      category: 'error'
    },
    {
      question: '언제 할당량이 리셋되나요?',
      answer: '태평양 시간(PST) 자정에 리셋됩니다.\n\n한국 시간 기준:\n• 겨울: 오후 5시\n• 여름(서머타임): 오후 4시\n\n앱 상단의 할당량 표시기에서 정확한 리셋 시간을 확인할 수 있습니다.',
      category: 'quota'
    },
    {
      question: '여러 장의 이미지를 한 번에 처리하려면?',
      answer: '무료 등급에서는 요청 제한 때문에 어렵습니다.\n\n권장 방법:\n1. 이미지를 하나씩 처리 (12초 간격)\n2. 유료 등급으로 업그레이드\n3. 배치 처리 기능 활용 (개발 예정)',
      category: 'usage'
    },
    {
      question: 'API 키는 안전한가요?',
      answer: 'API 키는 브라우저의 로컬 저장소에만 저장되며, 서버로 전송되지 않습니다.\n\n보안 팁:\n• API 키를 다른 사람과 공유하지 마세요\n• 공용 컴퓨터에서 사용 후 로그아웃하세요\n• 정기적으로 API 키를 재발급하세요',
      category: 'api'
    }
  ];

  const toggleExpand = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getCategoryIcon = (category: FAQItem['category']) => {
    switch (category) {
      case 'quota': return '📊';
      case 'api': return '🔑';
      case 'usage': return '💡';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <IconQuestionMark size={20} />
            도움말 & FAQ
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <IconX size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveSection('faq')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'faq'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            자주 묻는 질문
          </button>
          <button
            onClick={() => setActiveSection('quota')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'quota'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            할당량 가이드
          </button>
          <button
            onClick={() => setActiveSection('troubleshooting')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'troubleshooting'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            문제 해결
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4">
          {activeSection === 'faq' && (
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(index)}
                    className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-lg mt-0.5">{getCategoryIcon(item.category)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.question}</p>
                    </div>
                    {expandedItems.includes(index) ? (
                      <IconChevronUp size={18} className="text-gray-400 mt-0.5" />
                    ) : (
                      <IconChevronDown size={18} className="text-gray-400 mt-0.5" />
                    )}
                  </button>
                  {expandedItems.includes(index) && (
                    <div className="px-4 pb-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 whitespace-pre-line mt-3">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === 'quota' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">할당량 관리 전략</h3>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>요청 간격을 12초 이상으로 유지하여 분당 제한 회피</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>중요한 작업은 할당량이 충분할 때 처리</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>테스트는 최소한으로, 실제 작업에 할당량 집중</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>결과물을 저장하여 재생성 방지</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">할당량 초과 시</h3>
                <ol className="space-y-1 text-xs text-gray-400 list-decimal list-inside">
                  <li>현재 시간 확인 (리셋까지 남은 시간)</li>
                  <li>급한 경우 유료 업그레이드 고려</li>
                  <li>다른 Google 계정으로 새 프로젝트 생성</li>
                  <li>리셋 시간(오후 5시)까지 대기</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'troubleshooting' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">에러별 해결 방법</h3>

                <div className="space-y-3">
                  <div className="border-l-2 border-red-500 pl-3">
                    <h4 className="text-xs font-medium text-red-400">429 Error</h4>
                    <p className="text-xs text-gray-400 mt-1">할당량 초과 → 유료 업그레이드 또는 대기</p>
                  </div>

                  <div className="border-l-2 border-yellow-500 pl-3">
                    <h4 className="text-xs font-medium text-yellow-400">400 Error</h4>
                    <p className="text-xs text-gray-400 mt-1">잘못된 요청 → API 키 확인, 이미지 형식 확인</p>
                  </div>

                  <div className="border-l-2 border-blue-500 pl-3">
                    <h4 className="text-xs font-medium text-blue-400">500 Error</h4>
                    <p className="text-xs text-gray-400 mt-1">서버 오류 → 잠시 후 재시도</p>
                  </div>

                  <div className="border-l-2 border-purple-500 pl-3">
                    <h4 className="text-xs font-medium text-purple-400">정책 위반</h4>
                    <p className="text-xs text-gray-400 mt-1">콘텐츠 정책 → 프롬프트 수정</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">유용한 링크</h3>
                <div className="space-y-2">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <IconExternalLink size={14} />
                    API 키 관리
                  </a>
                  <a
                    href="https://aistudio.google.com/app/plan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <IconExternalLink size={14} />
                    유료 플랜 업그레이드
                  </a>
                  <a
                    href="https://ai.google.dev/gemini-api/docs/troubleshooting"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <IconExternalLink size={14} />
                    공식 문제 해결 가이드
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;