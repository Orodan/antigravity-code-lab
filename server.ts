import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Note, Participant, ChatMessage, ActivityLog, RoomState } from "./src/types.js";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "rooms-data.json");

app.use(express.json());

// In-memory representation of workspaces
let rooms: Record<string, RoomState> = {};

// Load data from disk if it exists
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      rooms = JSON.parse(data);
      // Clean participant lists on start since no one is connected initially
      for (const roomId of Object.keys(rooms)) {
        rooms[roomId].participants = [];
        if (!rooms[roomId].users) {
          rooms[roomId].users = [];
        }
        // Release any locks
        rooms[roomId].notes = rooms[roomId].notes.map(note => ({
          ...note,
          isLocked: false,
          lockedBy: null,
          lockedByName: null
        }));
      }
      console.log(`Loaded ${Object.keys(rooms).length} rooms from disk.`);
    } else {
      rooms = {};
    }
  } catch (error) {
    console.error("Failed to load rooms data:", error);
    rooms = {};
  }
}

// Save rooms state to disk
function saveData() {
  try {
    // Save state, ignoring temporary active socket connections or client references
    const serializableRooms: Record<string, RoomState> = {};
    for (const [roomId, room] of Object.entries(rooms)) {
      serializableRooms[roomId] = {
        ...room,
        participants: [], // Clear active participants from disk persistence
        users: room.users || [] // Save created users pool
      };
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(serializableRooms, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save rooms data to disk:", error);
  }
}

loadData();

// SSE active connection registry: roomId -> array of connections
interface SSEClient {
  id: string; // participant ID
  res: any; // Express Response object
}
const activeSockets = new Map<string, SSEClient[]>();

// Utility to broadcast updates
function broadcastToRoom(roomId: string, data: any) {
  const clients = activeSockets.get(roomId) || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (e) {
      console.error(`Failed to push SSE payload for room ${roomId}:`, e);
    }
  });
}

// Generate default room items
function createDefaultRoom(roomId: string): RoomState {
  const defaultNotes: Note[] = [
    {
      id: "welcome-note-1",
      title: "📌 Bienvenue !",
      content: "Ceci est votre espace de notes collaboratif et instantané. Aucune inscription n'est requise !\n\nPartagez l'adresse URL de ce navigateur avec vos collaborateurs pour y travailler ensemble en temps réel.",
      color: "yellow",
      category: "Général",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastEditedBy: "Système",
      lastEditedById: "system",
      isLocked: false,
      lockedBy: null,
      lockedByName: null
    },
    {
      id: "welcome-note-2",
      title: "💡 Fonctionnalités",
      content: "- **Édition Simultanée** : Visualisez qui est connecté et qui tape en temps réel.\n- **Couleurs & Catégories** : Triez vos notes pour les organiser.\n- **Chat Intégré** : Échangez des idées en direct à droite.\n- **Historique** : Suivez les modifications des participants.",
      color: "blue",
      category: "Aide",
      createdAt: Date.now() + 1000,
      updatedAt: Date.now() + 1000,
      lastEditedBy: "Système",
      lastEditedById: "system",
      isLocked: false,
      lockedBy: null,
      lockedByName: null
    }
  ];

  return {
    roomId,
    notes: defaultNotes,
    participants: [],
    users: [],
    chat: [
      {
        id: "welcome-msg",
        senderId: "system",
        senderName: "Bandeau Système",
        senderColor: "#3B82F6",
        text: "Espace créé ! Partagez le lien avec vos collègues pour collaborer en direct.",
        timestamp: Date.now()
      }
    ],
    activityLog: [
      {
        id: "welcome-log",
        userName: "Système",
        userColor: "#3B82F6",
        action: "a initialisé cet espace",
        timestamp: Date.now()
      }
    ]
  };
}

// Retrieve or initialize a room
function getRoom(roomId: string): RoomState {
  if (!rooms[roomId]) {
    rooms[roomId] = createDefaultRoom(roomId);
    saveData();
  }
  return rooms[roomId];
}

// --- API Endpoints ---

