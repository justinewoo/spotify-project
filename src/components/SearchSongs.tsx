import { useState } from "react";
import { Search, Plus, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
}

interface SearchSongsProps {
  onAddSongs: (songs: Song[]) => void;
  selectedSongs: Song[];
  mode?: 'select' | 'quick-add';
  onQuickAdd?: (song: Song) => void;
}

interface AddedNotification {
  id: string;
  song: Song;
}

// Mock popular songs
const popularSongs: Song[] = [
  { id: "1", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", albumArt: "https://picsum.photos/seed/afterhours/200" },
  { id: "2", title: "Save Your Tears", artist: "The Weeknd", album: "After Hours", albumArt: "https://picsum.photos/seed/afterhours/200" },
  { id: "3", title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", albumArt: "https://picsum.photos/seed/futurenostalgia/200" },
  { id: "4", title: "Don't Start Now", artist: "Dua Lipa", album: "Future Nostalgia", albumArt: "https://picsum.photos/seed/futurenostalgia/200" },
  { id: "5", title: "Peaches", artist: "Justin Bieber", album: "Justice", albumArt: "https://picsum.photos/seed/justice/200" },
  { id: "6", title: "Good 4 U", artist: "Olivia Rodrigo", album: "SOUR", albumArt: "https://picsum.photos/seed/sour/200" },
  { id: "7", title: "Positions", artist: "Ariana Grande", album: "Positions", albumArt: "https://picsum.photos/seed/positions/200" },
  { id: "8", title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", albumArt: "https://picsum.photos/seed/fineline/200" },
  { id: "9", title: "Circles", artist: "Post Malone", album: "Hollywood's Bleeding", albumArt: "https://picsum.photos/seed/hollywoodsbleeding/200" },
  { id: "10", title: "Savage Love", artist: "Jawsh 685 & Jason Derulo", album: "Savage Love", albumArt: "https://picsum.photos/seed/savagelove/200" },
];

// Mock search results (in real app, this would call an API)
const allSongs: Song[] = [
  ...popularSongs,
  { id: "11", title: "Thriller", artist: "Michael Jackson", album: "Thriller", albumArt: "https://picsum.photos/seed/thriller/200" },
  { id: "12", title: "Billie Jean", artist: "Michael Jackson", album: "Thriller", albumArt: "https://picsum.photos/seed/thriller/200" },
  { id: "13", title: "Beat It", artist: "Michael Jackson", album: "Thriller", albumArt: "https://picsum.photos/seed/thriller/200" },
  { id: "14", title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", albumArt: "https://picsum.photos/seed/queennight/200" },
  { id: "15", title: "Hotel California", artist: "Eagles", album: "Hotel California", albumArt: "https://picsum.photos/seed/hotelcalifornia/200" },
  { id: "16", title: "Smells Like Teen Spirit", artist: "Nirvana", album: "Nevermind", albumArt: "https://picsum.photos/seed/nevermind/200" },
  { id: "17", title: "Shape of You", artist: "Ed Sheeran", album: "÷", albumArt: "https://picsum.photos/seed/divide/200" },
  { id: "18", title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", album: "Uptown Special", albumArt: "https://picsum.photos/seed/uptownspecial/200" },
];

export function SearchSongs({ onAddSongs, selectedSongs, mode = 'select', onQuickAdd }: SearchSongsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedSongs, setLocalSelectedSongs] = useState<Song[]>(selectedSongs);
  const [addedNotifications, setAddedNotifications] = useState<AddedNotification[]>([]);
  const [removedSongIds, setRemovedSongIds] = useState<Set<string>>(new Set());

  const displayedSongs = (searchQuery.trim() === ""
    ? popularSongs
    : allSongs.filter(song => 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.album.toLowerCase().includes(searchQuery.toLowerCase())
      )).filter(song => !removedSongIds.has(song.id));

  const toggleSongSelection = (song: Song) => {
    if (mode === 'quick-add' && onQuickAdd) {
      onQuickAdd(song);
      
      // Remove song from list
      setRemovedSongIds(prev => new Set(prev).add(song.id));
      
      // Add notification
      const notificationId = `${song.id}-${Date.now()}`;
      setAddedNotifications(prev => [...prev, { id: notificationId, song }]);
      
      // Auto-remove notification after 1 second
      setTimeout(() => {
        setAddedNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 1000);
      
      return;
    }
    
    setLocalSelectedSongs(prev => {
      const isSelected = prev.some(s => s.id === song.id);
      if (isSelected) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const isSongSelected = (songId: string) => {
    return localSelectedSongs.some(s => s.id === songId);
  };

  const handleDone = () => {
    onAddSongs(localSelectedSongs);
  };

  const handleUndo = (notification: AddedNotification) => {
    // Remove the song from removed list to show it again
    setRemovedSongIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(notification.song.id);
      return newSet;
    });
    
    // Remove the notification
    setAddedNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // TODO: We'll need to also remove it from the queue - this will require a callback
  };

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-[#6343b8]"
          />
        </div>
      </div>

      {/* Selected Count and Done Button - Only in select mode */}
      {mode === 'select' && localSelectedSongs.length > 0 && (
        <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-[#6343b8]/20 to-[#9141a9]/20 border border-[#6343b8]/30 rounded-lg px-4 py-3">
          <span className="text-white">
            {localSelectedSongs.length} song{localSelectedSongs.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white rounded-lg hover:brightness-110 transition-all"
          >
            Done
          </button>
        </div>
      )}

      {/* Section Header */}
      <h2 className="text-white text-xl mb-4">
        {searchQuery.trim() === "" ? "Popular Songs" : `Search Results (${displayedSongs.length})`}
      </h2>

      {/* Songs List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayedSongs.map(song => (
            <motion.div
              key={song.id}
              initial={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`p-4 rounded-lg transition-all overflow-hidden ${
                mode === 'quick-add' 
                  ? 'bg-gray-900 hover:bg-gray-800 border border-transparent'
                  : isSongSelected(song.id)
                    ? 'bg-gradient-to-r from-[#6343b8]/30 to-[#9141a9]/30 border border-[#6343b8]'
                    : 'bg-gray-900 hover:bg-gray-800 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <img 
                    src={song.albumArt} 
                    alt={song.album}
                    className="w-12 h-12 rounded object-cover bg-gray-800"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23374151"/%3E%3C/svg%3E';
                    }}
                  />
                  <div>
                    <h3 className="text-white">{song.title}</h3>
                    <p className="text-gray-400 text-sm">{song.artist} • {song.album}</p>
                  </div>
                </div>
                
                {mode === 'quick-add' ? (
                  <button
                    onClick={() => toggleSongSelection(song)}
                    className="flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    <Plus className="w-7 h-7 text-[#6343b8]" />
                  </button>
                ) : (
                  <div 
                    onClick={() => toggleSongSelection(song)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                      isSongSelected(song.id)
                        ? 'border-[#6343b8] bg-[#6343b8]'
                        : 'border-gray-600'
                    }`}
                  >
                    {isSongSelected(song.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {displayedSongs.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          No songs found. Try a different search term.
        </div>
      )}

      {/* Added Notifications */}
      <div className="fixed top-64 left-6 right-6 flex flex-col gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {addedNotifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-r from-[#6343b8]/90 to-[#9141a9]/90 backdrop-blur-xl border border-[#6343b8]/50 rounded-xl p-3 shadow-2xl flex items-center justify-between gap-4 pointer-events-auto"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img 
                  src={notification.song.albumArt} 
                  alt={notification.song.album}
                  className="w-10 h-10 rounded object-cover bg-gray-800 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23374151"/%3E%3C/svg%3E';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{notification.song.title}</p>
                  <p className="text-white/70 text-xs truncate">{notification.song.artist}</p>
                </div>
              </div>
              <button
                onClick={() => handleUndo(notification)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
              >
                <Undo2 className="w-4 h-4 text-white" />
                <span className="text-white text-xs">Undo</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}