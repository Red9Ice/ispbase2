/**
 * @file: ConfirmDialog.tsx
 * @description: Красивое модальное окно подтверждения удаления.
 * @dependencies: none
 * @created: 2026-01-27
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    console.log('ConfirmDialog: isOpen changed to', isOpen);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('ConfirmDialog: body overflow hidden');
    } else {
      document.body.style.overflow = '';
      console.log('ConfirmDialog: body overflow reset');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  // Убеждаемся, что document.body существует перед созданием портала
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className={`confirm-dialog ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          {type === 'danger' && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {type === 'warning' && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
          {type === 'info' && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          )}
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-button cancel" onClick={() => {
            console.log('Cancel button clicked');
            onCancel();
          }}>
            {cancelText}
          </button>
          <button type="button" className={`confirm-dialog-button confirm ${type}`} onClick={() => {
            console.log('Confirm button clicked');
            onConfirm();
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
