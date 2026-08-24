import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Layout from './components/Layout';
import Intro from './screens/Intro';
import Instructions from './screens/Instructions';
import MainMenu from './screens/MainMenu';
import QuestionPlay from './screens/QuestionPlay';
import PartialResults from './screens/PartialResults';
import Results from './screens/Results';
import QuizCreation from './screens/QuizCreation';
import TakePhoto from './screens/TakePhoto';
import FinalSummary from './screens/FinalSummary';
import Settings from './screens/Settings';

import { useGameStore } from './state/gameStore';
import { setMuted, startMusic } from './lib/audio';

export default function App() {
  const { i18n } = useTranslation();
  const locale = useGameStore((s) => s.locale);
  const muted = useGameStore((s) => s.muted);

  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  useEffect(() => {
    startMusic(muted);
  }, []);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/play/:groupId" element={<QuestionPlay />} />
          <Route path="/partial-results/:groupId" element={<PartialResults />} />
          <Route path="/results" element={<Results />} />
          <Route path="/create-quiz" element={<QuizCreation />} />
          <Route path="/photo" element={<TakePhoto />} />
          <Route path="/summary" element={<FinalSummary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