// Create new room code
app.post("/api/rooms", (req, res) => {
  const uniqueId = `room-${Math.random().toString(36).substr(2, 9)}`;
  const room = getRoom(uniqueId);
  res.status(201).json({ roomId: uniqueId, room });
});

// Retrieve details of a room block
app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = getRoom(roomId);
  res.json(room);
});

// Create note inside workspace
app.post("/api/rooms/:roomId/notes", (req, res) => {
  const { roomId } = req.params;
  const { title, content, color, category, tags, assigneeId, assigneeName, assigneeColor, creatorId, creatorName, creatorColor } = req.body;

  const room = getRoom(roomId);
  const newNote: Note = {
    id: `note-${Math.random().toString(36).substr(2, 9)}`,
    title: title || "Nouvelle Note",
    content: content || "",
    color: color || "yellow",
    category: category || "Général",
    tags: tags || [],
    assigneeId: assigneeId || null,
    assigneeName: assigneeName || null,
    assigneeColor: assigneeColor || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastEditedBy: creatorName || "Utilisateur Anonyme",
    lastEditedById: creatorId || "unknown",
    isLocked: false,
    lockedBy: null,
    lockedByName: null
  };

  room.notes.push(newNote);

  // Log activity
  const log: ActivityLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    userName: creatorName || "Quelqu'un",
    userColor: creatorColor || "#A3A3A3",
    action: `a créé la note "${newNote.title}"`,
    timestamp: Date.now()
  };
  room.activityLog.push(log);

  saveData();

  // Broadcast to all active clients in room
  broadcastToRoom(roomId, { type: "sync", state: room });

  res.status(201).json(newNote);
});

// Update an individual Note
app.put("/api/rooms/:roomId/notes/:noteId", (req, res) => {
  const { roomId, noteId } = req.params;
  const { title, content, color, category, tags, assigneeId, assigneeName, assigneeColor, editorId, editorName, editorColor, releaseLock } = req.body;

  const room = getRoom(roomId);
  const index = room.notes.findIndex(n => n.id === noteId);

  if (index === -1) {
    return res.status(404).json({ error: "Note introuvable" });
  }

  const currentNote = room.notes[index];

  // If another client holds a lock, forbid updates unless from them
  if (currentNote.isLocked && currentNote.lockedBy !== editorId && currentNote.lockedBy !== null) {
    return res.status(409).json({ error: "La note est en cours d'édition par un autre utilisateur" });
  }

  // Record old title for clean event log if changed
  const oldTitle = currentNote.title;
  const isTitleChanged = title !== undefined && title !== oldTitle;

  // Perform surgical updates
  if (title !== undefined) currentNote.title = title;
  if (content !== undefined) currentNote.content = content;
  if (color !== undefined) currentNote.color = color;
  if (category !== undefined) currentNote.category = category;
  if (tags !== undefined) currentNote.tags = tags;
  if (assigneeId !== undefined) currentNote.assigneeId = assigneeId;
  if (assigneeName !== undefined) currentNote.assigneeName = assigneeName;
  if (assigneeColor !== undefined) currentNote.assigneeColor = assigneeColor;

  currentNote.updatedAt = Date.now();
  currentNote.lastEditedBy = editorName || "Utilisateur Anonyme";
  currentNote.lastEditedById = editorId;

  if (releaseLock) {
    currentNote.isLocked = false;
    currentNote.lockedBy = null;
    currentNote.lockedByName = null;
  }

  // Clean typing indicators for this note for this participant
  const parsedParticipant = room.participants.find(p => p.id === editorId);
  if (parsedParticipant && parsedParticipant.typingNoteId === noteId) {
    parsedParticipant.typingNoteId = null;
  }

  // Create action log (avoid spam on content keystrokes, do for title and color changes, or release lock with content change)
  if (isTitleChanged || releaseLock) {
    let actionStr = "";
    if (isTitleChanged) {
      actionStr = `a renommé "${oldTitle}" en "${currentNote.title}"`;
    } else {
      actionStr = `a enregistré des corrections dans "${currentNote.title}"`;
    }

    const log: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userName: editorName || "Quelqu'un",
      userColor: editorColor || "#A3A3A3",
      action: actionStr,
      timestamp: Date.now()
    };
    room.activityLog.push(log);
  }

  saveData();
  broadcastToRoom(roomId, { type: "sync", state: room });

  res.json(currentNote);
});

