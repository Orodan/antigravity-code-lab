import React, { useState } from "react";
import { FileText, ArrowRight, Sparkles, MessageSquare, Zap, Hash, Users } from "lucide-react";

interface LobbyProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  isLoading: boolean;
}

export default function Lobby({ onCreateRoom, onJoinRoom, isLoading }: LobbyProps) {
  const [roomInput, setRoomInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      onJoinRoom(roomInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900" id="lobby-container">
      {/* Top minimal bar */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="font-bold tracking-tight text-base text-gray-900">QuickSync.</span>
        </div>
        <div className="text-xs text-gray-405 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
          <span>Plateforme Ouverte</span>
        </div>
      </header>

      {/* Main minimal hero */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center">
        {/* Modern clean badge */}
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="h-3 w-3 text-gray-800" />
          <span>Aucune inscription requise • 100% anonyme</span>
        </div>

        {/* Crisp Header Title */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-none mb-6">
          Édition de notes <br />
          <span className="underline decoration-2 underline-offset-8 decoration-gray-900">
            collaborative instantanée.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-500 max-w-xl mb-12 font-medium leading-relaxed">
          Créez un espace de travail en un clic, partagez l'URL et rédigez vos idées, 
          gérez vos comptes-rendus ou structurez vos réunions d'équipe en temps réel.
        </p>

        {/* Inputs Core box with minimal styles */}
        <div className="w-full max-w-md bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col gap-5 mb-16">
          {/* Create Button */}
          <button
            onClick={onCreateRoom}
            disabled={isLoading}
            id="btn-create-room"
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Créer un espace de travail</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-3 text-gray-300">
            <div className="h-px flex-1 bg-gray-100"></div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Ou rejoindre une room</span>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>

          {/* Join Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full" id="join-room-form">
            <div className="flex-1 relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Identifiant de l'espace (ex: room-abc-123)"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 font-medium focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !roomInput.trim()}
              id="btn-join-room"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded text-sm cursor-pointer transition-colors shrink-0"
            >
              🚀 Rejoindre
            </button>
          </form>
        </div>

        {/* Feature Highlights Minimal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left border-t border-gray-100 pt-12">
          <div className="flex gap-3">
            <div className="p-2.5 bg-gray-50 text-gray-700 rounded h-fit">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Zéro config</h3>
              <p className="text-xs text-gray-500 leading-normal">
                Pas de mot de passe à retenir. Créez, partagez, collaborez instantanément.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="p-2.5 bg-gray-50 text-gray-700 rounded h-fit">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Curseurs Live</h3>
              <p className="text-xs text-gray-500 leading-normal">
                Voyez qui tape en temps réel grâce à de charmantes étiquettes d'anonymes.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="p-2.5 bg-gray-50 text-gray-700 rounded h-fit">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Flux d'activité</h3>
              <p className="text-xs text-gray-500 leading-normal">
                Un chat de groupe et un flux loggé pour garder un historique complet des actions.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer conforming with minimalist lines */}
      <footer className="py-6 bg-white border-t border-gray-100 text-center text-xs text-gray-400 font-semibold tracking-wide">
        QUICKSYNC. © 2026 • ESPACE SÉCURISÉ & ÉDITION EN TEMPS RÉEL
      </footer>
    </div>
  );
}
