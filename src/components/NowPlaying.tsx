import { Play, Pause, SkipForward } from "lucide-react";
import { motion } from "motion/react";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface NowPlayingProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkip?: () => void;
  currentSong: Song | null;
  progress: number;
  showSkip?: boolean;
  voteToSkip?: boolean;
  onVoteSkip?: () => void;
}

export function NowPlaying({ isPlaying, onPlayPause, onSkip, currentSong, progress, showSkip, voteToSkip, onVoteSkip }: NowPlayingProps) {
  // Show "No song playing" if no song is selected
  const displaySong = currentSong || {
    title: "No Song Playing",
    artist: "",
    albumArt: ""
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-black p-3 shadow-lg border-[3px] border-[#6343b8] rounded-xl z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center gap-3">
          {/* Album Art */}
          {displaySong.albumArt ? (
            <img 
              src={displaySong.albumArt} 
              alt={displaySong.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#9141a9]/30 to-[#c0504e]/30"></div>
          )}

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h3 className={`truncate text-lg ${currentSong ? 'text-white' : 'text-white/45'}`}>{displaySong.title}</h3>
            {displaySong.artist && (
              <p className={`text-xs ${currentSong ? 'text-gray-300' : 'text-gray-300/45'}`}>{displaySong.artist}</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onPlayPause}
              className="text-white hover:scale-110 transition-transform bg-white/10 rounded-full p-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={!currentSong}
            >
              {isPlaying ? (
                <Pause size={24} fill="white" />
              ) : (
                <Play size={24} fill="white" />
              )}
            </button>
            {onSkip && showSkip && (
              <button 
                onClick={onSkip}
                className="text-white hover:scale-110 transition-transform bg-white/10 rounded-full p-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!currentSong}
              >
                <SkipForward size={24} />
              </button>
            )}
            {onVoteSkip && voteToSkip && (
              <button 
                onClick={onVoteSkip}
                className="text-white hover:scale-110 transition-transform bg-white/10 rounded-full p-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!currentSong}
              >
                <SkipForward size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-600 h-0.5 rounded-full mt-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-[#9141a9] to-[#c0504e] h-0.5 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}