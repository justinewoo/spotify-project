import { Play, Music, Mic, Disc, Heart, Clock, Calendar, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MainContentProps {
  onNavigate: (view: string) => void;
  isSessionActive?: boolean;
  playlistName?: string;
  onCreateClick?: () => void;
  playlists: Array<{
    id: string;
    name: string;
    albumArt: string | null;
    songs: Array<any>;
  }>;
  onPlaylistClick: (playlistId: string) => void;
}

export function MainContent({ onNavigate, isSessionActive, playlistName, onCreateClick, playlists, onPlaylistClick }: MainContentProps) {
  const topOptions = [
    { id: 1, label: "Create", color: "from-[#b1487a] to-[#c0504e]", view: "create-group", useCallback: true },
    { id: 2, label: "Join a session", color: "from-[#6343b8] to-[#9141a9]", view: "join-group", useCallback: false },
  ];

  const sortOptions = [
    { id: 3, label: "Liked Songs", color: "from-[#9141a9] to-[#b1487a]", view: "songs" },
    { id: 4, label: "My Playlists", color: "from-[#6343b8] to-[#852654]", view: "playlists" },
    { id: 5, label: "Favorite Artists", color: "from-[#852654] to-[#9141a9]", view: "artists" },
    { id: 6, label: "Genres", color: "from-[#c0504e] to-[#b1487a]", view: "genres" },
    { id: 7, label: "Moods", color: "from-[#b1487a] to-[#852654]", view: "moods" },
    { id: 8, label: "Albums", color: "from-[#6343b8] to-[#9141a9]", view: "albums" },
    { id: 9, label: "Friends", color: "from-[#9141a9] to-[#c0504e]", view: "friends" },
    { id: 10, label: "Settings", color: "from-[#852654] to-[#6343b8]", view: "settings" },
  ];

  return (
    <div className="p-6 pt-2 pb-8">
      {/* Active Session Shortcut - Only show when session is active */}
      {isSessionActive && playlistName && (
        <div className="mb-6">
          <button
            onClick={() => onNavigate("playlist-view")}
            className="w-full p-4 bg-gradient-to-r from-[#6343b8] to-[#9141a9] rounded-lg hover:brightness-110 transition-all flex items-center justify-between"
          >
            <div className="flex flex-col items-start">
              <span className="text-white text-sm opacity-80">Active Session</span>
              <span className="text-white font-bold">{playlistName}</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-md">
              <span className="text-white text-sm">Go to Queue</span>
            </div>
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {topOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              if (option.useCallback && onCreateClick) {
                onCreateClick();
              } else {
                onNavigate(option.view);
              }
            }}
            className={`aspect-square bg-gradient-to-br ${option.color} flex items-center justify-center hover:brightness-110 transition-all rounded-lg p-4`}
          >
            <span className="text-center text-white text-2xl whitespace-normal">{option.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortOptions.map((option) => {
          return (
            <button
              key={option.id}
              onClick={() => onNavigate(option.view)}
              className={`aspect-square bg-gradient-to-br ${option.color} flex items-center justify-center hover:brightness-110 transition-all rounded-lg p-4`}
            >
              <span className="text-center text-white text-2xl">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}