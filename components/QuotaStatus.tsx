import React, { useState, useEffect } from 'react';
import { IconAlertCircle, IconClock, IconTrendingUp } from '@tabler/icons-react';
import { getUsageStats, shouldSuggestUpgrade } from '../utils/requestManager';

interface QuotaStatusProps {
  compact?: boolean;
  onUpgradeClick?: () => void;
}

const QuotaStatus: React.FC<QuotaStatusProps> = ({ compact = false, onUpgradeClick }) => {
  const [stats, setStats] = useState(getUsageStats());
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      const newStats = getUsageStats();
      setStats(newStats);

      // Calculate time until reset
      const now = new Date();
      const resetTime = new Date(newStats.resetTime);
      const diffMs = resetTime.getTime() - now.getTime();

      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilReset(`${hours}시간 ${minutes}분`);
      } else {
        setTimeUntilReset('곧 리셋');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const usagePercentage = (stats.dailyUsage / stats.dailyLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;
  const suggestUpgrade = shouldSuggestUpgrade();

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs">
        <div className={`flex items-center gap-1 ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'}`}>
          {isAtLimit && <IconAlertCircle size={14} />}
          <span>{stats.remainingRequests}/{stats.dailyLimit} 남음</span>
        </div>
        {stats.queueLength > 0 && (
          <span className="text-gray-500">대기: {stats.queueLength}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          API 사용량 현황
          {stats.processing && (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </h3>
        {timeUntilReset && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <IconClock size={14} />
            <span>리셋: {timeUntilReset}</span>
          </div>
        )}
      </div>

      {/* Usage Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>일일 사용량</span>
          <span>{stats.dailyUsage} / {stats.dailyLimit}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Messages */}
      {isAtLimit && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <IconAlertCircle size={16} className="text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-400 font-medium">일일 할당량 초과</p>
              <p className="text-xs text-gray-400 mt-1">
                무료 등급 제한(25개)에 도달했습니다. {timeUntilReset} 후 리셋됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <IconAlertCircle size={16} className="text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-yellow-400 font-medium">할당량 주의</p>
              <p className="text-xs text-gray-400 mt-1">
                남은 요청: {stats.remainingRequests}개
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queue Status */}
      {stats.queueLength > 0 && (
        <div className="text-xs text-gray-400 mb-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            대기 중인 요청: {stats.queueLength}개
          </span>
        </div>
      )}

      {/* Upgrade Suggestion */}
      {(suggestUpgrade || isAtLimit) && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <IconTrendingUp size={16} className="text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-primary font-medium">유료 업그레이드 추천</p>
              <p className="text-xs text-gray-400 mt-1">
                더 많은 요청과 안정적인 서비스를 위해 유료 등급을 고려해보세요.
              </p>
              {onUpgradeClick && (
                <button
                  onClick={onUpgradeClick}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  업그레이드 방법 보기 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Free Tier Info */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <span className="text-gray-500 block">분당 제한</span>
            <span className="text-gray-300 font-medium">5개</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500 block">일일 제한</span>
            <span className="text-gray-300 font-medium">25개</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500 block">리셋 시간</span>
            <span className="text-gray-300 font-medium">오후 5시</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaStatus;