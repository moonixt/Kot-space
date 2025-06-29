"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage } from '@radix-ui/react-avatar';
import { 
  Plus, 
  Crown, 
  Edit, 
  Eye, 
  X, 
  MoreHorizontal, 
  Trash2, 
  Settings,
  CheckCircle,
  AlertCircle,
  Copy,
  Link,
  QrCode,
  Calendar,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { realtimeManager } from '../../lib/realtimeManager';
import { supabase } from '../../lib/supabase';

interface Collaborator {
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  isOwner?: boolean;
  permission?: 'owner' | 'admin' | 'write' | 'read';
}

interface CollaboratorManagerProps {
  collaborators: Collaborator[];
  noteId: string;
  currentUserId: string;
  userPermission: 'owner' | 'admin' | 'write' | 'read' | null;
  onRefreshCollaborators?: () => void;
  isPublicNote?: boolean; // New prop to distinguish public notes
}

interface InviteCode {
  id: string;
  invite_code: string;
  permission: 'read' | 'write' | 'admin';
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  created_at: string;
  is_active: boolean;
}

interface UserAvatarProps {
  user: Collaborator;
  isOnline?: boolean;
  showPermission?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  isOnline = false, 
  showPermission = false,
  size = 'md'
}) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const hasCustomAvatar = !!user.avatar_url;
  const [avatarUrl, setAvatarUrl] = useState<string>('/icons/icon-512x512.png');

  useEffect(() => {
    if (hasCustomAvatar && user.avatar_url) {
      const { data } = supabase.storage
        .from('user-avatar')
        .getPublicUrl(user.avatar_url);
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
      } else {
        setAvatarUrl('/icons/icon-512x512.png');
      }
    } else {
      setAvatarUrl('/icons/icon-512x512.png');
    }
  }, [user.avatar_url, hasCustomAvatar]);

  // Debug: verificar se o avatar_url está chegando e a URL final
  useEffect(() => {
    console.log('[DEBUG] UserAvatar - user data:', {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      hasAvatar: !!user.avatar_url,
      avatarUrl
    });
  }, [user, avatarUrl]);


  const getPermissionIcon = (permission?: string) => {
    switch (permission) {
      case 'owner':
        return <Crown size={12} className="text-yellow-500" />;
      case 'admin':
        return <Crown size={12} className="text-yellow-400" />;
      case 'write':
        return <Edit size={12} className="text-blue-400" />;
      case 'read':
        return <Eye size={12} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  const displayName = user.full_name || user.email || user.user_id || t('collaboratorManager.permissions.collaborator');


  return (
    <div className="relative group">
      <div className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white bg-blue-500 border-gray-400 transition-all overflow-hidden`}>
        <Avatar>
          <AvatarImage
            className={`w-full h-full rounded-full object-cover object-center border-1 border-black`}
            src={hasCustomAvatar && !imageError ? avatarUrl : "/icons/icon-512x512.png"}
            alt="Profile avatar"
            onError={() => {
              setImageError(true);
              setAvatarUrl('/icons/icon-512x512.png');
            }}
          />
        </Avatar>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full"></div>
        )}
        {showPermission && getPermissionIcon(user.permission)}
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        <div>{displayName}</div>
        {user.permission && (
          <div className="text-gray-300 capitalize">
            {user.permission === 'owner' ? t('collaboratorManager.permissions.owner') : 
             user.permission === 'admin' ? t('collaboratorManager.permissions.admin') :
             user.permission === 'write' ? t('collaboratorManager.permissions.write') : t('collaboratorManager.permissions.read')}
          </div>
        )}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );
};

const CollaboratorCard: React.FC<{
  collaborator: Collaborator;
  isOnline: boolean;
  currentUserPermission: 'owner' | 'admin' | 'write' | 'read' | null;
  onUpdatePermission?: (userId: string, permission: 'read' | 'write' | 'admin') => void;
  onRemoveCollaborator?: (userId: string) => void;
}> = ({ 
  collaborator, 
  isOnline, 
  currentUserPermission,
  onUpdatePermission,
  onRemoveCollaborator
}) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const canManage = currentUserPermission === 'owner' || 
    (currentUserPermission === 'admin' && collaborator.permission !== 'owner');

  const handlePermissionChange = async (newPermission: 'read' | 'write' | 'admin') => {
    if (!onUpdatePermission || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onUpdatePermission(collaborator.user_id, newPermission);
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemoveCollaborator || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onRemoveCollaborator(collaborator.user_id);
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg  ">
      <div className="flex items-center gap-3">
        <UserAvatar 
          user={collaborator} 
          isOnline={isOnline} 
          size="lg"
        />
        <div>
          <div className="font-medium text-white">
            {collaborator.full_name || collaborator.email || collaborator.user_id}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-300 capitalize flex items-center gap-1">
              {/* Permissão textual */}
              {collaborator.permission === 'owner' ? t('collaboratorManager.permissions.owner') : 
               collaborator.permission === 'admin' ? t('collaboratorManager.permissions.admin') :
               collaborator.permission === 'write' ? t('collaboratorManager.permissions.write') :
               collaborator.permission === 'read' ? t('collaboratorManager.permissions.read') :
               collaborator.isOwner ? t('collaboratorManager.permissions.owner') : t('collaboratorManager.permissions.collaborator')}
              {/* Permissão ao lado, com ícone */}
              {collaborator.permission && (
                <span className="flex items-center gap-0.5 ml-2">
                  {/* Ícone de permissão */}
                  {collaborator.permission === 'owner' && <Crown size={12} className="text-yellow-500" />}
                  {collaborator.permission === 'admin' && <Crown size={12} className="text-yellow-400" />}
                  {collaborator.permission === 'write' && <Edit size={12} className="text-blue-400" />}
                  {collaborator.permission === 'read' && <Eye size={12} className="text-gray-400" />}
                  <span className="text-gray-300 text-xs capitalize">
                    {collaborator.permission}
                  </span>
                </span>
              )}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {collaborator.email || collaborator.user_id}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MoreHorizontal size={16} />
            )}
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-48">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-400 mb-2">
                  {t('collaboratorManager.permissions.changePermission')}
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handlePermissionChange('read')}
                    className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                  >
                    <Eye size={14} />
                    {t('collaboratorManager.permissions.read')}
                  </button>
                  <button
                    onClick={() => handlePermissionChange('write')}
                    className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                  >
                    <Edit size={14} />
                    {t('collaboratorManager.permissions.write')}
                  </button>
                  {currentUserPermission === 'owner' && (
                    <button
                      onClick={() => handlePermissionChange('admin')}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                    >
                      <Crown size={14} />
                      {t('collaboratorManager.permissions.admin')}
                    </button>
                  )}
                </div>
                <hr className="my-2 border-gray-700" />
                <button
                  onClick={handleRemove}
                  className="w-full text-left p-2 hover:bg-red-900/50 rounded flex items-center gap-2 text-sm text-red-400"
                >
                  <Trash2 size={14} />
                  {t('collaboratorManager.permissions.remove')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InviteCodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  userPermission: 'owner' | 'admin' | 'write' | 'read' | null;
}> = ({ isOpen, onClose, noteId, userPermission }) => {
  const { t } = useTranslation();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadInviteCodes = async () => {
    setLoading(true);
    try {
      const result = await realtimeManager.getInviteCodes(noteId);
      if (result.success) {
        setInviteCodes(result.invites || []);
      } else {
        setNotification({ type: 'error', message: result.error || t('collaboratorManager.inviteCodes.errorLoading') });
      }
    } catch (error) {
      setNotification({ type: 'error', message: t('collaboratorManager.inviteCodes.errorLoading') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInviteCodes();
    }
  }, [isOpen, noteId]);

  const generateInviteCode = async (permission: 'read' | 'write' | 'admin', maxUses?: number, expiresAt?: Date) => {
    setGenerating(true);
    try {
      const result = await realtimeManager.generateInviteCode(noteId, permission, maxUses, expiresAt);
      if (result.success) {
        setNotification({ type: 'success', message: t('collaboratorManager.inviteCodes.codeGenerated') });
        loadInviteCodes();
      } else {
        setNotification({ type: 'error', message: result.error || t('collaboratorManager.inviteCodes.errorGenerating') });
      }
    } catch (error) {
      setNotification({ type: 'error', message: t('collaboratorManager.inviteCodes.errorGenerating') });
    } finally {
      setGenerating(false);
    }
  };

  const deactivateCode = async (inviteId: string) => {
    try {
      const result = await realtimeManager.deactivateInviteCode(inviteId);
      if (result.success) {
        setNotification({ type: 'success', message: t('collaboratorManager.inviteCodes.codeDeactivated') });
        loadInviteCodes();
      } else {
        setNotification({ type: 'error', message: result.error || t('collaboratorManager.inviteCodes.errorDeactivating') });
      }
    } catch (error) {
      setNotification({ type: 'error', message: t('collaboratorManager.inviteCodes.errorDeactivating') });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setNotification({ type: 'success', message: t('collaboratorManager.inviteCodes.codeCopied') });
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        // Fecha o modal se clicar fora do conteúdo
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-900 shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/20 to-blue-900/20">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2  rounded-full">
                <QrCode size={30} className="text-white" />
              </div>
              {t('collaboratorManager.inviteCodes.title')}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {t('collaboratorManager.description')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400"
            title={t('collaboratorManager.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 max-w-4xl h-126 overflow-y-auto hide-scrollbar">
          {/* Notification */}
          {notification && (
            <div className={`p-4 flex items-center gap-3 mb-6 animate-in slide-in-from-top-2 duration-200 ${
              notification.type === 'success' 
                ? 'bg-green-500/40 text-green-200 border border-green-800'
                : 'bg-red-900/20 text-red-200 border border-red-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <AlertCircle size={20} className="text-red-500" />
              )}
              <span className="flex-1 font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-gray-700/50 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Generate new code */}
          {userPermission === 'owner' && (
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 mb-6 border border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Plus size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {t('collaboratorManager.inviteCodes.generateNew')}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t('collaboratorManager.inviteCodes.choosePermissionLevel')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => generateInviteCode('read')}
                  disabled={generating}
                  className="px-4 py-3 bg-yellow-400 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-md"
                >
                  <Eye size={16} />
                  <div className="text-left">
                    <div className="font-medium">{t('collaboratorManager.inviteCodes.viewOnly')}</div>
                    <div className="text-xs opacity-90">{t('collaboratorManager.inviteCodes.readOnly')}</div>
                  </div>
                </button>
                <button
                  onClick={() => generateInviteCode('write')}
                  disabled={generating}
                  className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-md"
                >
                  <Edit size={16} />
                  <div className="text-left">
                    <div className="font-medium">{t('collaboratorManager.permissions.write')}</div>
                    <div className="text-xs opacity-90">{t('collaboratorManager.inviteCodes.canEdit')}</div>
                  </div>
                </button>
                <button
                  onClick={() => generateInviteCode('admin')}
                  disabled={generating}
                  className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-md"
                >
                  <Crown size={16} />
                  <div className="text-left">
                    <div className="font-medium">{t('collaboratorManager.permissions.admin')}</div>
                    <div className="text-xs opacity-90">{t('collaboratorManager.inviteCodes.fullControl')}</div>
                  </div>
                </button>
              </div>
              {generating && (
                <div className="mt-4 flex items-center gap-2 text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">{t('collaboratorManager.inviteCodes.generatingCode')}</span>
                </div>
              )}
            </div>
          )}

          {/* Active codes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <QrCode size={20} className="text-gray-400" />
                {t('collaboratorManager.inviteCodes.activeCodes')}
                <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                  {inviteCodes.length}
                </span>
              </h4>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">{t('collaboratorManager.inviteCodes.loadingCodes')}</p>
              </div>
            ) : inviteCodes.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600">
                <QrCode size={48} className="mx-auto mb-4 text-gray-400" />
                <h5 className="text-lg font-medium text-white mb-2">
                  {t('collaboratorManager.inviteCodes.noActiveCodes')}
                </h5>
                <p className="text-gray-400 max-w-sm mx-auto">
                  {t('collaboratorManager.inviteCodes.generateInviteCodes')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {inviteCodes.map((invite, index) => (
                  <div 
                    key={invite.id} 
                    className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 hover:shadow-lg transition-all duration-200 animate-in slide-in-from-left-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="bg-gray-700 px-3 py-2 rounded-lg font-mono text-lg font-semibold text-white border">
                            {invite.invite_code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(invite.invite_code)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
                            title={t('collaboratorManager.inviteCodes.copyCode')}
                          >
                            <Copy size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            invite.permission === 'admin' ? 'bg-purple-900 text-purple-200' :
                            invite.permission === 'write' ? 'bg-blue-900 text-blue-200' :
                            'bg-yellow-400 text-white'
                          }`}>
                            {invite.permission === 'admin' ? (
                              <><Crown size={12} className="inline mr-1" />{t('collaboratorManager.permissions.admin')}</>
                            ) : invite.permission === 'write' ? (
                              <><Edit size={12} className="inline mr-1" />{t('collaboratorManager.permissions.write')}</>
                            ) : (
                              <><Eye size={12} className="inline mr-1" />{t('collaboratorManager.permissions.read')}</>
                            )}
                          </span>
                        </div>
                      </div>
                      {userPermission === 'owner' && (
                        <button
                          onClick={() => deactivateCode(invite.id)}
                          className="p-2 hover:bg-red-900/20 rounded-lg text-red-400 transition-colors group"
                          title={t('collaboratorManager.inviteCodes.deactivateCode')}
                        >
                          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400 bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        <span>{t('collaboratorManager.inviteCodes.created')}: {formatDate(invite.created_at)}</span>
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <Users size={12} />
                        <span>{t('collaboratorManager.inviteCodes.uses')}: {invite.current_uses}{invite.max_uses ? `/${invite.max_uses}` : ` (${t('collaboratorManager.inviteCodes.unlimited')})`}</span>
                      </div> */}
                      {invite.expires_at && (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={12} />
                          <span>{t('collaboratorManager.inviteCodes.expires')}: {formatDate(invite.expires_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="px-6 py-4 bg-gray-700 border-t border-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{t('collaboratorManager.inviteCodes.codesValidUntilDeactivated')}</span>
            </div>
            <div className="flex gap-2">
             
              <button
                onClick={onClose}
                className="px-4 py-2 text-blue-400 hover:text-blue-500 rounded-lg font-medium transition-colors"
              >
                {t('collaboratorManager.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Webkit */
        }
      `}</style>
    </div>
  );
};

export const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  collaborators,
  noteId,
  userPermission,
  onRefreshCollaborators,
  isPublicNote = false
}) => {
  const { t } = useTranslation();
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);

  // Debug log for received props
  useEffect(() => {
    console.log('[DEBUG] CollaboratorManager props (WORKAROUND):', {
      collaborators: collaborators.length,
      collaboratorList: collaborators.map(c => ({
        id: c.user_id,
        name: c.full_name,
        email: c.email,
        permission: c.permission,
        // isOnline removido
      })),
      noteId,
      userPermission,
      isPublicNote
    });

    // Additional debug specifically for the display issue
    if (collaborators.length === 0) {
      console.warn('[DEBUG] CollaboratorManager: NO COLLABORATORS RECEIVED!');
    } else {
      console.log('[DEBUG] CollaboratorManager: Collaborators will be displayed:', collaborators.length);
    }
  }, [collaborators, noteId, userPermission, isPublicNote]);

  const canManageCollaborators = userPermission === 'owner' || userPermission === 'admin';

  const handleUpdatePermission = async (userId: string, permission: 'read' | 'write' | 'admin') => {
    try {
      const result = await realtimeManager.updateCollaboratorPermission(noteId, userId, permission);
      if (result.success) {
        setNotification({ type: 'success', message: t('collaboratorManager.permissions.permissionUpdated') });
        onRefreshCollaborators?.();
      } else {
        setNotification({ type: 'error', message: result.error || t('collaboratorManager.permissions.updateError') });
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      setNotification({ type: 'error', message: t('collaboratorManager.permissions.updateError') });
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      const result = await realtimeManager.removeCollaborator(noteId, userId);
      if (result.success) {
        setNotification({ type: 'success', message: t('collaboratorManager.permissions.collaboratorRemoved') });
        onRefreshCollaborators?.();
      } else {
        setNotification({ type: 'error', message: result.error || t('collaboratorManager.permissions.removeError') });
      }
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setNotification({ type: 'error', message: t('collaboratorManager.permissions.removeError') });
    }
  };

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fechar modal com tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCollaboratorsModal) {
          setShowCollaboratorsModal(false);
        }
        if (showInviteCodeModal) {
          setShowInviteCodeModal(false);
        }
      }
    };

    if (showCollaboratorsModal || showInviteCodeModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showCollaboratorsModal, showInviteCodeModal]);

  // Sempre exibe apenas os primeiros 5 colaboradores no indicador compacto
  const visibleCollaborators = collaborators.slice(0, 5);
  const extraCount = Math.max(0, collaborators.length - 5);

  return (
    <div className="space-y-4">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {notification.message}
        </div>
      )}

      {/* Indicador compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Avatares dos colaboradores - agora clicável */}
          <button
            onClick={() => setShowCollaboratorsModal(true)}
            className="flex items-center -space-x-2 hover:scale-105 transition-transform cursor-pointer"
            title={t('collaboratorManager.viewAllCollaborators')}
          >
            {visibleCollaborators.map((collaborator) => (
              <UserAvatar
                key={collaborator.user_id}
                user={collaborator}
                isOnline={true}
                showPermission={true}
              />
            ))}
            
            {extraCount > 0 && (
              <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-gray-600 flex items-center justify-center text-xs font-medium text-white hover:bg-gray-600 transition-colors">
                +{extraCount}
              </div>
            )}
          </button>

          {/* Indicador de colaboradores - simplified without "online" concept */}
          {collaborators.length > 0 && (
            <button
              onClick={() => setShowCollaboratorsModal(true)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-full text-blue-400 text-xs transition-colors cursor-pointer"
              title={t('collaboratorManager.manageCollaborators')}
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>
                {collaborators.length === 1 
                  ? `1 ${t('collaboratorManager.collaborator')}` 
                  : `${collaborators.length} ${t('collaboratorManager.collaborators')}`}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* <button
            onClick={() => setShowCollaboratorsModal(true)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title={t('collaboratorManager.manageCollaborators')}
          >
            <Settings size={16} />
          </button> */}

          {canManageCollaborators && (
            <button
              onClick={() => setShowInviteCodeModal(true)}
              className="p-2 hover:bg-blue-900 rounded-full transition-colors text-blue-500"
              title={t('collaboratorManager.inviteCodes.title')}
            >
              <Users size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lista completa de colaboradores - Modal */}
      {showCollaboratorsModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCollaboratorsModal(false);
            }
          }}
        >
          <div className="bg-gray-900  shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t('collaboratorManager.title')}
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  {collaborators.length === 1 
                    ? t('collaboratorManager.personHasAccess', { count: 1 })
                    : t('collaboratorManager.peopleHaveAccess', { count: collaborators.length })}
                </p>
              </div>
              <div className="flex items-center gap-2 ">
                {canManageCollaborators && (
                  <button
                    onClick={() => {
                      setShowInviteCodeModal(true);
                      setShowCollaboratorsModal(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-colors"
                  >
                    <Link size={14} />
                    {t('collaboratorManager.manageInvites')}
                  </button>
                )}
                <button
                  onClick={() => setShowCollaboratorsModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                  title={t('collaboratorManager.close')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 max-w-4xl h-126 overflow-y-auto hide-scrollbar">
              {collaborators.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Settings size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-white font-medium mb-2">
                    {t('collaboratorManager.noCollaboratorsFound')}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {t('collaboratorManager.invitePeopleToCollaborate')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collaborators.map((collaborator, index) => (
                    <div 
                      key={collaborator.user_id}
                      className="animate-in slide-in-from-left-4 duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CollaboratorCard
                        collaborator={collaborator}
                        isOnline={true}
                        currentUserPermission={userPermission}
                        onUpdatePermission={canManageCollaborators ? handleUpdatePermission : undefined}
                        onRemoveCollaborator={canManageCollaborators ? handleRemoveCollaborator : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{t('collaboratorManager.allCollaboratorsHaveAccess')}</span>
                </div>
                <button
                  onClick={() => setShowCollaboratorsModal(false)}
                  className="text-blue-400 hover:text-blue-500 font-medium transition-colors"
                >
                  {t('collaboratorManager.close')}
                </button>
              </div>
            </div>
          </div>
          <style jsx global>{`
            .hide-scrollbar {
              scrollbar-width: none; /* Firefox */
              -ms-overflow-style: none; /* IE 10+ */
            }
            .hide-scrollbar::-webkit-scrollbar {
              display: none; /* Chrome/Safari/Webkit */
            }
          `}</style>
        </div>
      )}

      {/* Modal de código de convite */}
      <InviteCodeModal
        isOpen={showInviteCodeModal}
        onClose={() => setShowInviteCodeModal(false)}
        noteId={noteId}
        userPermission={userPermission}
      />
    </div>
  );
};

export default CollaboratorManager;
