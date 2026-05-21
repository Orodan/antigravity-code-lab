import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, ScrollText, Send, X } from "lucide-react";
import { ChatMessage, ActivityLog, Participant } from "../types";

interface CollaborativeChatProps {
  chat: ChatMessage[];
  activityLog: ActivityLog[];
  currentParticipant: Participant;
  onSendMessage: (text: string) => void;
}

export default function CollaborativeChat({
  chat,
  activityLog,
  currentParticipant,
  onSendMessage
}: CollaborativeChatProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "activity">("chat");
  const [chatInput, setChatInput] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (activeTab === "activity" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, activityLog, activeTab, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const formatLogTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatChatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 bg-black hover:bg-gray-800 text-white p-3.5 rounded shadow-lg cursor-pointer flex items-center gap-2 font-semibold text-xs uppercase tracking-wider transition-all"
        id="btn-open-sidebar"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Chat & Historique</span>
        {chat.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white text-[9px] text-black font-extrabold border border-gray-100">
            {chat.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside
      id="presence-and-chat-sidebar"
      className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col h-[350px] lg:h-auto shrink-0 relative font-sans"
    >
      {/* Sidebar Header with Minimalist Tab Selector */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex bg-gray-200/50 p-1 rounded gap-1">
          <button
            onClick={() => setActiveTab("chat")}
            id="tab-chat"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "chat" ? "bg-white text-gray-950 shadow-2xs border border-gray-150/40" : "text-gray-550 hover:text-black"
            }`}
          >
            <span>Messages ({chat.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            id="tab-activity"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "activity" ? "bg-white text-gray-950 shadow-2xs border border-gray-150/40" : "text-gray-550 hover:text-black"
            }`}
          >
            <span>Activité</span>
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setIsOpen(false)}
          id="btn-close-sidebar"
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
          title="Masquer le panneau"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sidebar Channels lists and container */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {activeTab === "chat" ? (
          <div className="flex flex-col gap-4 min-h-full justify-end">
            {chat.length === 0 ? (
              <div className="my-auto py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="h-10 w-10 bg-gray-50 text-gray-300 rounded flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Discussion vide</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  Rédigez une consigne, donnez un avis ou collaborez librement avec vos coéquipiers !
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chat.map((msg) => {
                  const isSelf = msg.senderId === currentParticipant.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isSelf ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <span className="text-[9px] text-gray-405 font-bold mb-0.5 whitespace-nowrap">
                        <span style={{ color: msg.senderColor }}>●</span> {msg.senderName} {isSelf && "(Vous)"}
                      </span>
                      <div
                        className={`rounded px-3 py-2 text-xs font-medium leading-relaxed leading-snug border ${
                          isSelf
                            ? "bg-gray-950 border-gray-950 text-white rounded-tr-none"
                            : "bg-gray-50 border-gray-150 text-gray-800 rounded-tl-none"
                        }`}
                        id={`chat-bubble-${msg.id}`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-gray-400 font-semibold mt-1 uppercase">
                        {formatChatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 min-h-full">
            {activityLog.length === 0 ? (
              <div className="my-auto py-12 flex flex-col items-center justify-center text-center">
                <ScrollText className="h-6 w-6 text-gray-300 mb-2" />
                <h4 className="font-bold text-gray-600 text-xs uppercase">Aucune action loggée</h4>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                {[...activityLog].reverse().map((log) => (
                  <div
                    key={log.id}
                    id={`log-item-${log.id}`}
                    className="p-2 border-b border-gray-50 flex items-start gap-2 text-gray-500 leading-normal"
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-sm shrink-0 mt-1"
                      style={{ backgroundColor: log.userColor }}
                    />
                    <div className="flex-1">
                      <strong className="text-gray-900 font-bold">{log.userName}</strong>{" "}
                      {log.action}
                      <span className="block text-[8px] text-gray-400 mt-0.5">
                        {formatLogTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message submit form block */}
      {activeTab === "chat" && (
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2"
          id="chat-send-form"
        >
          <input
            type="text"
            placeholder="Écrire un message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={180}
            required
            className="flex-1 bg-white border border-gray-200 focus:border-black rounded px-3 py-2 text-xs font-medium focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            id="btn-send-chat"
            className="p-2 bg-black hover:bg-gray-800 disabled:opacity-40 text-white rounded transition-colors cursor-pointer shrink-0"
            title="Envoyer"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      )}
    </aside>
  );
}