// Lock a note dynamically for visual lock feedback in other UI panels
app.post("/api/rooms/:roomId/notes/:noteId/lock", (req, res) => {
  const { roomId, noteId } = req.params;
  const { userId, userName } = req.body;

  const room = getRoom(roomId);
  const currentNote = room.notes.find(n => n.id === noteId);

  if (!currentNote) {
    return res.status(404).json({ error: "Note introuvable" });
  }

  if (currentNote.isLocked && currentNote.lockedBy !== userId && currentNote.lockedBy !== null) {
    return res.status(409).json({ error: "Déjà verrouillé par quelqu'un d'autre" });
  }

  currentNote.isLocked = true;
  currentNote.lockedBy = userId;
  currentNote.lockedByName = userName;

  const p = room.participants.find(part => part.id === userId);
  if (p) {
    p.typingNoteId = noteId;
  }

  broadcastToRoom(roomId, { type: "sync", state: room });
  res.json({ success: true, note: currentNote });
});

// Retrieve or unlock note
app.post("/api/rooms/:roomId/notes/:noteId/unlock", (req, res) => {
  const { roomId, noteId } = req.params;
  const { userId } = req.body;

  const room = getRoom(roomId);
  const currentNote = room.notes.find(n => n.id === noteId);

  if (!currentNote) {
    return res.status(404).json({ error: "Note introuvable" });
  }

  if (currentNote.lockedBy === userId || currentNote.lockedBy === null) {
    currentNote.isLocked = false;
    currentNote.lockedBy = null;
    currentNote.lockedByName = null;

    const p = room.participants.find(part => part.id === userId);
    if (p) {
      p.typingNoteId = null;
    }

    broadcastToRoom(roomId, { type: "sync", state: room });
  }

  res.json({ success: true, note: currentNote });
});

// Delete note from room
app.delete("/api/rooms/:roomId/notes/:noteId", (req, res) => {
  const { roomId, noteId } = req.params;
  const { userId, userName, userColor } = req.body;

  const room = getRoom(roomId);
  const noteIndex = room.notes.findIndex(n => n.id === noteId);

  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note introuvable" });
  }

  const deletingNote = room.notes[noteIndex];

  // Lock protection check
  if (deletingNote.isLocked && deletingNote.lockedBy !== userId && deletingNote.lockedBy !== null) {
    return res.status(409).json({ error: "La note est en cours d'édition" });
  }

  room.notes.splice(noteIndex, 1);

  // Add event log
  const log: ActivityLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    userName: userName || "Quelqu'un",
    userColor: userColor || "#A3A3A3",
    action: `a supprimé la note "${deletingNote.title}"`,
    timestamp: Date.now()
  };
  room.activityLog.push(log);

  saveData();
  broadcastToRoom(roomId, { type: "sync", state: room });

  res.json({ success: true });
});

