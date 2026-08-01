'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../lib/api';

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  category: string;
  fileName: string;
}

export interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  messages: ChatMessage[];
}

interface RemoteQuestionItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  fileName?: string;
  chatId?: string;
  chatTitle?: string;
  createdAt: string;
}

interface ChatContextType {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  activeTab: 'query' | 'faq';
  setActiveTab: (tab: 'query' | 'faq') => void;
  createNewChat: (switchToQuery?: boolean) => void;
  switchChatSession: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  deleteChatSession: (chatId: string) => void;
  addMessageToSession: (chatId: string, message: ChatMessage) => void;
  getActiveSession: () => ChatSession | undefined;
  fetchRemoteHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUserId, idToken } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'query' | 'faq'>('query');

  const getStorageKey = (base: string): string => {
    return `studypal_${base}_${currentUserId || 'anonymous'}`;
  };

  const loadSessionsForCurrentUser = () => {
    const stored = localStorage.getItem(getStorageKey('chat_sessions'));
    const sessions: ChatSession[] = stored ? JSON.parse(stored) : [];
    setChatSessions(sessions);
    setActiveChatId(localStorage.getItem(getStorageKey('active_chat_id')));
  };

  useEffect(() => {
    loadSessionsForCurrentUser();
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(
      getStorageKey('chat_sessions'),
      JSON.stringify(chatSessions),
    );
    if (activeChatId) {
      localStorage.setItem(getStorageKey('active_chat_id'), activeChatId);
    }
  }, [chatSessions, activeChatId]);

  useEffect(() => {
    if (chatSessions.length > 0 && !activeChatId) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [chatSessions]);

  const createNewChat = (switchToQuery = true) => {
    const newId = 'chat_' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      pinned: false,
      createdAt: new Date().toISOString(),
      messages: [],
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newId);
    if (switchToQuery) setActiveTab('query');
  };

  const switchChatSession = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveTab('query');
  };

  const togglePinChat = (chatId: string) => {
    setChatSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, pinned: !s.pinned } : s)),
    );
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChatSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, title: newTitle } : s)),
    );
  };

  const deleteChatSession = (chatId: string) => {
    const session = chatSessions.find((s) => s.id === chatId);
    if (session && session.messages.length && idToken) {
      session.messages.forEach((msg) => {
        fetch(`${API_URL}/question/${msg.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        }).catch((err) =>
          console.error('Remote delete failed for', msg.id, err),
        );
      });
    }

    setChatSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== chatId);
      if (activeChatId === chatId) {
        setActiveChatId(remaining.length ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const addMessageToSession = (chatId: string, message: ChatMessage) => {
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === chatId) {
          const updated = { ...s, messages: [...s.messages, message] };
          if (updated.messages.length === 1 && message.question) {
            updated.title =
              message.question.slice(0, 28) +
              (message.question.length > 28 ? '...' : '');
          }
          return updated;
        }
        return s;
      }),
    );
  };

  const getActiveSession = () => {
    return chatSessions.find((s) => s.id === activeChatId);
  };

  const fetchRemoteHistory = async () => {
    if (!idToken) return;
    try {
      const res = await fetch(`${API_URL}/question`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await res.json();
      const items: RemoteQuestionItem[] = result.data || [];

      if (!items.length) {
        createNewChat(true);
        return;
      }

      const grouped: Record<string, ChatSession> = {};
      items.forEach((item) => {
        const cid = item.chatId || 'legacy_history';
        if (!grouped[cid]) {
          grouped[cid] = {
            id: cid,
            title:
              item.chatTitle ||
              (cid === 'legacy_history'
                ? 'Previous Conversations'
                : 'Conversation'),
            pinned: false,
            createdAt: item.createdAt,
            messages: [],
          };
        }
        grouped[cid].messages.push({
          id: item.id,
          question: item.question,
          answer: item.answer,
          category: item.category,
          fileName: item.fileName || '',
        });
        if (item.createdAt > grouped[cid].createdAt) {
          grouped[cid].createdAt = item.createdAt;
        }
      });

      const remoteSessions = Object.values(grouped).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setChatSessions((prev) => {
        // Preserve pinned state from whatever's currently in local state
        remoteSessions.forEach((remote) => {
          const local = prev.find((s) => s.id === remote.id);
          if (local) remote.pinned = local.pinned;
        });
        return remoteSessions;
      });
      setActiveChatId(remoteSessions[0]?.id || null);
    } catch (err) {
      console.error('Failed to fetch remote chat history:', err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chatSessions,
        activeChatId,
        activeTab,
        setActiveTab,
        createNewChat,
        switchChatSession,
        togglePinChat,
        renameChat,
        deleteChatSession,
        addMessageToSession,
        getActiveSession,
        fetchRemoteHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
