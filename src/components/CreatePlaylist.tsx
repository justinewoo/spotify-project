import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CreatePlaylistProps {
  onCreatePlaylist: (playlistName: string, formData1: string, formData2: string, albumArt: string | null, settings: {
    isGroupPlaylist: boolean;
    unlimitedQueuing: boolean;
    queuesPerHour: string;
    autoplayMode: string;
    hostOverride: boolean;
    voteToSkip: boolean;
    skipPercentage: string;
  }) => void;
  onClose?: () => void;
}

export function CreatePlaylist({ onCreatePlaylist, onClose }: CreatePlaylistProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  
  // Settings state - all playlists are group playlists now
  const [unlimitedQueuing, setUnlimitedQueuing] = useState(true);
  const [queuesPerHour, setQueuesPerHour] = useState("3");
  const [autoplayExpanded, setAutoplayExpanded] = useState(false);
  const [autoplayMode, setAutoplayMode] = useState("playlist");
  const [hostOverride, setHostOverride] = useState(true);
  const [voteToSkip, setVoteToSkip] = useState(false);
  const [skipPercentage, setSkipPercentage] = useState("50");

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 400);
  };

  const handleCreate = () => {
    console.log("Creating playlist:", playlistName);
    setIsVisible(false);
    setTimeout(() => {
      onCreatePlaylist(playlistName, "", "", null, {
        isGroupPlaylist: true, // Always true now
        unlimitedQueuing,
        queuesPerHour,
        autoplayMode,
        hostOverride,
        voteToSkip,
        skipPercentage,
      });
    }, 400);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Animated Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[52px] left-0 right-0 bottom-0 z-50 bg-black"
          />

          {/* Sliding Content */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 35,
              stiffness: 400,
            }}
            className="fixed top-[52px] left-0 right-0 bottom-0 z-[55] bg-black pointer-events-auto flex flex-col"
          >
            {/* Header with X button */}
            <div className="flex justify-end px-6 py-4">
              <button
                onClick={handleClose}
                className="transition-transform hover:scale-110"
              >
                <X size={32} className="text-white" />
              </button>
            </div>

            {/* Main Content - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
              <h2 className="text-white text-3xl mb-8">Name Your Playlist</h2>
              
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                autoFocus
                className="w-full max-w-md px-6 py-4 bg-zinc-800 text-white text-xl rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                onClick={handleCreate}
                disabled={!playlistName.trim()}
                className={`w-full max-w-md mt-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl rounded-lg transition-opacity ${
                  !playlistName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}
              >
                Create
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}