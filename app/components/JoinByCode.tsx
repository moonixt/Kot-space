"use client";

import React, { useState } from 'react';
import { Check, X, Link } from 'lucide-react';
import { realtimeManager } from '../../lib/realtimeManager';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface JoinByCodeProps {
  onSuccess?: (noteId: string) => void;
  onError?: (error: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const JoinByCode: React.FC<JoinByCodeProps> = ({ 
  onSuccess, 
  onError, 
  isOpen: externalIsOpen,
  onClose: externalOnClose 
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  // Use external state if provided, otherwise use internal state
  const isFormOpen = externalIsOpen !== undefined ? externalIsOpen : showForm;
  const closeForm = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setShowForm(false);
    }
    setInviteCode('');
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;

    setLoading(true);
    try {
      const result = await realtimeManager.useInviteCode(inviteCode.trim().toUpperCase());
      
      if (result.success && result.noteId) {
        onSuccess?.(result.noteId);
        setInviteCode('');
        closeForm();
      } else {
        onError?.(result.error || t('collaboration.joinByCode.errors.generic'));
      }
    } catch (error) {
      onError?.(t('collaboration.joinByCode.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  if (!isFormOpen) {
    // If external control is used, don't render the button
    if (externalIsOpen !== undefined) {
      return null;
    }
    
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
      >
        <Link size={16} />
        {t('collaboration.joinByCode.title')}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] border border-[var(--border-theme)] rounded-lg p-6 shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {t('collaboration.joinByCode.title')}
          </h3>
          <button
            onClick={closeForm}
            className="text-[var(--foreground)] hover:text-[var(--foreground)]/70 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleJoinByCode} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {t('collaboration.joinByCode.inputLabel')}
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder={t('collaboration.joinByCode.inputPlaceholder')}
              className="w-full px-3 py-2 border border-[var(--border-theme)] rounded-lg 
                       bg-[var(--background)] text-[var(--foreground)]
                       focus:ring-2 focus:ring-[var(--button-theme)] focus:border-transparent
                       placeholder-[var(--foreground)]/50"
              maxLength={8}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={loading}
              className="px-4 py-2 border border-[var(--border-theme)] text-[var(--foreground)] 
                       rounded-lg hover:bg-[var(--foreground)]/5 transition-colors"
            >
              {t('collaboration.joinByCode.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim() || loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--button-theme)] hover:opacity-80
                       text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {loading ? t('collaboration.joinByCode.joiningButton') : t('collaboration.joinByCode.joinButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  ); 
};

export default JoinByCode;
