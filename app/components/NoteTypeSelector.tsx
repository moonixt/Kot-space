"use client";

import { Users, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface NoteTypeSelectorProps {
  currentType: 'private' | 'public';
  onTypeChange: (type: 'private' | 'public') => void;
  className?: string;
  saveToLocalStorage?: boolean;
}

export default function NoteTypeSelector({ 
  currentType, 
  onTypeChange,
  className = "",
  saveToLocalStorage = true
}: NoteTypeSelectorProps) {
  const { t } = useTranslation();
  
  // Função para salvar a preferência de visualização no localStorage
  const saveViewPreference = (type: 'private' | 'public') => {
    if (saveToLocalStorage && typeof window !== 'undefined') {
      localStorage.setItem('fair-note-view-preference', type);
      localStorage.setItem('fair-note-last-view-change', new Date().toISOString());
    }
  };

  // Handler para mudança de tipo que inclui o salvamento da preferência
  const handleTypeChange = (type: 'private' | 'public') => {
    onTypeChange(type);
    saveViewPreference(type);
  };

  // Salvar automaticamente quando currentType mudar (caso seja alterado externamente)
  useEffect(() => {
    if (saveToLocalStorage) {
      saveViewPreference(currentType);
    }
  }, [currentType, saveToLocalStorage]);
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleTypeChange('private')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentType === 'private'
              ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md'
              : 'bg-[var(--background)] text-[var(--foreground)] dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title={t('noteTypeSelector.privateTooltip')}
        >
          <Lock size={16} />
          <span>{t('noteTypeSelector.privateNotes')}</span>
        </button>
        
        <button
          onClick={() => handleTypeChange('public')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentType === 'public'
              ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md'
              : 'bg-[var(--background)] text-[var(--foreground)] dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title={t('noteTypeSelector.publicTooltip')}
        >
          <Users size={16} />
          <span>{t('noteTypeSelector.collaborativeNotes')}</span>
        </button>
      </div>
    </div>
  );
}

// Componente de status de conexão para notas públicas
export function CollaborativeStatus({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span>
        {t('noteTypeSelector.collaboration')}: {isConnected ? `🟢 ${t('noteTypeSelector.connected')}` : `🔴 ${t('noteTypeSelector.disconnected')}`}
      </span>
    </div>
  );
}

// Hook para gerenciar a preferência de visualização (qual tipo de nota está vendo)
export function useNoteViewPreference(defaultView: 'private' | 'public' = 'private') {
  const getSavedViewPreference = (): 'private' | 'public' => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fair-note-view-preference');
      return (saved as 'private' | 'public') || defaultView;
    }
    return defaultView;
  };

  const saveViewPreference = (type: 'private' | 'public') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fair-note-view-preference', type);
      localStorage.setItem('fair-note-last-view-change', new Date().toISOString());
    }
  };

  const getLastViewChangeDate = (): Date | null => {
    if (typeof window !== 'undefined') {
      const lastChange = localStorage.getItem('fair-note-last-view-change');
      return lastChange ? new Date(lastChange) : null;
    }
    return null;
  };

  const clearViewPreference = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fair-note-view-preference');
      localStorage.removeItem('fair-note-last-view-change');
    }
  };

  return {
    getSavedViewPreference,
    saveViewPreference,
    getLastViewChangeDate,
    clearViewPreference
  };
}
