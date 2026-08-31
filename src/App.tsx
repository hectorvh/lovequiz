import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Layout from './components/Layout';
import Start from './screens/Start';
import Intro from './screens/Intro';
import MainMenu from './screens/MainMenu';
import QuestionPlay from './screens/QuestionPlay';
import PartialResults from './screens/PartialResults';
import Results from './screens/Results';
import QuizCreation from './screens/QuizCreation';
import TakePhoto from './screens/TakePhoto';
import ModelViewer from './screens/ModelViewer';
import FinalSummary from './screens/FinalSummary';
import Settings from './screens/Settings';

import { useGameStore } from './state/gameStore';
import { setMuted, startMusic } from './lib/audio';

function MusicController() {
  const muted = useGameStore((s) => s.muted);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') startMusic(muted);
  }, [pathname, muted]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  return null;
}

export default function App() {
  const { i18n } = useTranslation();
  const locale = useGameStore((s) => s.locale);

  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  return (
    <BrowserRouter>
      <MusicController />
      <Layout>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/instructions" element={<Navigate to="/intro" replace />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/play/:groupId" element={<QuestionPlay />} />
          <Route path="/partial-results/:groupId" element={<PartialResults />} />
          <Route path="/results/:groupId" element={<Results />} />
          <Route path="/create-quiz" element={<QuizCreation />} />
          <Route path="/photo" element={<TakePhoto />} />
          <Route path="/model" element={<ModelViewer />} />
          <Route path="/summary" element={<FinalSummary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
