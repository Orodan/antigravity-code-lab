import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, LayoutGrid, List, ArrowUpDown, 
  Tag, AlertCircle, User
} from "lucide-react";
import { Note, Participant, RoomState } from "./types";
import Lobby from "./components/Lobby";
import RoomHeader from "./components/RoomHeader";
import NoteCard from "./components/NoteCard";
import NoteModal from "./components/NoteModal";
import CollaborativeChat from "./components/CollaborativeChat";

const ANIMALS = [
  "Castor Vif", "Loutre Joyeuse", "Hibou Curieux", "Renard Rusé", 
  "Chouette Agile", "Koala Paisible", "Blaireau Malin", "Écureuil Farceur",
  "Panda Rigolo", "Lynx Attentif", "Hérisson Doux", "Lama Farceur"
];
const COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#6B7280"
];

const getOrCreateProfile = (): Participant => {
  let id = sessionStorage.getItem("collab-user-id");
  let name = sessionStorage.getItem("collab-user-name");
  let color = sessionStorage.getItem("collab-user-color");

  if (!id) {
    id = "user-" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("collab-user-id", id);
  }
  if (!name) {
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const number = Math.floor(Math.random() * 89 + 10);
    name = `🦊 ${animal} ${number}`;
    sessionStorage.setItem("collab-user-name", name);
  }
  if (!color) {
    color = COLORS[Math.floor(Math.random() * COLORS.length)];
    sessionStorage.setItem("collab-user-color", color);
  }

  return {
    id,
    name,
    color,
    typingNoteId: null,
    lastSeen: Date.now()
  };
};

