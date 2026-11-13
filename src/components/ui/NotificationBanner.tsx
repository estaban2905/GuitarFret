/**
 * @file NotificationBanner.tsx
 * @description Banner accesible de notificación temporal/inline (reemplaza alert()).
 */

import type React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationVariant = 'success' | 'error' | 'info';

export interface NotificationMessage {
  variant: NotificationVariant;
  text: string;
}

interface NotificationBannerProps {
  notification: NotificationMessage | null;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss
}) => {
  if (!notification) return null;

  const styleMap: Record<NotificationVariant, string> = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-300'
  };

  const Icon =
    notification.variant === 'success'
      ? CheckCircle2
      : notification.variant === 'error'
        ? AlertCircle
        : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full px-3.5 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${styleMap[notification.variant]}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="font-medium">{notification.text}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
        aria-label="Cerrar aviso"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
