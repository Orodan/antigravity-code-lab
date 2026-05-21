import React, { useState, useEffect } from "react";
import { X, Save, Info, User } from "lucide-react";
import { Note, WorkspaceUser } from "../types";
import { COLOR_MAP } from "./NoteCard";

interface NoteModalProps {
  note: Note | null;
  categories: string[];
  allWorkspaceTags?: string[];
  workspaceUsers?: WorkspaceUser[];
  onSave: (
    title: string,
    content: string,
    color: string,
    category: string,
    tags: string[],
    assigneeId: string | null,
    assigneeName: string | null,
    assigneeColor: string | null
  ) => void;
  onClose: () => void;
  onTyping: () => void;
}

export default function NoteModal({
  note,
  categories,
  allWorkspaceTags = [],
  workspaceUsers = [],
  onSave,
  onClose,
  onTyping
}: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("yellow");
  const [category, setCategory] = useState("Général");
  const [newCategory, setNewCategory] = useState("");
  const [showAddNewCategory, setShowAddNewCategory] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setCategory(note.category || "Général");
      setTags(note.tags || []);
      setAssigneeId(note.assigneeId || null);
    } else {
      setTitle("");
      setContent("");
      setColor("yellow");
      setCategory("Général");
      setTags([]);
      setAssigneeId(null);
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = showAddNewCategory && newCategory.trim() ? newCategory.trim() : category;
    
    // Find detail details
    const selectedUser = workspaceUsers.find(u => u.id === assigneeId);
    const finalAssigneeId = assigneeId || null;
    const finalAssigneeName = selectedUser ? selectedUser.name : null;
    const finalAssigneeColor = selectedUser ? selectedUser.color : null;

    onSave(
      title.trim(),
      content.trim(),
      color,
      finalCategory,
      tags,
      finalAssigneeId,
      finalAssigneeName,
      finalAssigneeColor
    );
  };

  const handleInputChange = (field: "title" | "content", val: string) => {
    if (field === "title") setTitle(val);
    if (field === "content") setContent(val);
    onTyping();
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
      onTyping();
    }
  };

  const handleRemoveTag = (tg: string) => {
    setTags(tags.filter(t => t !== tg));
    onTyping();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-[1px] transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="bg-white rounded border border-gray-100 shadow-lg max-w-lg w-full z-10 overflow-hidden transform transition-all flex flex-col note-card-animate font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm tracking-tight uppercase">
            {note ? "Modifier la note" : "Nouvelle note"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lock Info */}
        {note && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center gap-2 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
            <Info className="h-3.5 w-3.5 shrink-0 text-blue-600" />
            <span>Verrou actif : Les autres voient cette note verrouillée pendant que vous tapez.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5" id="note-editor-form">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Titre</label>
            <input
              type="text"
              placeholder="Renseignez un titre de note..."
              value={title}
              maxLength={60}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded px-3 py-2 text-sm text-gray-950 font-semibold focus:outline-none transition-all"
            />
          </div>

          {/* Category SELECTOR */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              <label>Catégorie</label>
              <button
                type="button"
                onClick={() => setShowAddNewCategory(!showAddNewCategory)}
                className="text-[10px] text-black hover:underline cursor-pointer font-bold uppercase transition-all"
              >
                {showAddNewCategory ? "Liste des tags" : "Créer un tag"}
              </button>
            </div>

            {showAddNewCategory ? (
              <input
                type="text"
                placeholder="Nouveau tag (ex: Finance, Réunion, Idée)..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                maxLength={20}
                className="w-full bg-gray-50 border border-black focus:bg-white rounded px-3 py-2 text-sm text-gray-900 font-semibold focus:outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Assignee Selection Field */}
          <div className="flex flex-col gap-1.5" id="assignee-selector-container">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>Assigner à (Utilisateur responsable)</span>
            </label>
            <select
              value={assigneeId || ""}
              onChange={(e) => {
                const val = e.target.value;
                setAssigneeId(val === "" ? null : val);
                onTyping();
              }}
              className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded px-3 py-2 text-sm text-gray-950 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">-- Non assignée (Toute l'équipe) --</option>
              {workspaceUsers && workspaceUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags / Étiquettes Section */}
          <div className="flex flex-col gap-1.5 border-t border-b border-gray-50 py-3 my-0.5">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              <span>Étiquettes (Tags d'organisation)</span>
              <span className="text-[8px] font-normal lowercase text-gray-400">Cliquez sur un tag pour le supprimer</span>
            </div>
            
            {/* Active Tags Pills */}
            <div className="flex flex-wrap gap-1.5 min-h-[24px] items-center">
              {tags.map((tg) => (
                <button
                  key={tg}
                  type="button"
                  onClick={() => handleRemoveTag(tg)}
                  className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <span>{tg}</span>
                  <X className="h-2.5 w-2.5 text-gray-400 hover:text-red-500" />
                </button>
              ))}
              {tags.length === 0 && (
                <span className="text-[11px] text-gray-400 italic">Aucune étiquette. Saisissez-en une ci-dessous !</span>
              )}
            </div>

            {/* Tags Input */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Renseignez un mot-clé (ex: Urgent, Idée)..."
                value={newTag}
                maxLength={15}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  onTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded px-3 py-1.5 text-xs text-gray-950 font-semibold focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 bg-black hover:bg-gray-800 text-white text-[10px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
              >
                Ajouter
              </button>
            </div>

            {/* Quick Suggested Tags */}
            {allWorkspaceTags && allWorkspaceTags.length > 0 && allWorkspaceTags.filter(tg => !tags.includes(tg)).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 items-center">
                <span className="text-[8px] uppercase font-bold text-gray-400 mr-2">Suggérés :</span>
                {allWorkspaceTags
                  .filter(tg => !tags.includes(tg))
                  .map(tg => (
                    <button
                      key={tg}
                      type="button"
                      onClick={() => {
                        setTags([...tags, tg]);
                        onTyping();
                      }}
                      className="text-[9px] font-semibold bg-gray-50 hover:bg-gray-100 text-gray-650 px-1.5 py-0.5 border border-gray-150 border-dashed rounded cursor-pointer transition-all"
                    >
                      + {tg}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Accent Color quick picks */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Couleur du marqueur</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(COLOR_MAP).map((colorKey) => {
                const conf = COLOR_MAP[colorKey];
                const isSelected = color === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setColor(colorKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-black border-black text-white scale-102"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-2.5 w-2.5 rounded-sm shadow-2xs border border-white/20" style={{ backgroundColor: conf.hex }} />
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Contenu</label>
            <textarea
              placeholder="Saisissez votre contenu ici..."
              value={content}
              rows={5}
              onChange={(e) => handleInputChange("content", e.target.value)}
              className="w-full flex-1 bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none transition-all resize-y font-mono"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-250 rounded text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-save-note"
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
