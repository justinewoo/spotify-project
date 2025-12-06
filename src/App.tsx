import { NowPlaying } from "./components/NowPlaying";
import { BottomNav } from "./components/BottomNav";
import { MainContent } from "./components/MainContent";
import { Header } from "./components/Header";
import { CreatePlaylist } from "./components/CreatePlaylist";
import { PlaylistView } from "./components/PlaylistView";
import { SearchSongs } from "./components/SearchSongs";
import { SessionView } from "./components/SessionView";
import { JoinSession } from "./components/JoinSession";
import { PlaylistSettings } from "./components/PlaylistSettings";
import { MyPlaylists } from "./components/MyPlaylists";
import { LoginModal } from "./components/LoginModal";
import { Recommendations } from "./components/Recommendations";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Undo2 } from "lucide-react";
import {
  fetchUserPlaylists,
  createPlaylistInDb,
  getOrCreateUser,
  fetchSongsForPlaylist,
  setSongsForPlaylist,
  createSessionInDb,
  addParticipantToSession,
  fetchSessionByCode,
  fetchSessionQueue,
  fetchSessionParticipants,
  fetchSessionSettings,
  addSongToSessionQueue,
  clearSessionQueue,
  removeSongFromSessionQueue,
  removeParticipantFromSession,
  updateSessionSettings,
} from "./backend";


interface AppNotification {
  id: string;
  message: string;
  type: "info" | "success" | "vote";
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface QueuedSong extends Song {
  queuedBy: {
    type: 'guest' | 'user';
    name: string;
  };
}

interface PlaylistSettings {
  isGroupPlaylist: boolean;
  unlimitedQueuing: boolean;
  queuesPerHour: string;
  autoplayMode: string;
  hostOverride: boolean;
  voteToSkip: boolean;
  skipPercentage: string;
  isPrivateSession?: boolean;
}

const defaultSettings: PlaylistSettings = {
  isGroupPlaylist: true,
  unlimitedQueuing: true,
  queuesPerHour: "3",
  autoplayMode: "playlist",
  hostOverride: false,
  voteToSkip: false,
  skipPercentage: "50",
  isPrivateSession: false,
};

interface Playlist {
  id: string;
  name: string;
  albumArt: string | null;
  songs: Song[];
  isSessionActive: boolean;
  sessionCode: string | null;
  sessionId?: string | null;
  queue: QueuedSong[];
  hasJoinedSession: boolean;
  participantId?: string | null;
  settings: PlaylistSettings;
  participants?: Array<{
    id: string;
    name: string;
    type: 'host' | 'user' | 'guest';
  }>;
  notifications?: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'vote';
  }>;
  skipVotes?: Set<string>; // Track who voted to skip
  creditsRemaining?: number;
  hasVotedToSkip?: boolean; // Track if current user has voted
}

interface SessionNotification {
  id: string;
  sessionCode: string;
  playlistName: string;
  isJoined?: boolean;
  isCreated?: boolean;
}

interface AppUser {
  id: string;
  email: string;
  displayName: string;
}

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const demoNames = ["Skyler", "Alex", "Jordan", "Taylor", "Morgan", "Jamie", "Riley", "Casey"];
const demoAdjectives = ["Midnight", "Sunset", "Electric", "Golden", "Velvet", "Neon", "Forest", "Ocean", "Crimson", "Silver"];
const demoNouns = ["Drive", "Breeze", "Pulse", "Echoes", "Starlight", "Waves", "Anthem", "Skyline", "Flicker", "Voyage"];
const demoArtists = ["Neon Roads", "Lo-Fi Lanes", "Cardio Crew", "Focus Fields", "Harbor Lights", "City Lanterns", "Freeway Flyers", "Soft Currents", "Night Desk", "Stereo Pulse"];
const makeDemoSong = (): Song => {
  const adj = demoAdjectives[Math.floor(Math.random() * demoAdjectives.length)];
  const noun = demoNouns[Math.floor(Math.random() * demoNouns.length)];
  const artist = demoArtists[Math.floor(Math.random() * demoArtists.length)];
  const seed = `${adj}-${noun}-${Math.floor(Math.random() * 100000)}`;
  return {
    id: `demo-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    title: `${adj} ${noun}`,
    artist,
    album: `${adj} Collection`,
    albumArt: `https://picsum.photos/seed/${encodeURIComponent(seed)}/300`,
  };
};

