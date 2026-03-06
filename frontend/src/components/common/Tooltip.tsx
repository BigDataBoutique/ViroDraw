import { useState, useRef, useCallback } from 'react';

interface Props {
  text: string;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export function Tooltip({ text, delay = 400, className, children }: Props) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <div className={`relative ${className || ''}`} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none">
          <div className="relative bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 rotate-45" />
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
