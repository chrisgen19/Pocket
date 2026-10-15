import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './popup';
import './popup.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Popup root element #root is missing from index.html');

createRoot(rootElement).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
