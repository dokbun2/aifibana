import React from 'react';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '../types';
import { FaceSwapIcon, ImagePromptIcon, MotionIcon, CharacterTurnaroundIcon, SceneFusionIcon } from './icons/FeatureIcons';

const navItems: NavItem[] = [
  { path: '/face-swap', name: '페이스 스왑', icon: <FaceSwapIcon /> },
  { path: '/image-prompt', name: '이미지 생성', icon: <ImagePromptIcon /> },
  { path: '/motion', name: '모션 테크닉', icon: <MotionIcon /> },
  { path: '/character-turnaround', name: '캐릭터 턴어라운드', icon: <CharacterTurnaroundIcon /> },
  { path: '/scene-fusion', name: '장면 퓨전', icon: <SceneFusionIcon /> },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-black flex flex-col p-4">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-xl text-black">
          A
        </div>
        <h1 className="text-xl font-bold text-white">AIFI 스튜디오</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 group ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-brand-secondary hover:bg-brand-surface hover:text-white'
              }`
            }
          >
            {/* Fix: Use a render prop for NavLink children to bring `isActive` into scope for styling the icon. */}
            {({ isActive }) => (
              <>
                <div className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-black' : 'text-brand-secondary group-hover:text-white'
                }`}>{item.icon}</div>
                <span className="font-medium">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-center text-xs text-gray-600">
        <p>Powered by Nanobanana</p>
      </div>
    </aside>
  );
};

export default Sidebar;
