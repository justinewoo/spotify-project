// src/backend.ts
import { supabase } from "./supabaseClient";

export interface DbPlaylist {
  id: string;
  name: string;
  album_art: string | null;
  created_at?: string;
}

export interface DbSong {
  playlist_id: string;
  song_id: string;
  title: string;
  artist: string;
  album: string | null;
  album_art: string | null;
  position: number;
  created_at?: string;
}

export interface DbSession {
  id: string;
  code: string;
  playlist_id: string;
  is_active: boolean;
  settings?: any;
}

export interface DbSessionParticipant {
  id: string;
  session_id: string;
  name: string;
  role: "host" | "user" | "guest";
}

export interface DbSessionQueueItem {
  id: number;
  session_id: string;
  song_id: string;
  title: string;
  artist: string;
  album: string | null;
  album_art: string | null;
  queued_by_name: string;
  queued_by_type: "host" | "user" | "guest";
  position: number;
}

// Catalog songs (used for recommendations)
export interface DbCatalogSong {
  song_id: string;
  title: string;
  artist: string;
  album: string | null;
  album_art: string | null;
  energy: number;
  danceability: number;
  popularity: number;
  is_explicit: boolean;
  tags: string[] | null;
}


// Load all playlists
export async function fetchPlaylists(): Promise<DbPlaylist[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select("id, name, album_art, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching playlists:", error.message);
    return [];
  }

  return data ?? [];
}

// Create a playlist
export async function createPlaylistInDb(
  name: string,
  albumArt: string | null
): Promise<DbPlaylist | null> {
  const { data, error } = await supabase
    .from("playlists")
    .insert([{ name, album_art: albumArt }])
    .select("id, name, album_art, created_at")
    .single();

  if (error) {
    console.error("Error creating playlist:", error.message);
    return null;
  }

  return data;
}

// Get songs for a playlist
export async function fetchSongsForPlaylist(
  playlistId: string
): Promise<DbSong[]> {
  const { data, error } = await supabase
    .from("songs")
    .select(
      "playlist_id, song_id, title, artist, album, album_art, position, created_at"
    )
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true }); // use your position column

  if (error) {
    console.error("Error fetching songs:", error.message);
    return [];
  }

  return data ?? [];
}

export async function setSongsForPlaylist(
  playlistId: string,
  songs: {
    id: string;
    title: string;
    artist: string;
    album: string;
    albumArt: string;
  }[]
): Promise<void> {
  // Remove existing songs for this playlist
  const { error: delError } = await supabase
    .from("songs")
    .delete()
    .eq("playlist_id", playlistId);

  if (delError) {
    console.error("Error deleting old songs:", delError.message);
  }

  if (!songs.length) return;

  const rows = songs.map((s, index) => ({
    playlist_id: playlistId, // uuid from your playlists table
    song_id: s.id,           // 👈 use your Song.id here
    title: s.title,
    artist: s.artist,
    album: s.album,
    album_art: s.albumArt,
    position: index,         // 👈 use index for ordering
  }));

  const { error: insError } = await supabase.from("songs").insert(rows);

  if (insError) {
    console.error("Error inserting songs:", insError.message);
  }
}

export async function createSessionInDb(
  playlistId: string,
  code: string,
  settings?: any
): Promise<DbSession | null> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      playlist_id: playlistId,
      code,
      is_active: true,
      settings: settings ?? null,
    })
    .select("id, code, playlist_id, is_active, settings")
    .single();

  if (error) {
    console.error("Error creating session:", error.message);
    return null;
  }

  return data as DbSession;
}

export async function addParticipantToSession(
  sessionId: string,
  name: string,
  role: "host" | "user" | "guest"
): Promise<DbSessionParticipant | null> {
  const { data, error } = await supabase
    .from("session_participants")
    .insert({
      session_id: sessionId,
      name,
      role,
    })
    .select("id, session_id, name, role")
    .single();

  if (error) {
    console.error("Error adding participant:", error.message);
    return null;
  }

  return data as DbSessionParticipant;
}

export interface DbSessionWithPlaylist extends DbSession {
  playlists?:
    | {
        name: string;
        album_art: string | null;
      }[]
    | null;
  settings?: any;
}


export async function fetchSessionByCode(
  code: string
): Promise<DbSessionWithPlaylist | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, code, playlist_id, is_active, settings, playlists(name, album_art)"
    )
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching session by code:", error.message);
    return null;
  }

  return data as DbSessionWithPlaylist;
}