export default function App() {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Participant | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & Search states (filtered strictly by title as requested)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical" | "color">("newest");
  const [isListView, setIsListView] = useState(false);
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<string[]>([]);
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string | null>(null);

  // Custom User Creation modal/input States
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserColor, setNewUserColor] = useState("#10B981");

  // Editor modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const prof = getOrCreateProfile();
    setMyProfile(prof);

    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setCurrentRoomId(room);
    }
  }, []);

  useEffect(() => {
    if (!currentRoomId || !myProfile) {
      setRoomState(null);
      return;
    }

    setIsLoading(true);

    const url = `/api/rooms/${currentRoomId}/sync?id=${myProfile.id}&name=${encodeURIComponent(myProfile.name)}&color=${encodeURIComponent(myProfile.color)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sync") {
          setRoomState(data.state);
        }
      } catch (e) {
        console.error("Failed to parse SSE payload:", e);
      } finally {
        setIsLoading(false);
      }
    };

    eventSource.onerror = () => {
      console.warn("EventSource line closed or lost. Retrying standard connection...");
      setIsLoading(false);
    };

    return () => {
      eventSource.close();
    };
  }, [currentRoomId, myProfile]);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      const newRoomId = data.roomId;
      
      window.history.pushState({}, "", `?room=${newRoomId}`);
      setCurrentRoomId(newRoomId);
    } catch (e) {
      console.error("Failed to create room:", e);
      triggerToast("❌ Impossible de créer l'espace collaboratif.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    window.history.pushState({}, "", `?room=${roomId}`);
    setCurrentRoomId(roomId);
  };

  const handleExitRoom = () => {
    window.history.pushState({}, "", window.location.pathname);
    setCurrentRoomId(null);
    setRoomState(null);
    setSearchQuery("");
    setSelectedCategory("Toutes");
    setSelectedTagsFilter([]);
    setSelectedAssigneeFilter(null);
    setIsCreateUserOpen(false);
    setNewUserName("");
  };

  const handleNameChange = (newName: string) => {
    if (!myProfile) return;
    const updated = { ...myProfile, name: newName };
    setMyProfile(updated);
    sessionStorage.setItem("collab-user-name", newName);
    triggerToast("👤 Votre pseudonyme a été mis à jour !");
  };

  const handleLockNote = async (noteId: string) => {
    if (!currentRoomId || !myProfile) return false;
    try {
      const res = await fetch(`/api/rooms/${currentRoomId}/notes/${noteId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: myProfile.id, userName: myProfile.name })
      });
      return res.ok;
    } catch (e) {
      console.error("Failed lock call:", e);
      return false;
    }
  };

  const handleUnlockNote = async (noteId: string) => {
    if (!currentRoomId || !myProfile) return;
    try {
      await fetch(`/api/rooms/${currentRoomId}/notes/${noteId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: myProfile.id })
      });
    } catch (e) {
      console.error("Failed unlock call:", e);
    }
  };

  const handleSaveNote = async (
    title: string,
    content: string,
    color: string,
    category: string,
    tags: string[],
    assigneeId: string | null,
    assigneeName: string | null,
    assigneeColor: string | null
  ) => {
    if (!currentRoomId || !myProfile) return;
    
    setIsLoading(true);
    const body = {
      title,
      content,
      color,
      category,
      tags,
      assigneeId,
      assigneeName,
      assigneeColor,
      editorId: myProfile.id,
      editorName: myProfile.name,
      editorColor: myProfile.color,
      creatorId: myProfile.id,
      creatorName: myProfile.name,
      creatorColor: myProfile.color,
      releaseLock: true
    };

    try {
      if (editingNote) {
        await fetch(`/api/rooms/${currentRoomId}/notes/${editingNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } else {
        await fetch(`/api/rooms/${currentRoomId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }
      setIsModalOpen(false);
      setEditingNote(null);
    } catch (e) {
      console.error("Save note error:", e);
      triggerToast("❌ Échec lors de la sauvegarde de la note.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!currentRoomId || !newUserName.trim()) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/rooms/${currentRoomId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName.trim(), color: newUserColor })
      });
      if (res.ok) {
        setNewUserName("");
        setIsCreateUserOpen(false);
        triggerToast(`🎉 Utilisateur "${newUserName.trim()}" créé !`);
      } else {
        const err = await res.json();
        triggerToast(`❌ ${err.error || "Erreur lors de la création."}`);
      }
    } catch (e) {
      console.error("Create user error:", e);
      triggerToast("❌ Impossible d'ajouter le collaborateur.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (note: Note) => {
    const success = await handleLockNote(note.id);
    if (success) {
      setEditingNote(note);
      setIsModalOpen(true);
    } else {
      triggerToast("🔒 Cette note est en cours de modification par une autre personne !");
    }
  };

  const handleCloseModal = async () => {
    if (editingNote) {
      await handleUnlockNote(editingNote.id);
    }
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!currentRoomId || !myProfile) return;
    
    const confirmVal = window.confirm("Ravir ? Voulez-vous vraiment supprimer cette note ?");
    if (!confirmVal) return;

    try {
      await fetch(`/api/rooms/${currentRoomId}/notes/${noteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: myProfile.id,
          userName: myProfile.name,
          userColor: myProfile.color
        })
      });
      triggerToast("🗑️ Note supprimée avec succès.");
    } catch (e) {
      console.error("Failed to delete note:", e);
      triggerToast("❌ Impossible d'enlever la note.");
    }
  };

  const handleColorChange = async (noteId: string, color: string) => {
    if (!currentRoomId || !myProfile) return;
    try {
      await fetch(`/api/rooms/${currentRoomId}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          color,
          editorId: myProfile.id,
          editorName: myProfile.name,
          editorColor: myProfile.color,
          releaseLock: false
        })
      });
    } catch (e) {
      console.error("Failed to change color:", e);
    }
  };

  const handleTypingNotify = () => {
    if (!currentRoomId || !myProfile || !editingNote) return;
    fetch(`/api/rooms/${currentRoomId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: myProfile.id, noteId: editingNote.id })
    }).catch(() => {});
  };

  const handleSendMessage = async (text: string) => {
    if (!currentRoomId || !myProfile) return;
    try {
      await fetch(`/api/rooms/${currentRoomId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: myProfile.id,
          senderName: myProfile.name,
          senderColor: myProfile.color,
          text
        })
      });
    } catch (e) {
      console.error("Failed to push chat:", e);
    }
  };

  const categoriesList = useMemo(() => {
    if (!roomState) return ["Général"];
    const cats = new Set<string>();
    cats.add("Général");
    roomState.notes.forEach(note => {
      if (note.category) cats.add(note.category);
    });
    return Array.from(cats);
  }, [roomState]);

  const allWorkspaceTags = useMemo(() => {
    if (!roomState) return [];
    const tagsSet = new Set<string>();
    roomState.notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tg => {
          if (tg.trim()) {
            tagsSet.add(tg.trim());
          }
        });
      }
    });
    return Array.from(tagsSet);
  }, [roomState]);

  const processedNotes = useMemo(() => {
    if (!roomState) return [];
    
    let list = [...roomState.notes];

    // Filter strictly by selected category
    if (selectedCategory !== "Toutes") {
      list = list.filter(n => n.category === selectedCategory);
    }

    // Filter strictly by search on note title as requested
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        n => n.title.toLowerCase().includes(q)
      );
    }

    // Filter strictly by selected tags
    if (selectedTagsFilter.length > 0) {
      list = list.filter(n => {
        const noteTags = n.tags || [];
        // Match all selected tag filters
        return selectedTagsFilter.every(tg => noteTags.includes(tg));
      });
    }

    // Filter strictly by selected assignee
    if (selectedAssigneeFilter) {
      if (selectedAssigneeFilter === "none") {
        list = list.filter(n => !n.assigneeId);
      } else {
        list = list.filter(n => n.assigneeId === selectedAssigneeFilter);
      }
    }

    // Order results
    if (sortBy === "newest") {
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "oldest") {
      list.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === "alphabetical") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "color") {
      list.sort((a, b) => a.color.localeCompare(b.color));
    }

    return list;
  }, [roomState, searchQuery, selectedCategory, selectedTagsFilter, selectedAssigneeFilter, sortBy]);

  if (!currentRoomId || !myProfile) {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900" id="classroom-main">
      
      {/* Collaborative Head Panel */}
      <RoomHeader
        roomId={currentRoomId}
        participants={roomState?.participants || []}
        currentParticipant={myProfile}
        onChangeName={handleNameChange}
        onExit={handleExitRoom}
      />

      {/* Floating dynamic Banner / Toast alerts */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-950 text-white py-2 px-4 rounded shadow-md text-[11px] font-bold tracking-wider uppercase leading-none flex items-center gap-2 border border-gray-800 animate-slide-down">
          <AlertCircle className="h-3.5 w-3.5 text-gray-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary collaborative Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* Core Workspace Layout */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-0 flex flex-col" id="notes-space-canvas">
          
          {/* 1. DEDICATED PROMINENT SEARCH BAR (strictly filters notes by title as requested) */}
          <div className="relative mb-6" id="top-title-search-wrapper">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="🔍 Rechercher et filtrer les notes par titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-150 rounded px-5 pl-12 py-3 text-sm font-semibold focus:outline-none focus:border-black focus:bg-white transition-all shadow-2xs placeholder:text-gray-400"
              id="top-title-search-input"
            />
          </div>

          {/* Secondary Controls bar block */}
          <div className="bg-white p-3 rounded border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4" id="workspace-controls-bar">
            
            {/* Filter tags & sorts */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
              {/* Tag filtering selector */}
              <div className="flex items-center gap-1.5 bg-gray-55 px-2.5 py-1.5 rounded border border-gray-150 text-gray-600">
                <Tag className="h-3 w-3 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-bold focus:outline-none pr-1 cursor-pointer uppercase tracking-wider"
                  id="category-filter-select"
                >
                  <option value="Toutes">Tous les tags</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Assignee filtering selector dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-55 px-2.5 py-1.5 rounded border border-gray-150 text-gray-650">
                <User className="h-3 w-3 text-gray-400" />
                <select
                  value={selectedAssigneeFilter || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedAssigneeFilter(v === "" ? null : v);
                  }}
                  className="bg-transparent border-none text-[11px] font-bold focus:outline-none pr-1 cursor-pointer uppercase tracking-wider"
                  id="assignee-filter-select"
                >
                  <option value="">Tous les responsables</option>
                  <option value="none">-- Sans assignation --</option>
                  {roomState?.users && roomState.users.map(u => (
                    <option key={u.id} value={u.id}>Membres: {u.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort selector dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-55 px-2.5 py-1.5 rounded border border-gray-150 text-gray-600">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-[11px] font-bold focus:outline-none pr-1 cursor-pointer uppercase tracking-wider"
                  id="sorting-select"
                >
                  <option value="newest">Plus récentes</option>
                  <option value="oldest">Plus anciennes</option>
                  <option value="alphabetical">Ordre Alphabétique</option>
                  <option value="color">Couleurs d'accent</option>
                </select>
              </div>
            </div>

            {/* Layout selectors & new note creation */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Grid or List Layout Toggles */}
              <div className="bg-gray-100 p-0.5 rounded flex gap-0.5 border border-gray-150/50">
                <button
                  onClick={() => setIsListView(false)}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    !isListView ? "bg-white text-black shadow-2xs" : "text-gray-400 hover:text-gray-700"
                  }`}
                  title="Grille minimalist"
                  id="btn-grid-layout"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsListView(true)}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    isListView ? "bg-white text-black shadow-2xs" : "text-gray-400 hover:text-gray-700"
                  }`}
                  title="Liste compacte"
                  id="btn-list-layout"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Toggle Team Members panel */}
              <button
                onClick={() => {
                  setIsCreateUserOpen(!isCreateUserOpen);
                }}
                id="btn-toggle-team"
                className={`font-bold text-xs py-2 px-4 rounded uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border shadow-2xs transition-all active:scale-[0.98] ${
                  isCreateUserOpen
                    ? "bg-black text-white border-black"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Membres {roomState?.users && `(${roomState.users.length})`}</span>
              </button>

              {/* Add Note Trigger */}
              <button
                onClick={() => {
                  setEditingNote(null);
                  setIsModalOpen(true);
                }}
                id="btn-new-note"
                className="bg-black hover:bg-gray-800 text-white font-bold text-xs py-2 px-4 rounded uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouvelle Note</span>
              </button>
            </div>

          </div>

          {/* Team Members Drawer/Panel */}
          {isCreateUserOpen && (
            <div className="bg-gray-50 border border-gray-200/80 rounded p-5 mb-6 animate-slide-down" id="team-management-panel">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Create user form */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Créer un profil utilisateur (Membres)</h4>
                  <div className="flex flex-col gap-2.5">
                    <input
                      type="text"
                      placeholder="Nom du membre d'équipe... (ex: Sophie, Thomas)"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      maxLength={18}
                      className="bg-white border border-gray-250 focus:border-black rounded px-3 py-1.5 text-xs text-gray-950 font-bold focus:outline-none transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateUser();
                        }
                      }}
                    />
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[9px] uppercase font-bold text-gray-400">Couleur d'avatar:</span>
                      <div className="flex gap-1.5 items-center">
                        {["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#4B5563", "#06B6D4"].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewUserColor(c)}
                            className={`h-4.5 w-4.5 rounded-full transition-transform cursor-pointer border border-white shadow-2xs ${
                              newUserColor === c ? "ring-1.5 ring-black scale-110" : "scale-100 hover:scale-105"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateUser}
                      disabled={!newUserName.trim()}
                      className="bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold py-1.5 px-4 rounded uppercase tracking-wider transition-all self-start cursor-pointer"
                    >
                      Ajouter le membre
                    </button>
                  </div>
                </div>

                {/* Right: Listed users pool */}
                <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center justify-between">
                    <span>Membres enregistrés dans l'espace</span>
                    <span className="text-[8px] lowercase font-normal text-gray-400">Ils apparaîtront comme choix d'assignation</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[110px] pr-1 scrollbar-thin">
                    {roomState?.users && roomState.users.map(u => {
                      const isActive = roomState.participants.some(p => p.id === u.id);
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded shadow-4xs border border-gray-100 select-none bg-white font-sans"
                        >
                          <span className="h-2 w-2 rounded-full shadow-2xs" style={{ backgroundColor: u.color }} />
                          <span className="text-gray-900 font-bold text-[11px]">{u.name}</span>
                          {isActive && (
                            <span className="text-[7px] bg-green-100 text-green-700 px-1 py-0.25 rounded-xs uppercase tracking-wider font-extrabold ml-1">En ligne</span>
                          )}
                        </div>
                      );
                    })}
                    {(!roomState?.users || roomState.users.length === 0) && (
                      <span className="text-xs text-gray-405 italic">Aucun membre enregistré d'avance. Saisissez-en un !</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tags Filter Row */}
          {roomState && allWorkspaceTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-gray-55/60 border border-gray-150/70 border-dashed rounded p-3 mb-6" id="tags-filter-bar">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 shrink-0">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                <span>Filtrer par étiquette :</span>
              </span>
              <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
                {allWorkspaceTags.map(tg => {
                  const isFiltered = selectedTagsFilter.includes(tg);
                  return (
                    <button
                      key={tg}
                      onClick={() => {
                        if (isFiltered) {
                          setSelectedTagsFilter(selectedTagsFilter.filter(t => t !== tg));
                        } else {
                          setSelectedTagsFilter([...selectedTagsFilter, tg]);
                        }
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-all ${
                        isFiltered
                          ? "bg-black text-white shadow-2xs border border-black"
                          : "bg-white border border-gray-150 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      #{tg}
                    </button>
                  );
                })}
              </div>
              {selectedTagsFilter.length > 0 && (
                <button
                  onClick={() => setSelectedTagsFilter([])}
                  className="text-[10px] font-extrabold text-red-650 hover:text-red-700 uppercase tracking-wider cursor-pointer bg-red-50/50 border border-red-150 hover:bg-red-50/85 px-2.5 py-1 rounded transition-colors"
                >
                  Effacer ({selectedTagsFilter.length})
                </button>
              )}
            </div>
          )}

          {/* Cards board zone */}
          {!roomState ? (
            /* Loading State view */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
              <span className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent mb-4" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connexion en cours...</p>
            </div>
          ) : processedNotes.length === 0 ? (
            /* Empty notes filter list */
            <div className="flex-1 bg-white border border-gray-100 rounded flex flex-col items-center justify-center text-center p-12">
              <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded flex items-center justify-center mb-4">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Aucune note ne correspond</h3>
              <p className="text-xs text-gray-450 max-w-xs mt-1.5 mb-6 leading-relaxed">
                Modifiez vos critères de recherche par titre ou créez une nouvelle note collaborative !
              </p>
              <button
                onClick={() => {
                  setEditingNote(null);
                  setIsModalOpen(true);
                }}
                className="bg-black hover:bg-gray-800 text-white py-2 px-5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                ✨ Créer une note
              </button>
            </div>
          ) : (
            /* Notes listings layout */
            <div
              className={`flex-1 w-full ${
                isListView
                  ? "flex flex-col gap-3 max-w-4xl mx-auto"
                  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              }`}
              id="notes-items-grid"
            >
              {processedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUserId={myProfile.id}
                  onEditClick={handleEditClick}
                  onDeleteClick={handleDeleteNote}
                  onColorChange={handleColorChange}
                  isListView={isListView}
                />
              ))}
            </div>
          )}

        </main>

        {/* Real-time team Chat and audit Sidebar */}
        <CollaborativeChat
          chat={roomState?.chat || []}
          activityLog={roomState?.activityLog || []}
          currentParticipant={myProfile}
          onSendMessage={handleSendMessage}
        />

      </div>

      {/* Editor prompt Modal Overlay */}
      {isModalOpen && (
        <NoteModal
          note={editingNote}
          categories={categoriesList}
          allWorkspaceTags={allWorkspaceTags}
          workspaceUsers={roomState?.users || []}
          onSave={handleSaveNote}
          onClose={handleCloseModal}
          onTyping={handleTypingNotify}
        />
      )}

    </div>
  );
}