export default function App() {
  const [currentView, setCurrentView] = useState<string>("home");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showPlaylistSettings, setShowPlaylistSettings] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [sessionNotification, setSessionNotification] = useState<SessionNotification | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previousView, setPreviousView] = useState<string>("home");
  const [progress, setProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const SONG_DURATION = 10; // 10 seconds per song
  const participantCacheRef = useRef<Map<string, Set<string>>>(new Map());
  const notifiedQueueRef = useRef<Set<string>>(new Set());
  const notifiedParticipantRef = useRef<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const loadPlaylists = async () => {
      if (!currentUser) {
        setPlaylists([]);
        return;
      }

      const dbPlaylists = await fetchUserPlaylists(currentUser.id);

      const mapped = await Promise.all(
        dbPlaylists.map(async (p) => {
          const dbSongs = await fetchSongsForPlaylist(p.id);
          const mappedSongs: Song[] = dbSongs.map((s) => ({
            id: s.song_id,
            title: s.title,
            artist: s.artist,
            album: s.album ?? "",
            albumArt: s.album_art ?? "",
          }));

          return {
            id: p.id,
            name: p.name,
            albumArt: p.album_art,
            songs: mappedSongs,
            isSessionActive: false,
            sessionCode: null,
            queue: [],
            hasJoinedSession: false,
            settings: { ...defaultSettings },
          } as Playlist;
        })
      );

      setPlaylists(mapped);
    };

    loadPlaylists();
  }, [currentUser]);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);

  const currentSong: Song | null =
  (activePlaylist?.queue[currentSongIndex] as Song | undefined) ?? null;



  // Keep session data in sync across participants
  useEffect(() => {
    if (!activePlaylist?.isSessionActive || !activePlaylist.sessionId) return;

    let cancelled = false;

    const syncSessionState = async () => {
      const [queueRows, participantRows, dbSongs, dbSettings] = await Promise.all([
        fetchSessionQueue(activePlaylist.sessionId!),
        fetchSessionParticipants(activePlaylist.sessionId!),
        fetchSongsForPlaylist(activePlaylist.id),
        fetchSessionSettings(activePlaylist.sessionId!),
      ]);

      if (cancelled) return;

      const mappedQueue: QueuedSong[] = queueRows.map((q) => ({
        id: q.song_id,
        title: q.title,
        artist: q.artist,
        album: q.album ?? "",
        albumArt: q.album_art ?? "",
        queuedBy: {
          type: q.queued_by_type === "guest" ? "guest" : "user",
          name: q.queued_by_name,
        },
      }));

      const mappedParticipants =
        participantRows.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.role,
        })) ?? [];

    const mappedSongs: Song[] = dbSongs.map((s) => ({
      id: s.song_id ?? s.title,
      title: s.title,
      artist: s.artist,
      album: s.album ?? "",
      albumArt: s.album_art ?? "",
      }));

      // Detect newly added participants using a ref cache (so we don't fire every poll)
      const sessionKey = activePlaylist.sessionId ?? activePlaylist.id;
      const prevSet = participantCacheRef.current.get(sessionKey) ?? new Set<string>();
      const currentSet = new Set(mappedParticipants.map((p) => p.id));
      const newParticipants = mappedParticipants.filter((mp) => !prevSet.has(mp.id));
      participantCacheRef.current.set(sessionKey, currentSet);

      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== activePlaylist.id) return p;

          const incomingSettings = dbSettings ?? p.settings;
          const nextSettings = incomingSettings ? { ...p.settings, ...incomingSettings } : p.settings;

          // Recalculate credits for joined participants when settings change
          let creditsRemaining = p.creditsRemaining;
          if (p.hasJoinedSession && nextSettings.isGroupPlaylist) {
            if (nextSettings.unlimitedQueuing) {
              creditsRemaining = undefined;
            } else {
              const limit = parseInt(nextSettings.queuesPerHour, 10) || 0;
              creditsRemaining = Math.min(creditsRemaining ?? limit, limit);
            }
          }

          // Notify on newly seen queued songs (from anyone), de-duped by queue id
          mappedQueue.forEach((q) => {
            if (!notifiedQueueRef.current.has(q.id)) {
              const byName = q.queuedBy?.name ?? "Someone";
              addNotification(`Queued "${q.title}" by ${q.artist} (by ${byName})`, "info");
              notifiedQueueRef.current.add(q.id);
            }
          });

          return {
            ...p,
            queue: mappedQueue,
            participants: mappedParticipants,
            songs: mappedSongs,
            creditsRemaining,
            settings: nextSettings,
          };
        })
      );

      // Notify on newly detected participants joining
      if (newParticipants.length > 0) {
        newParticipants.forEach((np) => {
          if (!notifiedParticipantRef.current.has(np.id)) {
            const id = Date.now().toString() + np.id;
            setNotifications((prev) => [...prev, { id, message: `${np.name} joined the session`, type: "info" as const }]);
            notifiedParticipantRef.current.add(np.id);
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.id !== id));
            }, 4000);
          }
        });
      }
    };

    syncSessionState();
    const interval = setInterval(syncSessionState, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activePlaylist?.id, activePlaylist?.isSessionActive, activePlaylist?.sessionId]);

  // Demo mode: simulate participants and queue for public sessions
  useEffect(() => {
    if (!demoMode) return;
    if (!activePlaylist?.isSessionActive || activePlaylist.settings.isPrivateSession) return;
    if (!activePlaylist.sessionId) return;

    const addDemoBurst = async () => {
      // Get current participants to pick an existing guest if possible
      const refreshedParticipants = await fetchSessionParticipants(activePlaylist.sessionId!);
      const guests = refreshedParticipants.filter((p) => p.role === "guest");

      let chosenName: string | null = null;
      let addedParticipant = null;

      if (guests.length > 0) {
        chosenName = guests[Math.floor(Math.random() * guests.length)].name;
      } else {
        chosenName = demoNames[Math.floor(Math.random() * demoNames.length)];
        addedParticipant = await addParticipantToSession(activePlaylist.sessionId!, chosenName, "guest");
      }

      // pick a demo song
      const song = makeDemoSong();

      await addSongToSessionQueue(
        activePlaylist.sessionId!,
        {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          albumArt: song.albumArt,
        },
        { name: chosenName ?? "Guest", type: "guest" }
      );

      // Update local participants/queue quickly; sync will reconcile
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== activePlaylist.id) return p;
          const queuedSong: QueuedSong = {
            ...song,
            queuedBy: { type: "guest", name: chosenName ?? "Guest" },
          };
          const nextParticipants = addedParticipant
            ? [...(p.participants ?? []), { id: addedParticipant.id, name: addedParticipant.name, type: addedParticipant.role }]
            : p.participants ?? [];
          return {
            ...p,
            participants: nextParticipants.filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i),
            queue: [...p.queue, queuedSong],
          };
        })
      );
    };

    // Add one immediately so you see activity right away
    addDemoBurst().catch(console.error);

    const interval = setInterval(async () => {
      try {
        const roll = Math.random();

        if (roll < 0.5) {
          // force add a new guest and queue a song
          await addDemoBurst(true);
        } else if (roll < 0.85) {
          // queue using an existing guest (or add one if none)
          await addDemoBurst(false);
        } else {
          // 15% remove a guest
          const participantsArray =
            (await fetchSessionParticipants(activePlaylist.sessionId!)) ?? [];
          const guests = participantsArray.filter((p) => p.role === "guest");
          if (guests.length) {
            const target = guests[Math.floor(Math.random() * guests.length)];
            await removeParticipantFromSession(activePlaylist.sessionId!, target.id);
            setPlaylists((prev) =>
              prev.map((p) =>
                p.id === activePlaylist.id
                  ? {
                      ...p,
                      participants: (p.participants ?? []).filter((pp) => pp.id !== target.id),
                    }
                  : p
              )
            );
            const cacheSet = participantCacheRef.current.get(activePlaylist.sessionId!) ?? new Set<string>();
            cacheSet.delete(target.id);
            participantCacheRef.current.set(activePlaylist.sessionId!, cacheSet);
            addNotification(`${target.name} left the session`, "info");
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activePlaylist?.id, activePlaylist?.isSessionActive, activePlaylist?.settings.isPrivateSession, activePlaylist?.sessionId]);

  // Handle song completion and queue advancement
  useEffect(() => {
    if (progress >= 100 && isPlaying && activePlaylist) {
      // Song finished, advance to next song
      if (activePlaylist.isSessionActive) {
        // Remove the finished song from queue
        const finishedSong = activePlaylist.queue[0];
        const updatedQueue = activePlaylist.queue.slice(1);
        const updatedPlaylist = {
          ...activePlaylist,
          queue: updatedQueue
        };
        setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
        
        // Reset to first song (which will be the next song after removal)
        setCurrentSongIndex(0);
        setProgress(0);
        if (updatedQueue.length === 0) {
          setIsPlaying(false);
        }

        // Remove from Supabase queue so it doesn't reappear on sync
        if (activePlaylist.sessionId && finishedSong) {
          void removeSongFromSessionQueue(activePlaylist.sessionId, finishedSong.id).catch(console.error);
        }
        
      } else {
        // Playing from playlist (non-session mode)
        if (currentSongIndex < activePlaylist.queue.length - 1) {
          // More songs in current queue, move to next
          setCurrentSongIndex(currentSongIndex + 1);
          setProgress(0);
        } else {
          // Reached end of current queue, stop playing
          setIsPlaying(false);
          setCurrentSongIndex(0);
          setProgress(0);
        }
      }
    }
  }, [progress, isPlaying, activePlaylist, currentSongIndex]);

  // Handle playback progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Song finished, move to next song
            return 0;
          }
          // Progress increases by ~1% every 100ms for a 10-second song
          return prev + 100 / (SONG_DURATION * 10);
        });
      }, 100);
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isPlaying, currentSong]);


  const addNotification = (message: string, type: 'info' | 'success' | 'vote') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleUpdateSettings = async (settings: PlaylistSettings) => {
    if (activePlaylist) {
      let creditsRemaining = activePlaylist.creditsRemaining;

      // Recalculate credits whenever settings change during an active session
      if (activePlaylist.isSessionActive && settings.isGroupPlaylist) {
        if (settings.unlimitedQueuing) {
          creditsRemaining = undefined;
        } else {
          const limit = parseInt(settings.queuesPerHour, 10) || 0;
          creditsRemaining = limit;
        }
      }

      const updatedPlaylist = { ...activePlaylist, settings, creditsRemaining };
      setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));

      // Persist to Supabase when session is active
      if (activePlaylist.isSessionActive && activePlaylist.sessionId) {
        await updateSessionSettings(activePlaylist.sessionId, settings);
      }
    }
    setShowPlaylistSettings(false);
  };

  const handlePlaylistClick = async (playlistId: string) => {
    setActivePlaylistId(playlistId);
    setCurrentView("playlist-view");

    // 1) Fetch songs for this playlist from Supabase
    const dbSongs = await fetchSongsForPlaylist(playlistId);

    const mappedSongs: Song[] = dbSongs.map((s) => ({
      id: s.song_id,                
      title: s.title,
      artist: s.artist,
      album: s.album ?? "",
      albumArt: s.album_art ?? "",
    }));

    // 2) Merge into the correct playlist in state
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, songs: mappedSongs } : p
      )
    );
  };

  useEffect(() => {
    // Scroll to top whenever the view changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentView]);

  useEffect(() => {
    // reset notification dedupers when switching active playlist
    notifiedQueueRef.current = new Set();
    notifiedParticipantRef.current = new Set();
  }, [activePlaylistId]);

  const handleCreatePlaylist = async (
    playlistName: string,
    albumArt: string | null,
    settings: PlaylistSettings
  ) => {
    if (!currentUser) return;
    // 1) Create in DB
    const dbPlaylist = await createPlaylistInDb(playlistName, albumArt, currentUser.id);
    if (!dbPlaylist) {
      // could add a toast here later
      return;
    }

    // 2) Map DB row to your Playlist type
    const newPlaylist: Playlist = {
      id: dbPlaylist.id,
      name: dbPlaylist.name,
      albumArt: dbPlaylist.album_art,
      songs: [],
      isSessionActive: false,
      sessionCode: null,
      queue: [],
      hasJoinedSession: false,
      settings,
    };

    // 3) Update state
    setPlaylists((prev) => [...prev, newPlaylist]);
    setActivePlaylistId(newPlaylist.id);
    setCurrentView("playlist-view");
    setShowCreatePlaylist(false);

    // Session “created” notification (same behavior as before)
    const notificationId = Date.now().toString();
    setSessionNotification({
      id: notificationId,
      sessionCode: "",
      playlistName: newPlaylist.name,
      isCreated: true,
    });

    setTimeout(() => {
      setSessionNotification(null);
    }, 3000);
  };

  const handleAddSongs = async (songs: Song[]) => {
    if (activePlaylist && Array.isArray(songs)) {
      // 1) Save to Supabase
      await setSongsForPlaylist(activePlaylist.id, songs);

      // 2) Update local state
      const updatedPlaylist: Playlist = { ...activePlaylist, songs };
      setPlaylists((prev) =>
        prev.map((p) => (p.id === activePlaylist.id ? updatedPlaylist : p))
      );
    }
    setCurrentView("playlist-view");
  };

  // Add songs to an arbitrary playlist (used by search when choosing a target playlist)
  const addSongsToPlaylist = async (playlistId: string, songsToAdd: Song[]) => {
    if (!songsToAdd.length) return;

    // Get current songs for that playlist (from state, or fallback to fetch)
    let target = playlists.find(p => p.id === playlistId);
    if (!target) {
      const dbSongs = await fetchSongsForPlaylist(playlistId);
      target = {
        id: playlistId,
        name: "Playlist",
        albumArt: null,
        songs: dbSongs.map(s => ({
          id: s.song_id,
          title: s.title,
          artist: s.artist,
          album: s.album ?? "",
          albumArt: s.album_art ?? "",
        })),
        isSessionActive: false,
        sessionCode: null,
        queue: [],
        hasJoinedSession: false,
        settings: { ...defaultSettings },
      };
    }

    const mergedSongs = [...target.songs, ...songsToAdd];

    await setSongsForPlaylist(playlistId, mergedSongs);

    setPlaylists(prev =>
      prev.map(p => p.id === playlistId ? { ...p, songs: mergedSongs } : p)
    );
  };


  const handleAddToQueue = async (songs: Song[]) => {
    if (!activePlaylist || !Array.isArray(songs) || songs.length === 0) {
      setCurrentView("playlist-view");
      return;
    }

    // Block guests when group playlist is off
    const guestAllowed =
      !activePlaylist.hasJoinedSession ||
      activePlaylist.settings.isGroupPlaylist;
    if (!guestAllowed) {
      addNotification("Guest queuing is disabled for this session.", "info");
      setCurrentView("playlist-view");
      return;
    }

    // Check credits (joined session)
    const enforceCredits =
      activePlaylist.hasJoinedSession &&
      activePlaylist.settings.isGroupPlaylist &&
      !activePlaylist.settings.unlimitedQueuing;
    const creditLimit = parseInt(activePlaylist.settings.queuesPerHour, 10) || 0;
    const creditsAvailable = enforceCredits
      ? activePlaylist.creditsRemaining ?? creditLimit
      : Infinity;
    if (enforceCredits && creditsAvailable <= 0) {
      addNotification("You have no queues remaining", "info");
      setCurrentView("playlist-view");
      return;
    }

    // Limit songs to remaining credits for joined sessions
    let songsToAdd = songs;
    if (enforceCredits) {
      songsToAdd = songs.slice(0, creditsAvailable);
    }

    // If we're in a real session, sync to Supabase
    if (activePlaylist.isSessionActive && activePlaylist.sessionId) {
      const queuedByType: "host" | "user" =
        activePlaylist.hasJoinedSession ? "user" : "host";

      for (const song of songsToAdd) {
        await addSongToSessionQueue(
          activePlaylist.sessionId,
          {
            id: song.id,
            title: song.title,
            artist: song.artist,
            album: song.album,
            albumArt: song.albumArt,
          },
          { name: "You", type: queuedByType }
        );
      }
    }

    // Local queue update
    const queuedSongs: QueuedSong[] = songsToAdd.map((song) => ({
      ...song,
      queuedBy: { type: "user" as const, name: "You" },
    }));

    const wasQueueEmpty = activePlaylist.queue.length === 0;

    const updatedPlaylist: Playlist = {
      ...activePlaylist,
      queue: [...activePlaylist.queue, ...queuedSongs],
      creditsRemaining: enforceCredits
        ? Math.max(0, creditsAvailable - songsToAdd.length)
        : activePlaylist.creditsRemaining,
    };

    setPlaylists((prev) =>
      prev.map((p) => (p.id === activePlaylist.id ? updatedPlaylist : p))
    );

    songsToAdd.forEach((song) => {
      notifiedQueueRef.current.add(song.id);
    });

    songsToAdd.forEach((song) => {
      addNotification(`Queued "${song.title}" by ${song.artist}`, "info");
    });

    if (wasQueueEmpty && updatedPlaylist.queue.length > 0) {
      setCurrentSongIndex(0);
      setIsPlaying(true);
      setProgress(0);
    }

    setCurrentView("playlist-view");
  };


  const handleQuickAddToQueue = async (song: Song) => {
    if (!activePlaylist) return;

    // Block guests if group playlist is off
    const guestAllowed =
      !activePlaylist.hasJoinedSession ||
      activePlaylist.settings.isGroupPlaylist;
    if (!guestAllowed) {
      addNotification("Guest queuing is disabled for this session.", "info");
      return;
    }

    // Credits check
    const enforceCredits =
      activePlaylist.hasJoinedSession &&
      activePlaylist.settings.isGroupPlaylist &&
      !activePlaylist.settings.unlimitedQueuing;
    const creditLimit = parseInt(activePlaylist.settings.queuesPerHour, 10) || 0;
    const creditsAvailable = enforceCredits
      ? activePlaylist.creditsRemaining ?? creditLimit
      : Infinity;
    if (enforceCredits && creditsAvailable <= 0) {
      addNotification("You have no queues remaining", "info");
      return;
    }

    // If we're in a real session, sync to Supabase
    if (activePlaylist.isSessionActive && activePlaylist.sessionId) {
      const queuedByType: "host" | "user" =
        activePlaylist.hasJoinedSession ? "user" : "host";

      await addSongToSessionQueue(
        activePlaylist.sessionId,
        {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          albumArt: song.albumArt,
        },
        { name: "You", type: queuedByType }
      );
    }

    // Local queue update
    const queuedSong: QueuedSong = {
      ...song,
      queuedBy: { type: "user" as const, name: "You" },
    };

    const wasQueueEmpty = activePlaylist.queue.length === 0;

    const updatedPlaylist: Playlist = {
      ...activePlaylist,
      queue: [...activePlaylist.queue, queuedSong],
      creditsRemaining: enforceCredits
        ? Math.max(0, creditsAvailable - 1)
        : activePlaylist.creditsRemaining,
    };

    setPlaylists((prev) =>
      prev.map((p) => (p.id === activePlaylist.id ? updatedPlaylist : p))
    );

    notifiedQueueRef.current.add(song.id);
    addNotification(`Queued "${song.title}" by ${song.artist}`, "info");

    if (wasQueueEmpty && updatedPlaylist.queue.length > 0) {
      setCurrentSongIndex(0);
      setIsPlaying(true);
      setProgress(0);
    }
  };


  const navigateToAddSongs = () => {
    setPreviousView(currentView);
    setCurrentView("add-songs");
  };

  const handleSkip = async () => {
    if (!activePlaylist) return;

    if (activePlaylist.isSessionActive && activePlaylist.queue.length > 0) {
      const skippedSongId = activePlaylist.queue[0].id;

      if (currentSongIndex < activePlaylist.queue.length - 1) {
        setCurrentSongIndex(currentSongIndex + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentSongIndex(0);
      }

      const updatedQueue = activePlaylist.queue.slice(1);
      const updatedPlaylist: Playlist = {
        ...activePlaylist,
        queue: updatedQueue,
      };
      setPlaylists((prev) =>
        prev.map((p) => (p.id === activePlaylist.id ? updatedPlaylist : p))
      );
      setCurrentSongIndex(0);

      // 🔗 Also remove from Supabase queue
      if (activePlaylist.sessionId) {
        await removeSongFromSessionQueue(activePlaylist.sessionId, skippedSongId);
      }
    }
  };


  const navigateToAddToQueue = () => {
    setPreviousView(currentView);
    setCurrentView("add-to-queue");
  };

  const navigateToSession = () => {
    setCurrentView("session-setup");
  };

  const handleStartSession = async (sessionCode: string) => {
    if (!activePlaylist) return;

    // 1) Create session row in Supabase
    const session = await createSessionInDb(activePlaylist.id, sessionCode, activePlaylist.settings);
    if (!session) {
      addNotification("Could not start session. Please try again.", "info");
      return;
    }

    // 2) Add host as participant
    const participant = await addParticipantToSession(session.id, "You", "host");

    // 3) Update local playlist state
    const updatedPlaylist: Playlist = {
      ...activePlaylist,
      isSessionActive: true,
      sessionCode,
      sessionId: session.id,
      queue: [],
      hasJoinedSession: false,
      participantId: participant?.id ?? null,
      participants: [
        { id: participant?.id ?? "you", name: "You", type: "host" },
      ],
    };

    setPlaylists((prev) =>
      prev.map((p) => (p.id === activePlaylist.id ? updatedPlaylist : p))
    );

    setActivePlaylistId(activePlaylist.id);
    setIsPlaying(false);
    setCurrentSongIndex(0);
    setProgress(0);

    // 4) Show session notification like before
    const notificationId = Date.now().toString();
    setSessionNotification({
      id: notificationId,
      sessionCode,
      playlistName: activePlaylist.name,
    });

    setTimeout(() => {
      setSessionNotification(null);
    }, 3000);

    setCurrentView("playlist-view");
  };


  const handleUndoSession = () => {
    if (sessionNotification && activePlaylist) {
      // Stop the session
      const updatedPlaylist: Playlist = { 
        ...activePlaylist, 
        isSessionActive: false, 
        sessionCode: null,
        queue: []
      };
      setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
      
      // Remove notification
      setSessionNotification(null);
      
      // Stop playback
      setIsPlaying(false);
      setCurrentSongIndex(0);
      setProgress(0);
    }
  };

  const handleStopSession = () => {
    setShowStopConfirmation(true);
  };

  const confirmStopSession = async () => {
    if (activePlaylist) {
      // If *host* is ending the session, also clear the DB queue
      if (activePlaylist.isSessionActive && !activePlaylist.hasJoinedSession && activePlaylist.sessionId) {
        await clearSessionQueue(activePlaylist.sessionId);
        // Host clearing session participants is optional; keep host row
      }

      // If current user had joined a session, remove them from participants in DB
      if (activePlaylist.hasJoinedSession && activePlaylist.sessionId && activePlaylist.participantId) {
        try {
          await removeParticipantFromSession(activePlaylist.sessionId, activePlaylist.participantId);
        } catch (e) {
          console.error(e);
        }
      }

      const updatedPlaylist: Playlist = {
        ...activePlaylist,
        isSessionActive: false,
        sessionCode: null,
        queue: [],
      };
      setPlaylists((prev) =>
        prev.map((p) => (p.id === activePlaylist.id ? updatedPlaylist : p))
      );

      if (activePlaylist.hasJoinedSession) {
        setCurrentView("home");
        setActivePlaylistId(null);
      }
    }
    setShowStopConfirmation(false);
  };


  const handleQueueReorder = (newQueue: QueuedSong[]) => {
    if (activePlaylist) {
      const updatedPlaylist: Playlist = { 
        ...activePlaylist, 
        queue: newQueue 
      };
      setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!activePlaylist) return;

    // If host override is off, host cannot remove songs from queue
    if (!activePlaylist.hasJoinedSession && activePlaylist.isSessionActive && !activePlaylist.settings.hostOverride) {
      addNotification("Host override is off. You can't remove songs right now.", "info");
      return;
    }

    // If we're in a real session, also delete from Supabase
    if (activePlaylist.isSessionActive && activePlaylist.sessionId) {
      try {
        await removeSongFromSessionQueue(activePlaylist.sessionId, songId);
      } catch (e) {
        console.error(e);
      }
    }

    const removedSong = activePlaylist.queue.find((song) => song.id === songId);

    setPlaylists((prevPlaylists) =>
      prevPlaylists.map((p) => {
        if (p.id !== activePlaylist.id) return p;

        const updatedQueue = p.queue.filter((song) => song.id !== songId);

        if (currentSongIndex === 0 && isPlaying) {
          if (updatedQueue.length > 0) {
            setCurrentSongIndex(0);
            setProgress(0);
          } else {
            setIsPlaying(false);
            setCurrentSongIndex(0);
            setProgress(0);
          }
        }

        return {
          ...p,
          queue: updatedQueue,
        };
      })
    );

    if (removedSong) {
      addNotification(`You removed "${removedSong.title}" from queue`, "info");
    }
  };

  const handleJoinSession = async (code: string, displayName?: string) => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return;
    const name = displayName?.trim() || "Guest";

    // 1) Find the session by code
    const session = await fetchSessionByCode(trimmedCode);
    if (!session) {
      addNotification("Session not found or inactive", "info");
      return;
    }

    const sessionSettings = session.settings ? { ...defaultSettings, ...session.settings } : { ...defaultSettings };
    if ((sessionSettings.isPrivateSession ?? false) && (!currentUser || currentUser.id === "guest")) {
      addNotification("Private session: please log in to join.", "info");
      setShowLogin(true);
      return;
    }

    // 2) Add "You" as a participant
    const participant = await addParticipantToSession(session.id, name, "user");

    // 3) Fetch queue, participants, and playlist songs
    const [queueRows, participantRows, dbSongs] = await Promise.all([
      fetchSessionQueue(session.id),
      fetchSessionParticipants(session.id),
      fetchSongsForPlaylist(session.playlist_id),
    ]);

    // 4) Map DB → front-end types
    const mappedQueue: QueuedSong[] = queueRows.map((q) => ({
      id: q.song_id,
      title: q.title,
      artist: q.artist,
      album: q.album ?? "",
      albumArt: q.album_art ?? "",
      queuedBy: {
        type: q.queued_by_type === "host" ? "user" : "guest", // map into your narrow type
        name: q.queued_by_name,
      },
    }));

    const mappedSongs: Song[] = dbSongs.map((s) => ({
      id: s.song_id ?? s.title, // or however you want; you already have this mapping in your code
      title: s.title,
      artist: s.artist,
      album: s.album ?? "",
      albumArt: s.album_art ?? "",
    }));

    const mappedParticipants =
      participantRows.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.role,
      })) ?? [];

    const playlistRow = Array.isArray(session.playlists)
      ? session.playlists[0]
      : session.playlists;

    const playlistName = playlistRow?.name ?? "Session Playlist";
    const albumArt = playlistRow?.album_art ?? null;


    // 5) Put this into your playlists state
    setPlaylists((prev) => {
      const existing = prev.find((p) => p.id === session.playlist_id);
      const settings = session.settings
        ? { ...defaultSettings, ...session.settings }
        : existing?.settings ?? { ...defaultSettings, isGroupPlaylist: true };
      const creditLimit = parseInt(settings.queuesPerHour, 10) || 0;
      const updated: Playlist = {
        id: session.playlist_id,
        name: existing?.name ?? playlistName,
        albumArt: existing?.albumArt ?? albumArt,
        songs: mappedSongs,
        isSessionActive: true,
        sessionCode: trimmedCode,
        sessionId: session.id,
        queue: mappedQueue,
        hasJoinedSession: true,
        participantId: participant?.id ?? null,
        settings,
        participants: mappedParticipants,
        skipVotes: new Set(),
        creditsRemaining: settings.unlimitedQueuing ? undefined : (creditLimit || undefined),
        hasVotedToSkip: false,
      };

      if (existing) {
        return prev.map((p) => (p.id === session.playlist_id ? updated : p));
      }
      return [...prev, updated];
    });

    setActivePlaylistId(session.playlist_id);
    setCurrentView("playlist-view");

    // 6) Show "joined" notification like before
    const notificationId = Date.now().toString();
    setSessionNotification({
      id: notificationId,
      sessionCode: trimmedCode,
      playlistName,
      isJoined: true,
    });

    setTimeout(() => {
      setSessionNotification(null);
    }, 3000);
  };


  const handleVoteToSkip = () => {
    if (!activePlaylist || !activePlaylist.hasJoinedSession) return;
    
    // Don't allow voting again if already voted
    if (activePlaylist.hasVotedToSkip) return;
    
    const totalParticipants = activePlaylist.participants?.length || 1;
    const currentVotes = (activePlaylist.skipVotes?.size || 0) + 1; // +1 for current user's vote
    const requiredVotes = Math.ceil(totalParticipants * (parseInt(activePlaylist.settings.skipPercentage) / 100));
    
    // Mark that the user has voted
    setPlaylists(playlists.map(p => 
      p.id === activePlaylist.id 
        ? { ...p, hasVotedToSkip: true }
        : p
    ));
    
    // Show notification
    addNotification(`You voted to skip (${currentVotes}/${requiredVotes} needed)`, 'vote');
  };

  const handleSearchClick = () => {
    setPreviousView(currentView);
    setCurrentView("search");
  };

  const handleBack = () => {
    setCurrentView(
      currentView === "add-songs" ||
      currentView === "add-to-queue" ||
      currentView === "search"
        ? previousView
        : "home"
    );
  };

  const handlePlaySong = (songId: string) => {
    if (!activePlaylist || activePlaylist.isSessionActive) return;
    
    // Find the index of the clicked song
    const clickedIndex = activePlaylist.songs.findIndex(s => s.id === songId);
    if (clickedIndex === -1) return;
    
    // Queue all songs starting from the clicked song
    const songsToQueue = activePlaylist.songs.slice(clickedIndex);
    const queuedSongs: QueuedSong[] = songsToQueue.map(song => ({
      ...song,
      queuedBy: { type: 'user' as const, name: 'You' }
    }));
    
    // Update the playlist with the new queue
    const updatedPlaylist: Playlist = { 
      ...activePlaylist, 
      queue: queuedSongs
    };
    setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
    
    // Start playing from beginning of queue (which is the clicked song)
    setCurrentSongIndex(0);
    setIsPlaying(true);
    setProgress(0);
  };

  // For the global search view when launched from the dashboard header.
  const handleSearchAddSongs = (songs: Song[]) => {
    if (activePlaylist) {
      void handleAddSongs(songs);
    }
    // If no active playlist, just return to home after search
    setCurrentView("home");
  };

  const handleLogin = async (email: string, displayName: string) => {
    const user = await getOrCreateUser(email, displayName);
    if (user) {
      setCurrentUser({
        id: user.id,
        email: user.email ?? email,
        displayName: user.display_name ?? displayName,
      });
      setShowLogin(false);
    }
  };

  const handleRemovePlaylistSong = async (songId: string) => {
    if (!activePlaylist) return;
    
    const newSongs = activePlaylist.songs.filter(song => song.id !== songId);
    const updatedPlaylist: Playlist = { ...activePlaylist, songs: newSongs };

    // Persist to Supabase so the removal sticks across reloads
    await setSongsForPlaylist(activePlaylist.id, newSongs);

    setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
  };

  const handlePlaylistReorder = async (newSongs: Song[]) => {
    if (!activePlaylist) return;
    
    const updatedPlaylist: Playlist = {
      ...activePlaylist,
      songs: newSongs
    };

    await setSongsForPlaylist(activePlaylist.id, newSongs);
    setPlaylists(playlists.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
  };

  const resolveNavTab = () => {
    switch (currentView) {
      case "search":
        return "search";
      case "join-group":
        return "friends";
      case "playlists":
      case "playlist-view":
      case "add-songs":
      case "add-to-queue":
      case "session-setup":
        return "library";
      default:
        return "home";
    }
  };

  const handleBottomNavNavigate = (tab: string) => {
    switch (tab) {
      case "home":
        setCurrentView("home");
        break;
      case "search":
        setCurrentView("search");
        break;
      case "friends":
        setCurrentView("join-group");
        break;
      case "library":
        setCurrentView("playlists");
        break;
      default:
        setCurrentView("home");
    }
  };

  const renderContent = () => {
    if (currentView === "join-group") {
      return <JoinSession onJoinSession={handleJoinSession} />;
    } else if (currentView === "playlists") {
      return <MyPlaylists playlists={playlists} onPlaylistClick={handlePlaylistClick} />;
    } else if (currentView === "search") {
      return (
        <SearchSongs
          onAddSongs={handleSearchAddSongs}
          selectedSongs={[]}
          playlists={playlists.map(p => ({ id: p.id, name: p.name }))}
          onAddToSpecificPlaylist={(playlistId, songs) => {
            void addSongsToPlaylist(playlistId, songs);
            setCurrentView("home");
          }}
          mode="select"
          onQuickAdd={undefined}
        />
      );
    } else if (currentView === "session-setup" && activePlaylist) {
      return <SessionView 
        playlistName={activePlaylist.name}
        onStartSession={handleStartSession}
        onOpenSettings={() => setShowPlaylistSettings(true)}
      />;
    } else if (currentView === "playlist-view" && activePlaylist) {
      return <PlaylistView 
        playlistName={activePlaylist.name} 
        albumArt={activePlaylist.albumArt} 
        songs={activePlaylist.songs}
        onAddSongs={navigateToAddSongs}
        onOpenRecommendations={() => setShowRecommendations(true)}
        onAddToQueue={navigateToAddToQueue}
        isSessionActive={activePlaylist.isSessionActive}
        onStartSession={navigateToSession}
        onStopSession={handleStopSession}
        queue={activePlaylist.queue}
        hasJoinedSession={activePlaylist.hasJoinedSession}
        onQueueReorder={handleQueueReorder}
        onRemoveSong={handleRemoveSong}
        autoplayMode={activePlaylist.settings.autoplayMode}
        settings={activePlaylist.settings}
        sessionCode={activePlaylist.sessionCode}
        participants={activePlaylist.participants}
        notifications={activePlaylist.isSessionActive ? notifications : undefined}
        creditsRemaining={activePlaylist.creditsRemaining}
        onPlaySong={handlePlaySong}
        onRemovePlaylistSong={handleRemovePlaylistSong}
        onPlaylistReorder={handlePlaylistReorder}
      />;
    } else if (currentView === "add-songs" && activePlaylist) {
      return <SearchSongs 
        onAddSongs={handleAddSongs} 
        selectedSongs={activePlaylist.songs}
      />;
    } else if (currentView === "add-to-queue" && activePlaylist) {
      return <SearchSongs 
        onAddSongs={handleAddToQueue} 
        selectedSongs={activePlaylist.queue.map(q => q as Song)}
        mode="quick-add"
        onQuickAdd={handleQuickAddToQueue}
      />;
    } else {
      return <MainContent 
        onNavigate={setCurrentView} 
        isSessionActive={activePlaylist?.isSessionActive}
        playlistName={activePlaylist?.name}
        onCreateClick={() => setShowCreatePlaylist(true)}
        playlists={playlists}
        onPlaylistClick={handlePlaylistClick}
      />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {!currentUser && showLogin && (
        <LoginModal 
          onSubmit={handleLogin} 
          onContinueGuest={() => {
            setCurrentUser({
              id: "guest",
              email: "guest",
              displayName: "Guest",
            });
            setShowLogin(false);
          }}
        />
      )}
      {/* Header */}
      <Header 
        onSearchClick={handleSearchClick} 
        currentView={currentView} 
        onBack={handleBack}
        onPlusClick={() => setShowCreatePlaylist(true)}
        playlistTitle={activePlaylist?.name}
        isSessionActive={activePlaylist?.isSessionActive && currentView === "playlist-view"}
        onStopSession={handleStopSession}
        hasJoinedSession={activePlaylist?.hasJoinedSession}
        rightAction={
          currentUser ? (
            currentUser.id === "guest" ? (
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setShowLogin(true);
                }}
                className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                Login
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setPlaylists([]);
                  setActivePlaylistId(null);
                  setShowLogin(true);
                  setCurrentView("home");
                }}
                className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                Logout
              </button>
            )
          ) : undefined
        }
      />
      
      {/* Main Content Area */}
      <div key={currentView} className="flex-1 overflow-y-auto pb-40" ref={scrollContainerRef}>
        {renderContent()}
      </div>

      {/* Now Playing Bar - Hide on join session view */}
      {currentView !== "join-group" && (
        <NowPlaying 
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onSkip={handleSkip}
          currentSong={currentSong}
          progress={progress}
          showSkip={activePlaylist?.settings.hostOverride && !activePlaylist?.hasJoinedSession}
          voteToSkip={activePlaylist?.hasJoinedSession && activePlaylist?.settings.voteToSkip}
          onVoteSkip={handleVoteToSkip}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={resolveNavTab()}
        onNavigate={handleBottomNavNavigate}
      />
      
      {/* Create Playlist Overlay */}
      {showCreatePlaylist && (
        <CreatePlaylist 
          onCreatePlaylist={handleCreatePlaylist} 
          onClose={() => setShowCreatePlaylist(false)} 
        />
      )}

      {/* Playlist Settings Modal */}
      {showPlaylistSettings && activePlaylist && (
        <PlaylistSettings
          settings={activePlaylist.settings}
          onSave={handleUpdateSettings}
          onClose={() => setShowPlaylistSettings(false)}
        />
      )}

      {/* Recommendations Modal */}
      {showRecommendations && (
        <Recommendations 
          onClose={() => setShowRecommendations(false)} 
          onAddSong={(song) => handleAddSongs([song])}
          onQueueSong={handleQuickAddToQueue}
        />
      )}

      {/* Stop Session Confirmation Modal */}
      {showStopConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-xl mb-2">{activePlaylist?.hasJoinedSession ? 'Leave Session?' : 'End Session?'}</h3>
            <p className="text-white/60 mb-6">
              {activePlaylist?.hasJoinedSession 
                ? 'Are you sure you want to leave this session?' 
                : 'Are you sure you want to end this session? This will clear the queue and disconnect all participants.'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopConfirmation(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmStopSession}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-white hover:brightness-110 rounded-xl transition-all"
              >
                {activePlaylist?.hasJoinedSession ? 'Leave Session' : 'End Session'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Session Notification */}
      <div className="fixed top-58 left-6 right-6 flex flex-col gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {sessionNotification && (
            <motion.div
              key={sessionNotification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-r from-[#b1487a] to-[#c0504e] backdrop-blur-xl border border-[#b1487a]/70 rounded-xl px-5 py-3 shadow-2xl flex items-center justify-between gap-3 pointer-events-auto"
            >
              <p className="text-white flex-1 min-w-0">
                {sessionNotification.isCreated ? '🎉 Hooray! You created a new playlist!' : '🎉 Hooray! You ' + (sessionNotification.isJoined ? 'joined' : 'started') + ' a session!'}
              </p>
              <button
                onClick={handleUndoSession}
                className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
              >
                <Undo2 className="w-3 h-3 text-white" />
                <span className="text-white text-xs">Undo</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generic notifications (visible even outside sessions) */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto bg-zinc-900/90 border border-white/10 rounded-lg px-4 py-2 shadow-xl text-white text-sm"
            >
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}