export async function fetchSessionQueue(
  sessionId: string
): Promise<DbSessionQueueItem[]> {
  const { data, error } = await supabase
    .from("session_queue")
    .select(
      "id, session_id, song_id, title, artist, album, album_art, queued_by_name, queued_by_type, position"
    )
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching session queue:", error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchSessionSettings(
  sessionId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("settings")
    .eq("id", sessionId)
    .single();

  if (error) {
    console.error("Error fetching session settings:", error.message);
    return null;
  }

  return data?.settings ?? null;
}

export async function fetchSessionParticipants(
  sessionId: string
): Promise<DbSessionParticipant[]> {
  const { data, error } = await supabase
    .from("session_participants")
    .select("id, session_id, name, role")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching participants:", error.message);
    return [];
  }

  return data ?? [];
}

export async function addSongToSessionQueue(
  sessionId: string,
  song: {
    id: string;
    title: string;
    artist: string;
    album: string;
    albumArt: string;
  },
  queuedBy: { name: string; type: "host" | "user" | "guest" }
): Promise<void> {
  // Get current max position
  const { data: maxData, error: maxError } = await supabase
    .from("session_queue")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError && maxError.code !== "PGRST116") {
    // ignore "No rows" error
    console.error("Error getting current max position:", maxError.message);
  }

  const nextPos = maxData?.position != null ? maxData.position + 1 : 0;

  const { error } = await supabase.from("session_queue").insert({
    session_id: sessionId,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    album_art: song.albumArt,
    queued_by_name: queuedBy.name,
    queued_by_type: queuedBy.type,
    position: nextPos,
  });

  if (error) {
    console.error("Error adding song to session queue:", error.message);
  }
}

export async function clearSessionQueue(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("session_queue")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    console.error("Error clearing session queue:", error.message);
  }
}

export async function removeSongFromSessionQueue(
  sessionId: string,
  songId: string
) {
  const { error } = await supabase
    .from("session_queue") // <-- use same table name as fetchSessionQueue
    .delete()
    .eq("session_id", sessionId)
    .eq("song_id", songId);

  if (error) {
    console.error("Error removing song from session queue", error);
    throw error;
  }
}

export async function removeParticipantFromSession(
  sessionId: string,
  participantId: string
): Promise<void> {
  const { error } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", sessionId)
    .eq("id", participantId);

  if (error) {
    console.error("Error removing participant from session", error.message);
    throw error;
  }
}

export async function updateSessionSettings(
  sessionId: string,
  settings: any
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ settings })
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating session settings:", error.message);
  }
}

// Catalog helpers
export async function fetchCatalogSongs(): Promise<DbCatalogSong[]> {
  const { data, error } = await supabase
    .from("catalog_songs")
    .select(
      "song_id, title, artist, album, album_art, energy, danceability, popularity, is_explicit, tags"
    );

  if (error) {
    console.error("Error fetching catalog songs:", error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchRecommendedSongs(params: {
  energy?: number;
  danceability?: number;
  popularity?: number;
  blockExplicit?: boolean;
  blockedArtists?: string[];
  includeTags?: string[];
  limit?: number;
}): Promise<DbCatalogSong[]> {
  // Build simple slider windows: ±15 points around chosen value, clamped 0-100.
  const window = 15;
  const range = (v?: number) =>
    v == null
      ? undefined
      : {
          min: Math.max(0, v - window),
          max: Math.min(100, v + window),
        };

  const energyRange = range(params.energy);
  const danceRange = range(params.danceability);
  const popRange = range(params.popularity);

  let query = supabase
    .from("catalog_songs")
    .select(
      "song_id, title, artist, album, album_art, energy, danceability, popularity, is_explicit, tags"
    )
    .limit(params.limit ?? 25);

  if (energyRange) {
    query = query.gte("energy", energyRange.min).lte("energy", energyRange.max);
  }
  if (danceRange) {
    query = query
      .gte("danceability", danceRange.min)
      .lte("danceability", danceRange.max);
  }
  if (popRange) {
    query = query
      .gte("popularity", popRange.min)
      .lte("popularity", popRange.max);
  }

  if (params.blockExplicit) {
    query = query.eq("is_explicit", false);
  }

  if (params.blockedArtists?.length) {
    query = query.not("artist", "in", `(${params.blockedArtists.map(a => `"${a.replace(/"/g, '""')}"`).join(",")})`);
  }

  if (params.includeTags?.length) {
    // Requires GIN index on tags for performance
    query = query.contains("tags", params.includeTags);
  }

  query = query.order("popularity", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recommended songs:", error.message);
    throw error;
  }

  return data ?? [];
}
