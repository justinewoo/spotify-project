import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

interface PlaylistSettingsProps {
  settings: PlaylistSettings;
  onSave: (settings: PlaylistSettings) => void;
  onClose: () => void;
}

export function PlaylistSettings({ settings: initialSettings, onSave, onClose }: PlaylistSettingsProps) {
  const [isGroupPlaylist, setIsGroupPlaylist] = useState(initialSettings.isGroupPlaylist);
  const [unlimitedQueuing, setUnlimitedQueuing] = useState(initialSettings.unlimitedQueuing);
  const [queuesPerHour, setQueuesPerHour] = useState(initialSettings.queuesPerHour);
  const [autoplayMode] = useState(initialSettings.autoplayMode);
  const [hostOverride, setHostOverride] = useState(initialSettings.hostOverride);
  const [voteToSkip] = useState(initialSettings.voteToSkip);
  const [skipPercentage] = useState(initialSettings.skipPercentage);
  const [isPrivateSession, setIsPrivateSession] = useState(initialSettings.isPrivateSession ?? false);

  // Check if any settings have changed
  const hasChanges = 
    isGroupPlaylist !== initialSettings.isGroupPlaylist ||
    unlimitedQueuing !== initialSettings.unlimitedQueuing ||
    queuesPerHour !== initialSettings.queuesPerHour ||
    autoplayMode !== initialSettings.autoplayMode ||
    hostOverride !== initialSettings.hostOverride ||
    voteToSkip !== initialSettings.voteToSkip ||
    skipPercentage !== initialSettings.skipPercentage ||
    isPrivateSession !== (initialSettings.isPrivateSession ?? false);

  const handleSave = () => {
    onSave({
      isGroupPlaylist,
      unlimitedQueuing,
      queuesPerHour,
      isPrivateSession,
      autoplayMode,
      hostOverride,
      voteToSkip,
      skipPercentage
    });
  };

  return (
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
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-white text-2xl">Session Settings</h2>
          <button
            onClick={onClose}
            className="transition-transform hover:scale-110"
          >
            <X size={32} className="text-white" />
          </button>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center px-6 pb-24 overflow-y-auto">
          <div className="w-full max-w-md space-y-4">
            {/* Settings Group */}
            <div className="bg-zinc-900 rounded-xl overflow-visible">
              {/* Group Playlist Toggle */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                <span className="text-white text-lg">Group Playlist</span>
                <button
                  onClick={() => setIsGroupPlaylist(!isGroupPlaylist)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                    isGroupPlaylist ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className="absolute h-5 w-5 rounded-full bg-white shadow transition-all"
                    style={{ left: isGroupPlaylist ? 'calc(100% - 24px)' : '4px' }}
                  />
                </button>
              </div>

              {/* Session Privacy Toggle */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                <span className="text-white text-lg">Private Session (login required)</span>
                <button
                  onClick={() => setIsPrivateSession(!isPrivateSession)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                    isPrivateSession ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className="absolute h-5 w-5 rounded-full bg-white shadow transition-all"
                    style={{ left: isPrivateSession ? 'calc(100% - 24px)' : '4px' }}
                  />
                </button>
              </div>

              {/* Unlimited Queuing Toggle */}
              {isGroupPlaylist && (
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                  <span className="text-white text-lg">Unlimited Guest Queuing</span>
                  <button
                    onClick={() => setUnlimitedQueuing(!unlimitedQueuing)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                      unlimitedQueuing ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className="absolute h-5 w-5 rounded-full bg-white shadow transition-all"
                      style={{ left: unlimitedQueuing ? 'calc(100% - 24px)' : '4px' }}
                    />
                  </button>
                </div>
              )}

              {/* Queues per hour (if unlimited queuing is off) */}
              {isGroupPlaylist && !unlimitedQueuing && (
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                  <span className="text-white text-lg">Queues per hour</span>
                  <input
                    type="number"
                    value={queuesPerHour}
                    onChange={(e) => setQueuesPerHour(e.target.value)}
                    className="w-20 px-3 py-2 bg-zinc-800 text-white text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              )}

              {/* Host Override Toggle */}
              {isGroupPlaylist && (
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                  <span className="text-white text-lg">Host Override</span>
                  <button
                    onClick={() => setHostOverride(!hostOverride)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                      hostOverride ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className="absolute h-5 w-5 rounded-full bg-white shadow transition-all"
                      style={{ left: hostOverride ? 'calc(100% - 24px)' : '4px' }}
                    />
                  </button>
                </div>
              )}

              {/* Vote to Skip removed */}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`w-full max-w-md mt-8 py-4 text-xl rounded-lg transition-opacity ${
              hasChanges 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90' 
                : 'bg-zinc-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {hasChanges ? 'Save Changes' : 'Save Settings'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
