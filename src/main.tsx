import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StudyDataProvider } from './context/useStudyData.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudyDataProvider>
      <App />
    </StudyDataProvider>
  </StrictMode>,
);
