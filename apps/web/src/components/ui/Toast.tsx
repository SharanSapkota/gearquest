'use client';

import { useTranslations } from 'next-intl';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { IconButton } from './Button';
import { CloseIcon } from './icons';

type Tone = 'info' | 'error' | 'success';
type ToastItem = { id: number; text: string; tone: Tone };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

const LIFETIME_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('ui');
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((i) => i.id !== id)), []);
  const push = useCallback(
    (text: string, tone: Tone = 'info') => {
      const id = nextId.current++;
      setItems((l) => [...l, { id, text, tone }]);
      setTimeout(() => dismiss(id), LIFETIME_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast toast--${item.tone}`}>
            <span>{item.text}</span>
            <IconButton label={t('dismiss')} variant="ghost" onClick={() => dismiss(item.id)}>
              <CloseIcon size={18} />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
