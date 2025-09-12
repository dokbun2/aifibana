import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import FaceSwap from './pages/FaceSwap';
import ImagePrompt from './pages/ImagePrompt';
import Motion from './pages/Motion';
import CharacterTurnaround from './pages/CharacterTurnaround';
import SceneFusion from './pages/SceneFusion';

const App: React.FC = () => {
  return (
    <div className="flex h-screen bg-brand-bg text-brand-text-primary">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/face-swap" replace />} />
          <Route path="/face-swap" element={<FaceSwap />} />
          <Route path="/image-prompt" element={<ImagePrompt />} />
          <Route path="/motion" element={<Motion />} />
          <Route path="/character-turnaround" element={<CharacterTurnaround />} />
          <Route path="/scene-fusion" element={<SceneFusion />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;