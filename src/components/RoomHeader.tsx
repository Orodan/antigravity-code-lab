import React, { useState } from "react";
import { Clipboard, Check, User, Share2, LogOut, Search } from "lucide-react";
import { Participant } from "../types";

interface RoomHeaderProps {
  roomId: string;
  participants: Participant[];
  currentParticipant: Participant;
  onChangeName: (newName: string) => void;
  onExit: () => void;
}

export default function RoomHeader({
  roomId,
  participants,
  currentParticipant,
  onChangeName,
  onExit
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentParticipant.name);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onChangeName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0 sticky top-0 z-10 font-sans">
      {/* Logo & Shared Room ID */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="font-bold tracking-tight text-base text-gray-900">QuickSync.</span>
        </div>
        <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
        
        {/* Room Code Display + Share Trigger */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500 font-mono">
          <span>Salon :</span>
          <span className="font-semibold bg-gray-50 px-2 py-0.5 rounded text-gray-700 select-all border border-gray-150">
            {roomId}
          </span>
          <button
            onClick={handleCopyLink}
            id="btn-copy-share-header"
            className="text-gray-400 hover:text-black py-1 px-1.5 hover:bg-gray-50 rounded transition-colors cursor-pointer"
            title="Copier le lien d'accès direct"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Clipboard className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Connection Pool Indicators / Participant bubble cards */}
      <div className="flex items-center space-x-6">
        {/* Active participants pile */}
        <div className="hidden md:flex items-center space-x-2.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Collaborateurs :</span>
          <div className="flex items-center -space-x-1.5">
            {participants.map((p) => {
              const isSelf = p.id === currentParticipant.id;
              const isTyping = p.typingNoteId !== null;

              return (
                <div
                  key={p.id}
                  className="relative group cursor-default"
                >
                  <div
                    className="h-7 w-7 rounded-sm border border-white flex items-center justify-center text-[9px] font-bold text-white shadow-2xs select-none relative"
                    style={{ backgroundColor: p.color }}
                  >
                    {getInitials(p.name)}
                    {isTyping && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-black ring-1 ring-white">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1 w-1 bg-white"></span>
                      </span>
                    )}
                  </div>

                  {/* Enhanced Tooltip */}
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <span className="font-bold">{p.name} {isSelf && " (Vous)"}</span>
                    {isTyping && <span className="block text-[8px] text-gray-400">En train de taper...</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[11px] text-gray-450 font-semibold">
            ({participants.length})
          </span>
        </div>

        {/* User Identity Action and Actions Deck */}
        <div className="flex items-center space-x-3">
          {/* User Customizer form */}
          {isEditingName ? (
            <form onSubmit={handleNameSubmit} className="flex items-center space-x-1" id="name-edit-form">
              <input
                type="text"
                autoFocus
                maxLength={20}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  setTempName(currentParticipant.name);
                  setIsEditingName(false);
                }}
                className="bg-white border border-black text-gray-900 font-bold px-2 py-0.5 text-xs rounded focus:outline-none"
              />
              <button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white p-1 rounded text-xs cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempName(currentParticipant.name);
                setIsEditingName(true);
              }}
              title="Cliquer pour changer votre pseudonyme"
              id="btn-edit-user-name"
              className="flex items-center space-x-2 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-700 text-xs font-bold transition-all cursor-pointer"
            >
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: currentParticipant.color }}
              />
              <span>{currentParticipant.name}</span>
              <User className="h-3 w-3 text-gray-400" />
            </button>
          )}

          <div className="h-4 w-px bg-gray-200"></div>

          {/* Share flow CTA */}
          <button
            onClick={handleCopyLink}
            id="btn-copy-full-link"
            className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white py-1.5 px-3 rounded text-xs font-bold transition-colors cursor-pointer"
          >
            <Share2 className="h-3 w-3" />
            <span>Partager le lien</span>
          </button>

          {/* Exit salon */}
          <button
            onClick={onExit}
            id="btn-leave-room"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title="Quitter l'espace"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
