import React from "react";
import { Edit2, Trash2, Lock, Calendar, Tag, User } from "lucide-react";
import { Note } from "../types";

interface NoteCardProps {
  key?: any;
  note: Note;
  currentUserId: string;
  onEditClick: (note: Note) => void | Promise<any>;
  onDeleteClick: (noteId: string) => void | Promise<any>;
  onColorChange: (noteId: string, color: string) => void | Promise<any>;
  isListView: boolean;
}

// Map logical colors to elegant, high-end design accents (delicate border accents & tags)
export const COLOR_MAP: Record<string, { bg: string; border: string; text: string; tag: string; label: string; hex: string }> = {
  yellow: {
    bg: "bg-white",
    border: "border-amber-200",
    text: "text-amber-800",
    tag: "bg-amber-50 text-amber-850 border border-amber-100",
    label: "Jaune",
    hex: "#F59E0B"
  },
  blue: {
    bg: "bg-white",
    border: "border-sky-200",
    text: "text-sky-800",
    tag: "bg-sky-50 text-sky-855 border border-sky-100",
    label: "Bleu",
    hex: "#38BDF8"
  },
  green: {
    bg: "bg-white",
    border: "border-emerald-200",
    text: "text-emerald-800",
    tag: "bg-emerald-50 text-emerald-855 border border-emerald-100",
    label: "Vert",
    hex: "#34D399"
  },
  pink: {
    bg: "bg-white",
    border: "border-pink-200",
    text: "text-pink-800",
    tag: "bg-pink-50 text-pink-855 border border-pink-100",
    label: "Rose",
    hex: "#F472B6"
  },
  purple: {
    bg: "bg-white",
    border: "border-purple-200",
    text: "text-purple-800",
    tag: "bg-purple-50 text-purple-855 border border-purple-100",
    label: "Violet",
    hex: "#A78BFA"
  },
  gray: {
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-800",
    tag: "bg-gray-50 text-gray-855 border border-gray-100",
    label: "Gris",
    hex: "#9CA3AF"
  }
};

