import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PONTO DE RESTAURAÇÃO: Registro do Service Worker para PWA
// Garantimos que o registro ocorra apenas em protocolos web padrão (http/https).
// Ambientes de sandbox (blob://, file://) são ignorados para evitar erros de segurança.
if ('serviceWorker' in navigator && window.isSecureContext) {
  const protocol = window.location.protocol;
  const isWebProtocol = protocol === 'http:' || protocol === 'https:';
  
  // Verificação adicional para domínios conhecidos de sandbox que não permitem SW
  const isSandbox = window.location.hostname.includes('usercontent.goog') || 
                    window.location.href.includes('blob:');

  if (isWebProtocol && !isSandbox) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
        })
        .catch(error => {
          // Erro tratado silenciosamente para não poluir o console em ambientes restritos
          console.warn('PWA: Registro do Service Worker ignorado ou bloqueado pelo ambiente.');
        });
    });
  }
}