// Post a chat message
app.post("/api/rooms/:roomId/chat", (req, res) => {
  const { roomId } = req.params;
  const { senderId, senderName, senderColor, text } = req.body;

  const room = getRoom(roomId);
  const chatMsg: ChatMessage = {
    id: `msg-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    senderName,
    senderColor,
    text,
    timestamp: Date.now()
  };

  room.chat.push(chatMsg);
  // Cap chat at 100 messages to prevent database swelling
  if (room.chat.length > 100) {
    room.chat.shift();
  }

  saveData();
  broadcastToRoom(roomId, { type: "sync", state: room });

  res.status(201).json(chatMsg);
});

// Typing indicator update
app.post("/api/rooms/:roomId/typing", (req, res) => {
  const { roomId } = req.params;
  const { userId, noteId } = req.body;

  const room = getRoom(roomId);
  const participant = room.participants.find(p => p.id === userId);

  if (participant) {
    participant.typingNoteId = noteId;
    broadcastToRoom(roomId, { type: "presence", participants: room.participants });
  }

  res.json({ success: true });
});

// Create a persistent workspace user/member manually
app.post("/api/rooms/:roomId/users", (req, res) => {
  const { roomId } = req.params;
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Le nom de l'utilisateur est requis" });
  }

  const room = getRoom(roomId);
  if (!room.users) {
    room.users = [];
  }

  const newUser = {
    id: `user-manual-${Math.random().toString(36).substr(2, 9)}`,
    name,
    color: color || "#10B981"
  };

  room.users.push(newUser);

  // Log activity
  const log: ActivityLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    userName: "Système",
    userColor: "#6B7280",
    action: `a créé l'utilisateur "${newUser.name}"`,
    timestamp: Date.now()
  };
  room.activityLog.push(log);

  saveData();
  broadcastToRoom(roomId, { type: "sync", state: room });

  res.status(201).json(newUser);
});

// --- Server-Sent Events real-time sync channel ---
app.get("/api/rooms/:roomId/sync", (req, res) => {
  const { roomId } = req.params;
  const { id: participantId, name: pName, color: pColor } = req.query;

  if (!participantId || !pName || !pColor) {
    return res.status(400).send("Parameters missing");
  }

  const pid = String(participantId);
  const name = String(pName);
  const color = String(pColor);

  const room = getRoom(roomId);

  // Establish standard SSE response headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  // Re-register or append client participant
  room.participants = room.participants.filter(p => p.id !== pid);
  room.participants.push({
    id: pid,
    name,
    color,
    typingNoteId: null,
    lastSeen: Date.now()
  });

  // Sync users pool
  if (!room.users) {
    room.users = [];
  }
  const existingUserIdx = room.users.findIndex(u => u.id === pid);
  if (existingUserIdx !== -1) {
    room.users[existingUserIdx].name = name;
    room.users[existingUserIdx].color = color;
  } else {
    room.users.push({
      id: pid,
      name,
      color
    });
  }

  // Feed initial status immediately
  res.write(`data: ${JSON.stringify({ type: "sync", state: room })}\n\n`);

  // Log join activity
  const joinLog: ActivityLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    userName: name,
    userColor: color,
    action: "a rejoint la session collaborative",
    timestamp: Date.now()
  };
  room.activityLog.push(joinLog);
  // Cap logs at 100 items
  if (room.activityLog.length > 100) {
    room.activityLog.shift();
  }

  // Save room layout
  saveData();

  // Register client socket handler
  if (!activeSockets.has(roomId)) {
    activeSockets.set(roomId, []);
  }
  activeSockets.get(roomId)!.push({ id: pid, res });

  // Broadcast to other collaborators that they joined
  broadcastToRoom(roomId, { type: "sync", state: room });

  // Handle client disconnects gracefully
  req.on("close", () => {
    // Unsubscribe from active SSE registry
    const clients = activeSockets.get(roomId) || [];
    activeSockets.set(roomId, clients.filter(c => c.res !== res));

    // Remove user profile from visual presence lists
    const remainingParticipants = room.participants.filter(p => p.id !== pid);
    room.participants = remainingParticipants;

    // Release any locks currently matching this participant ID
    room.notes = room.notes.map(note => {
      if (note.lockedBy === pid) {
        return {
          ...note,
          isLocked: false,
          lockedBy: null,
          lockedByName: null
        };
      }
      return note;
    });

    // Logging leave action
    const leaveLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userName: name,
      userColor: color,
      action: "a quitté la session collaborative",
      timestamp: Date.now()
    };
    room.activityLog.push(leaveLog);

    saveData();

    // Broadcast update feed to the lobby
    broadcastToRoom(roomId, { type: "sync", state: room });
  });
});

// Serve frontend assets
async function startViteServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started. Ingress binds to http://localhost:${PORT}`);
  });
}

startViteServer();
