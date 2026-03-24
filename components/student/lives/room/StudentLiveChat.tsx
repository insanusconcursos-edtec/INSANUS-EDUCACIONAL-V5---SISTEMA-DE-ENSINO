import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, MessageCircle, Smile } from 'lucide-react';
import { liveChatService } from '../../../../services/liveChatService';
import { LiveChatMessage } from '../../../../types/liveEvent';
import { useAuth } from '../../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

interface StudentLiveChatProps {
  eventId: string;
  status: 'scheduled' | 'live' | 'ended';
  isChatBlocked?: boolean;
}

export const StudentLiveChat: React.FC<StudentLiveChatProps> = ({ eventId, status, isChatBlocked }) => {
  const { currentUser, userData } = useAuth();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const formatShortName = (fullName?: string | null) => {
    if (!fullName) return 'Aluno';
    const nameParts = fullName.trim().split(' ');
    return nameParts.slice(0, 2).join(' '); // Pega apenas o 1º e 2º nome
  };

  const resolvedName = formatShortName(userData?.name || currentUser?.displayName);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = liveChatService.subscribeToMessages(eventId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [eventId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !currentUser || isSending || status !== 'live' || isChatBlocked) return;

    setIsSending(true);
    try {
      await liveChatService.sendMessage(eventId, {
        userId: currentUser.uid,
        userName: resolvedName,
        senderName: resolvedName,
        userEmail: currentUser.email || userData?.email || '',
        userPhoto: userData?.photoUrl || currentUser.photoURL || null,
        senderPhoto: userData?.photoUrl || currentUser.photoURL || null,
        text: newMessage.trim(),
        isAdmin: false
      });
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage === 'Usuário bloqueado') {
        toast.error("Seu chat foi bloqueado pelo administrador.");
      } else {
        toast.error("Erro ao enviar mensagem.");
      }
    } finally {
      setIsSending(false);
      // Recupera o foco após re-ativar o input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.style.height = 'auto';
        }
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Magia do auto-resize: reseta para auto e depois pega a altura real
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sem Shift envia a mensagem
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita quebra de linha extra
      if (newMessage.trim() !== '' && !isSending && status === 'live' && !isChatBlocked) {
        handleSendMessage(); 
      }
    }
    // Shift + Enter o comportamento nativo (quebrar linha) atua normalmente
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    // Não fecha o picker para permitir múltiplos emojis, mas foca no input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await liveChatService.deleteMessage(eventId, messageId);
      toast.success("Mensagem apagada.");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erro ao apagar mensagem.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-zinc-400" />
          <h2 className="font-bold text-white text-sm uppercase tracking-wider">Chat ao Vivo</h2>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center">
            <MessageCircle size={32} className="mb-3 opacity-20" />
            <p className="text-sm">Nenhuma mensagem enviada.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = currentUser?.uid === msg.userId;
            const isAdmin = msg.isAdmin;

            return (
              <div key={msg.id} className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 w-full ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className={`text-[10px] font-bold ${isAdmin ? 'text-red-500' : isMine ? 'text-brand-red' : 'text-zinc-400'}`}>
                    {isAdmin ? 'MODERADOR' : isMine ? 'VOCÊ' : (msg.senderName || msg.userName || 'Aluno')}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  
                  {!msg.isDeleted && isMine && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-500 transition-all"
                      title="Apagar mensagem"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                
                <div className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                  msg.isDeleted 
                    ? 'bg-zinc-800/30 text-zinc-600 italic border border-zinc-800/50' 
                    : isMine
                      ? 'bg-brand-red/10 border border-brand-red/20 text-white'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                }`}>
                  <p className="text-sm break-words">
                    {msg.isDeleted ? 'Mensagem apagada' : msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 shrink-0 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50 shadow-2xl">
            <EmojiPicker 
              theme={Theme.DARK}
              onEmojiClick={onEmojiClick}
              width={320}
              height={400}
            />
          </div>
        )}
        <div className="relative flex items-end gap-2 p-2 bg-black border border-zinc-800 rounded-lg">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 transition-colors flex items-center justify-center shrink-0 ${
              showEmojiPicker ? 'text-brand-red' : 'text-zinc-400 hover:text-white'
            }`}
            disabled={status !== 'live' || isChatBlocked}
            title="Inserir Emoji"
          >
            <Smile size={24} />
          </button>
          
          <textarea
            ref={inputRef}
            rows={1}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isChatBlocked 
                ? "Seu chat foi bloqueado pelo administrador." 
                : status === 'scheduled' 
                  ? "O chat será liberado quando o evento iniciar" 
                  : "Digite sua mensagem..."
            }
            disabled={status !== 'live' || isSending || isChatBlocked}
            className="flex-1 bg-transparent border-none focus:ring-0 px-1 py-2 text-sm text-white placeholder:text-zinc-600 resize-none overflow-y-auto max-h-24 focus:outline-none"
          />

          <button 
            type="submit"
            onClick={(e) => handleSendMessage(e)}
            disabled={!newMessage.trim() || isSending || status !== 'live' || isChatBlocked} 
            className="p-2 bg-brand-red hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
            title="Enviar mensagem"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
