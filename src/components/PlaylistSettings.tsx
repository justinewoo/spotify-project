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
  const [autoplayExpanded, setAutoplayExpanded] = useState(false);
  const [autoplayMode, setAutoplayMode] = useState(initialSettings.autoplayMode);
  const [hostOverride, setHostOverride] = useState(initialSettings.hostOverride);
  const [voteToSkip, setVoteToSkip] = useState(initialSettings.voteToSkip);
  const [skipPercentage, setSkipPercentage] = useState(initialSettings.skipPercentage);

  // Check if any settings have changed
  const hasChanges = 
    isGroupPlaylist !== initialSettings.isGroupPlaylist ||
    unlimitedQueuing !== initialSettings.unlimitedQueuing ||
    queuesPerHour !== initialSettings.queuesPerHour ||
    autoplayMode !== initialSettings.autoplayMode ||
    hostOverride !== initialSettings.hostOverride ||
    voteToSkip !== initialSettings.voteToSkip ||
    skipPercentage !== initialSettings.skipPercentage;

  const handleSave = () => {
    onSave({
      isGroupPlaylist,
      unlimitedQueuing,
      queuesPerHour,
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
          <h2 className="text-white text-2xl">Playlist Settings</h2>
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    isGroupPlaylist ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      isGroupPlaylist ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Unlimited Queuing Toggle */}
              {isGroupPlaylist && (
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                  <span className="text-white text-lg">Unlimited Guest Queuing</span>
                  <button
                    onClick={() => setUnlimitedQueuing(!unlimitedQueuing)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      unlimitedQueuing ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        unlimitedQueuing ? 'translate-x-7' : 'translate-x-1'
                      }`}
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

              {/* Autoplay Settings */}
              <div className="relative border-b border-zinc-800">
                <button
                  onClick={() => setAutoplayExpanded(!autoplayExpanded)}
                  className="w-full flex items-center justify-between px-4 py-4 text-white text-lg"
                >
                  <span>Autoplay settings</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${autoplayExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                
                <AnimatePresence>
                  {autoplayExpanded && (
                    <>
                      {/* Backdrop mask without blur */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/30"
                        onClick={() => setAutoplayExpanded(false)}
                      />
                      
                      {/* Glassmorphic dropdown menu */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-full mt-2 z-[65] bg-zinc-900/80 backdrop-blur-xl rounded-xl overflow-hidden border border-zinc-700/50 shadow-2xl"
                      >
                        <div className="py-2">
                          <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="radio"
                                name="autoplay"
                                value="my-taste"
                                checked={autoplayMode === "my-taste"}
                                onChange={(e) => {
                                  setAutoplayMode(e.target.value);
                                  setAutoplayExpanded(false);
                                }}
                                className="appearance-none w-5 h-5 border-2 border-zinc-500 rounded-full cursor-pointer checked:border-0"
                              />
                              {autoplayMode === "my-taste" && (
                                <div className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 pointer-events-none" />
                              )}
                            </div>
                            <span className="text-white">Auto-Play based on my taste</span>
                          </label>
                          
                          {isGroupPlaylist && (
                            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="radio"
                                  name="autoplay"
                                  value="all-tastes"
                                  checked={autoplayMode === "all-tastes"}
                                  onChange={(e) => {
                                    setAutoplayMode(e.target.value);
                                    setAutoplayExpanded(false);
                                  }}
                                  className="appearance-none w-5 h-5 border-2 border-zinc-500 rounded-full cursor-pointer checked:border-0"
                                />
                                {autoplayMode === "all-tastes" && (
                                  <div className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 pointer-events-none" />
                                )}
                              </div>
                              <span className="text-white">Auto-Play based on all user's tastes</span>
                            </label>
                          )}
                          
                          <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="radio"
                                name="autoplay"
                                value="playlist"
                                checked={autoplayMode === "playlist"}
                                onChange={(e) => {
                                  setAutoplayMode(e.target.value);
                                  setAutoplayExpanded(false);
                                }}
                                className="appearance-none w-5 h-5 border-2 border-zinc-500 rounded-full cursor-pointer checked:border-0"
                              />
                              {autoplayMode === "playlist" && (
                                <div className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 pointer-events-none" />
                              )}
                            </div>
                            <span className="text-white">Auto-Play based on the playlist</span>
                          </label>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Host Override Toggle */}
              {isGroupPlaylist && (
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                  <span className="text-white text-lg">Host Override</span>
                  <button
                    onClick={() => setHostOverride(!hostOverride)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      hostOverride ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        hostOverride ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Vote to Skip Toggle */}
              {isGroupPlaylist && (
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                  <span className="text-white text-lg">Vote to Skip</span>
                  <button
                    onClick={() => setVoteToSkip(!voteToSkip)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      voteToSkip ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        voteToSkip ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Skip Percentage (only shown when Vote to Skip is ON) */}
              {isGroupPlaylist && voteToSkip && (
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-white text-lg">Skip percentage needed</span>
                  <div className="flex items-center bg-zinc-800 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      value={skipPercentage}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        // Prevent "00"
                        if (value === '00') return;
                        // Prevent 3-digit numbers starting with 0 (like "010", "020") but allow "100"
                        if (value.length === 3 && value.startsWith('0')) return;
                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
                          setSkipPercentage(value);
                        }
                      }}
                      className="w-12 bg-transparent text-white text-center focus:outline-none"
                      style={{ width: `${Math.max(skipPercentage.length, 1) * 0.6 + 0.5}rem` }}
                    />
                    <span className="text-white">%</span>
                  </div>
                </div>
              )}
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