export default function NoteCard({
  note,
  currentUserId,
  onEditClick,
  onDeleteClick,
  onColorChange,
  isListView
}: NoteCardProps) {
  const colorStyle = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const isLockedByOther = note.isLocked && note.lockedBy !== currentUserId;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // --- LIST COMPACT VIEW ---
  if (isListView) {
    return (
      <div
        id={`note-list-${note.id}`}
        className={`note-card-animate group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded border border-gray-100 bg-white hover:border-gray-300 transition-all ${
          isLockedByOther ? "opacity-75" : ""
        }`}
        style={{ borderLeft: `3px solid ${colorStyle.hex}` }}
      >
        <div className="flex-1 w-full min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-sm truncate">{note.title || "Note sans titre"}</h3>
            {note.category && (
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${colorStyle.tag}`}>
                {note.category}
              </span>
            )}
            {note.assigneeName && (
              <span 
                className="inline-flex items-center gap-1 text-[9px] font-semibold text-white px-2 py-0.5 rounded transition-all shadow-4xs font-sans border-0"
                style={{ backgroundColor: note.assigneeColor || "#10B981" }}
              >
                <User className="h-2.5 w-2.5" />
                <span>{note.assigneeName}</span>
              </span>
            )}
            {note.tags && note.tags.map(tg => (
              <span key={tg} className="inline-block text-[9px] font-bold text-gray-550 bg-gray-50 px-1.5 py-0.5 border border-gray-200/60 rounded transition-all">
                #{tg}
              </span>
            ))}
            {note.isLocked && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                <Lock className="h-2.5 w-2.5" />
                <span>{isLockedByOther ? note.lockedByName : "Vous éditiez"}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-sans truncate pr-4 max-w-xl">
            {note.content || <span className="italic text-gray-300">Aucun contenu</span>}
          </p>
        </div>

        {/* List Action Buttons */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0 self-end sm:self-center">
          <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
            Par {note.lastEditedBy} à {formatTime(note.updatedAt)}
          </span>

          <div className="flex items-center gap-1">
            {!isLockedByOther && (
              <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 mr-1">
                {Object.keys(COLOR_MAP).map((colorKey) => (
                  <button
                    key={colorKey}
                    onClick={() => onColorChange(note.id, colorKey)}
                    className={`h-2.5 w-2.5 rounded-sm cursor-pointer hover:scale-125 transition-transform ${
                      note.color === colorKey ? "ring-1 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: COLOR_MAP[colorKey].hex }}
                    title={COLOR_MAP[colorKey].label}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => !isLockedByOther && onEditClick(note)}
              disabled={isLockedByOther}
              className={`p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer ${
                isLockedByOther ? "opacity-30 cursor-not-allowed" : "hover:text-black"
              }`}
              title={isLockedByOther ? "Verrouillé par un autre" : "Éditer"}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => !isLockedByOther && onDeleteClick(note.id)}
              disabled={isLockedByOther}
              className={`p-1 rounded hover:bg-red-50 text-gray-400 transition-colors cursor-pointer ${
                isLockedByOther ? "opacity-30 cursor-not-allowed" : "hover:text-red-600"
              }`}
              title="Supprimer la note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GRID POST-IT MODE (Clean Minimalist card layout) ---
  return (
    <div
      id={`note-grid-${note.id}`}
      onDoubleClick={() => !isLockedByOther && onEditClick(note)}
      className={`note-card-animate group relative flex flex-col h-[220px] p-5 rounded border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-150 ${
        isLockedByOther ? "opacity-90" : ""
      }`}
      style={{ borderLeft: `4px solid ${colorStyle.hex}` }}
    >
      {/* Background lock visual screen overlay */}
      {isLockedByOther && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-xs z-1 rounded text-center p-4">
          <div className="bg-white px-3 py-1.5 rounded border border-red-100 flex items-center gap-1.5 text-[10px] font-bold text-red-700 shadow-xs">
            <Lock className="h-3 w-3" />
            <span>Édition par {note.lockedByName}</span>
          </div>
        </div>
      )}

      {/* Note Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
            {note.title || <span className="text-gray-300 italic font-medium">Sans titre</span>}
          </h3>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {note.category && (
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.25 rounded uppercase tracking-wider ${colorStyle.tag}`}>
                {note.category}
              </span>
            )}
            {note.assigneeName && (
              <span 
                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.25 rounded text-white tracking-wide shadow-4xs font-sans border-0"
                style={{ backgroundColor: note.assigneeColor || "#10B981" }}
              >
                <User className="h-2.5 w-2.5" />
                <span>{note.assigneeName}</span>
              </span>
            )}
            {note.tags && note.tags.map(tg => (
              <span key={tg} className="inline-block text-[9px] font-bold text-gray-550 bg-gray-50 px-1.5 py-0.25 border border-gray-200/60 rounded transition-all">
                #{tg}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[8px] text-gray-300 uppercase font-extrabold select-none opacity-0 group-hover:opacity-100 transition-opacity">
          ⚙️ Double-cliquer
        </span>
      </div>

      {/* Note Content Segment */}
      <div className="flex-1 overflow-y-auto mb-4 font-sans text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pr-1 scrollbar-thin">
        {note.content || <span className="text-gray-300 italic font-light">Aucun contenu... Double-cliquez pour rédiger.</span>}
      </div>

      {/* Note Footer Area */}
      <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between mt-auto text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
        <span className="truncate max-w-[120px]" title={`Créé par ${note.lastEditedBy}`}>
          Par {note.lastEditedBy}
        </span>
        <span className="shrink-0">
          À {formatTime(note.updatedAt)}
        </span>
      </div>

      {/* Overlay hover quick options menu */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white border border-gray-100 py-1 px-1.5 rounded shadow-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-100 z-2">
        {!isLockedByOther && (
          <div className="flex items-center gap-1.5 border-r border-gray-100 pr-1.5 mr-0.5">
            {Object.keys(COLOR_MAP).map((colorKey) => (
              <button
                key={colorKey}
                onClick={() => onColorChange(note.id, colorKey)}
                className={`h-2.5 w-2.5 rounded-sm cursor-pointer hover:scale-125 transition-transform ${
                  note.color === colorKey ? "ring-1 ring-gray-400 scale-110" : ""
                }`}
                style={{ backgroundColor: COLOR_MAP[colorKey].hex }}
                title={COLOR_MAP[colorKey].label}
              />
            ))}
          </div>
        )}

        {/* Edit Button */}
        <button
          onClick={() => !isLockedByOther && onEditClick(note)}
          disabled={isLockedByOther}
          id={`btn-edit-note-${note.id}`}
          className={`p-1 rounded hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer ${
            isLockedByOther ? "opacity-30 cursor-not-allowed" : "hover:text-black"
          }`}
          title="Éditer la note"
        >
          <Edit2 className="h-3 w-3" />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => !isLockedByOther && onDeleteClick(note.id)}
          disabled={isLockedByOther}
          id={`btn-delete-note-${note.id}`}
          className={`p-1 rounded hover:bg-red-50 text-gray-450 transition-colors cursor-pointer ${
            isLockedByOther ? "opacity-30 cursor-not-allowed" : "hover:text-red-600"
          }`}
          title="Supprimer la note"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
