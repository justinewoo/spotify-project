import { Search, Plus, Wifi, Battery, Signal, BellOff, ArrowLeft, Filter } from "lucide-react";

interface HeaderProps {
  onSearchClick: () => void;
  currentView: string;
  onBack: () => void;
  onPlusClick: () => void;
  playlistTitle?: string;
  isSessionActive?: boolean;
  onStopSession?: () => void;
  onStartSession?: () => void;
  hasJoinedSession?: boolean;
}

export function Header({ onSearchClick, currentView, onBack, onPlusClick, playlistTitle, isSessionActive, onStopSession, onStartSession, hasJoinedSession }: HeaderProps) {
  const getTitle = () => {
    if (currentView === "playlist-view" && playlistTitle) {
      return playlistTitle;
    }
    
    // Show playlist title in add-to-queue view
    if (currentView === "add-to-queue" && playlistTitle) {
      return playlistTitle;
    }
    
    switch (currentView) {
      case "home":
        return "Groupie";
      case "search":
        return "Search";
      case "songs":
        return "Songs";
      case "artists":
        return "Artists";
      case "albums":
        return "Albums";
      case "genres":
        return "Genres";
      case "moods":
        return "Moods";
      case "playlists":
        return "Playlists";
      case "friends":
        return "Friends";
      case "recentlyPlayed":
        return "Recently Played";
      case "recentlyAdded":
        return "Recently Added";
      case "mostPlayed":
        return "Most Played";
      default:
        return "Groupie";
    }
  };

  return (
    <div className="sticky top-0 bg-black z-10">
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 pt-3 pb-2 text-sm bg-black z-[100]">
        <div className="flex items-center gap-1">
          <span>9:29</span>
          <BellOff size={16} />
        </div>
        <div className="flex items-center gap-2">
          <Signal size={16} />
          <Wifi size={16} />
          <Battery size={20} />
        </div>
      </div>

      {/* Spacer for fixed status bar */}
      <div className="h-[38px]" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 pb-8">
        <div className="flex items-center gap-3">
          {currentView !== "home" && onBack && (
            <button onClick={onBack} className="hover:scale-110 transition-transform">
              <ArrowLeft size={28} className="text-white" />
            </button>
          )}
          <h1 className={`${currentView === "home" ? "text-xl" : "text-xl"} font-bold text-white`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif" }}>
            {getTitle()}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {/* Show End Session button when session is active in playlist view */}
          {/* Show Start Session button when in playlist view and session is not active */}
          {/* Show Filter in add-to-queue view */}
          
          {isSessionActive && onStopSession ? (
            <button
              onClick={onStopSession}
              className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-xl border border-red-500/30 text-white rounded-lg hover:brightness-110 transition-all shadow-lg"
            >
              {hasJoinedSession ? 'Leave Session' : 'End Session'}
            </button>
          ) : (
            <>
              {currentView !== "playlist-view" && currentView !== "home" && currentView !== "join-group" && currentView !== "session-setup" && (
                <button onClick={onSearchClick} className="hover:scale-110 transition-transform">
                  <Search size={28} className="bg-gradient-to-br from-[#852654] to-[#6343b8] bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                </button>
              )}
              {/* Plus button removed per request */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
