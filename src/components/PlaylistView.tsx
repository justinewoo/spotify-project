import { Play, User, UserCircle, Plus, X, Users, Music, ThumbsUp, Crown, UserPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
};

interface QueuedSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
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
}

interface PlaylistViewProps {
  playlistName: string;
  albumArt: string | null;
  songs: Song[];
  onAddSongs: () => void;
  onOpenRecommendations?: () => void;
  onAddToQueue: () => void;
  isSessionActive: boolean;
  onStartSession: () => void;
  onStopSession: () => void;
  queue: QueuedSong[];
  hasJoinedSession: boolean;
  onQueueReorder: (newQueue: QueuedSong[]) => void;
  onRemoveSong?: (songId: string) => void;
  autoplayMode: string;
  sessionCode?: string | null;
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
  creditsRemaining?: number;
  settings: PlaylistSettings;
  onPlaySong?: (songId: string) => void;
  onRemovePlaylistSong?: (songId: string) => void;
  onPlaylistReorder?: (newQueue: Song[]) => void;
}

function SortableQueueItem({ song, hasJoinedSession, canRemove, onRemove }: { song: QueuedSong; hasJoinedSession: boolean; canRemove: boolean; onRemove?: (songId: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onRemove) {
      onRemove(song.id);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative p-4 bg-gradient-to-r from-[#6343b8]/20 to-[#9141a9]/20 border border-[#6343b8]/30 rounded-lg"
    >
      <div className="flex items-center gap-4" {...listeners}>
        <img 
          src={song.albumArt} 
          alt={song.album}
          className="w-12 h-12 rounded object-cover bg-gray-800"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=\\\"http://www.w3.org/2000/svg\\\" width=\\\"48\\\" height=\\\"48\\\"%3E%3Crect width=\\\"48\\\" height=\\\"48\\\" fill=\\\"%23374151\\\"/%3E%3C/svg%3E';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-white truncate">{song.title}</h3>
          <p className="text-gray-400 text-sm truncate">{song.artist}</p>
        </div>
      </div>
      {!hasJoinedSession && canRemove && onRemove && (
        <button 
          onClick={handleRemove}
          className="absolute top-3 right-3 p-2 hover:bg-red-500/20 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-red-400" />
        </button>
      )}
    </div>
  );
}

function SortablePlaylistItem({ 
  song, 
  index, 
  onRemove, 
  onPlay 
}: { 
  song: Song; 
  index: number; 
  onRemove?: (songId: string) => void;
  onPlay?: (songId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onRemove) {
      onRemove(song.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't play if clicking on drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    if (onPlay) {
      onPlay(song.id);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-3 py-2 px-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className="text-gray-400 text-sm min-w-[20px] cursor-grab active:cursor-grabbing" 
        {...listeners}
        data-drag-handle
      >
        {index + 1}
      </div>
      <img 
        src={song.albumArt} 
        alt={song.album}
        className="w-10 h-10 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-sm truncate">{song.title}</h3>
        <p className="text-gray-400 text-xs truncate">{song.artist}</p>
      </div>
      {onRemove && (
        <button 
          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors z-10"
          onClick={handleRemove}
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      )}
    </div>
  );
}

export function PlaylistView({
  playlistName,
  albumArt,
  songs,
  onAddSongs,
  onOpenRecommendations,
  onAddToQueue,
  isSessionActive,
  onStartSession,
  onStopSession,
  queue,
  hasJoinedSession,
  onQueueReorder,
  onRemoveSong,
  autoplayMode,
  sessionCode,
  participants,
  notifications,
  creditsRemaining,
  settings,
  onPlaySong,
  onRemovePlaylistSong,
  onPlaylistReorder
}: PlaylistViewProps) {
  const [localQueue, setLocalQueue] = useState(queue);
  const [localSongs, setLocalSongs] = useState(songs);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localQueue.findIndex(item => item.id === active.id);
      const newIndex = localQueue.findIndex(item => item.id === over.id);
      const newQueue = arrayMove(localQueue, oldIndex, newIndex);
      setLocalQueue(newQueue);
      onQueueReorder(newQueue);
    }
  };

  const handlePlaylistDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localSongs.findIndex(item => item.id === active.id);
      const newIndex = localSongs.findIndex(item => item.id === over.id);
      const newSongs = arrayMove(localSongs, oldIndex, newIndex);
      setLocalSongs(newSongs);
      if (onPlaylistReorder) {
        onPlaylistReorder(newSongs);
      }
    }
  };

  const handleRemoveSong = (songId: string) => {
    // Update local queue immediately for instant UI feedback
    setLocalQueue(prev => prev.filter(song => song.id !== songId));
    // Also call parent's remove handler
    if (onRemoveSong) {
      onRemoveSong(songId);
    }
  };

  const handleRemovePlaylistSong = (songId: string) => {
    // Update local songs immediately for instant UI feedback
    setLocalSongs(prev => prev.filter(song => song.id !== songId));
    // Also call parent's remove handler
    if (onRemovePlaylistSong) {
      onRemovePlaylistSong(songId);
    }
  };

  // Update local queue when prop changes
  useEffect(() => {
    setLocalQueue(queue);
  }, [queue]);

  // Update local songs when prop changes
  useEffect(() => {
    setLocalSongs(songs);
  }, [songs]);

  const getAutoplayText = () => {
    switch (autoplayMode) {
      case 'my-taste':
        return 'Autoplay: My Taste';
      case 'all-tastes':
        return 'Autoplay: All User\'s Tastes';
      case 'playlist':
        return 'Autoplay: Playlist';
      default:
        return 'Autoplay';
    }
  };

  return (
    <div>
      {/* Album Art Section - Only show if albumArt exists */}
      {albumArt && (
        <div className="flex justify-center pt-8 pb-8">
          <div className="w-48 h-48 rounded-lg overflow-hidden shadow-2xl">
            <img src={albumArt} alt={playlistName} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Sticky Participants and Session Code Section */}
      {isSessionActive && (
        <div className="sticky top-0 z-20 bg-black pt-4 pb-4 border-b border-zinc-900">
          {/* Participants Section - Only show when session is active and has participants */}
          {participants && participants.length > 0 && (
            <div className="flex justify-center items-center gap-2 mb-3">
              {participants.map((participant, index) => {
                const displayName = participant.name === 'You' ? 'ME' : participant.name;
                const getInitials = (name: string) => {
                  if (name === 'You') return 'ME';
                  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                };

                const getGradient = (type: 'host' | 'user' | 'guest') => {
                  if (type === 'host') return 'from-[#f59e0b] to-[#ef4444]'; // amber to red
                  if (type === 'guest') return 'from-[#10b981] to-[#14b8a6]'; // green to teal
                  return 'from-[#2563eb] to-[#7c3aed]'; // blue to purple for user
                };

                const getIcon = (type: 'host' | 'user' | 'guest') => {
                  if (type === 'host') return <Crown className="w-4 h-4" />;
                  if (type === 'guest') return <UserPlus className="w-4 h-4" />;
                  return <User className="w-4 h-4" />;
                };

                return (
                  <TooltipProvider key={participant.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`
                            w-12 h-12 rounded-full 
                            bg-gradient-to-br ${getGradient(participant.type)}
                            flex items-center justify-center
                            text-white text-sm
                            border-2 border-white/20
                            shadow-lg
                            ${index !== 0 ? '-ml-3' : ''}
                          `}
                          style={{ zIndex: participants.length - index }}
                        >
                          <div className="flex items-center gap-1">
                            {getIcon(participant.type)}
                            <span className="text-xs">{getInitials(participant.name)}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {displayName}{' '}
                          {participant.type === 'host'
                            ? '(Host)'
                            : participant.type === 'guest'
                              ? '(Guest)'
                              : '(User)'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}

          {/* Session Code Display */}
          {sessionCode && (
            <div className="text-center">
              <p className="text-gray-400 text-sm tracking-widest">Invite Code: {sessionCode}</p>
            </div>
          )}
        </div>
      )}

      <div className="px-6">
      {/* Menu Section - Compact CTA near header */}
      {!isSessionActive && (
        <div className="max-w-2xl mx-auto mb-6 space-y-3">
          <button
            onClick={onStartSession}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-[#9141a9] to-[#b1487a] rounded-2xl hover:brightness-110 transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-white text-sm">Start a Session</span>
          </button>
          
          <button
            onClick={onAddSongs}
            className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#6343b8] to-[#9141a9] rounded-full hover:brightness-110 transition-all"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white text-sm">Add Songs to Playlist</span>
          </button>
        </div>
      )}

      {/* Queue Section - Only show when session is active */}
      {isSessionActive && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className="text-white text-xl shrink-0">{localQueue.length > 0 ? 'Up Next' : 'Queue'}</h2>
              {notifications && notifications.length > 0 && (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => {
                    const getIcon = (type: 'info' | 'success' | 'vote', message: string) => {
                      // Check if this is a removal notification
                      if (message.toLowerCase().includes('removed')) {
                        return null; // No icon needed, emoji is in message
                      }
                      switch (type) {
                        case 'info':
                          return <Users size={14} className="text-blue-400 shrink-0" />;
                        case 'success':
                          return <Music size={14} className="text-green-400 shrink-0" />;
                        case 'vote':
                          return <ThumbsUp size={14} className="text-purple-400 shrink-0" />;
                      }
                    };

                    const getGradient = (type: 'info' | 'success' | 'vote', message: string) => {
                      // Check if this is a removal notification - use red colors like Stop Session
                      if (message.toLowerCase().includes('removed')) {
                        return 'from-red-500/20 to-red-600/20 border-red-500/30';
                      }
                      switch (type) {
                        case 'info':
                          return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
                        case 'success':
                          return 'from-green-500/20 to-green-600/20 border-green-500/30';
                        case 'vote':
                          return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
                      }
                    };

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className={`
                          bg-gradient-to-r ${getGradient(notification.type, notification.message)}
                          backdrop-blur-xl border rounded-lg
                          px-3 py-2 shadow-lg
                          flex items-center gap-2
                          w-54 flex-shrink-0
                        `}
                      >
                        {getIcon(notification.type, notification.message)}
                        <span className="text-white text-xs truncate min-w-0">{notification.message}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
          {localQueue.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localQueue.map(song => song.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {/* Add Songs button at top when queue has songs */}
                  {!hasJoinedSession && (
                    <button 
                      onClick={onAddToQueue}
                      className="w-full p-4 bg-gradient-to-r from-[#6343b8]/20 to-[#9141a9]/20 border border-[#6343b8]/30 rounded-lg flex items-center justify-center gap-2 hover:brightness-[1.67] transition-all brightness-150"
                    >
                      <Plus size={18} className="text-white" />
                      <span className="text-white">Add Songs</span>
                    </button>
                  )}
                  {hasJoinedSession && settings.isGroupPlaylist && (
                    <button 
                      onClick={onAddToQueue}
                      disabled={creditsRemaining !== undefined && creditsRemaining === 0}
                      className={`w-full p-4 ${
                        creditsRemaining !== undefined && creditsRemaining === 0
                          ? 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-[#6343b8]/20 to-[#9141a9]/20 border border-[#6343b8]/30 hover:brightness-[1.67] brightness-150'
                      } rounded-lg flex items-center justify-center gap-2 transition-all`}
                    >
                      <Plus size={18} className="text-white" />
                      <span className="text-white">
                        {creditsRemaining === undefined
                          ? 'Queue a song'
                          : creditsRemaining === 0
                            ? 'No Queues Remaining'
                            : `Queues Remaining: ${creditsRemaining}`}
                      </span>
                    </button>
                  )}
                  {hasJoinedSession && !settings.isGroupPlaylist && (
                    <p className="text-sm text-gray-400 text-center">Guest queuing is off for this session.</p>
                  )}
                  <AnimatePresence mode="popLayout">
                    {localQueue.map((song) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -100 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        layout
                      >
                        <SortableQueueItem 
                          song={song} 
                          hasJoinedSession={hasJoinedSession} 
                          canRemove={settings.hostOverride} 
                          onRemove={handleRemoveSong} 
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-gray-400 mb-4">No songs in queue</p>
                {!hasJoinedSession && (
                  <button 
                    onClick={onAddToQueue}
                    className="px-8 py-4 bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white rounded-lg hover:brightness-110 transition-all text-lg"
                  >
                    Add Songs
                  </button>
                )}
                {hasJoinedSession && settings.isGroupPlaylist && (
                  <button 
                    onClick={onAddToQueue}
                    disabled={creditsRemaining !== undefined && creditsRemaining === 0}
                    className={`px-8 py-4 ${
                      creditsRemaining !== undefined && creditsRemaining === 0
                        ? 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-[#6343b8] to-[#9141a9] hover:brightness-110'
                    } text-white rounded-lg transition-all text-lg`}
                  >
                    {creditsRemaining === undefined
                      ? 'Add to Queue'
                      : creditsRemaining === 0
                        ? 'No Queues Remaining'
                        : `Queues Remaining: ${creditsRemaining}`}
                  </button>
                )}
                {hasJoinedSession && !settings.isGroupPlaylist && (
                  <p className="text-sm text-gray-400">Guest queuing is off for this session.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Songs List - Only show when session is NOT active */}
      {!isSessionActive && songs.length > 0 && (
        <div className="w-full">
          <div>
            {/* Songs List Header */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-white text-xl">{localSongs.length} song{localSongs.length !== 1 ? 's' : ''}</h2>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePlaylistDragEnd}
            >
              <SortableContext
                items={localSongs.map(song => song.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 max-w-2xl mx-auto">
                  {localSongs.map((song, index) => (
                    <SortablePlaylistItem
                      key={song.id}
                      song={song}
                      index={index}
                      onRemove={!hasJoinedSession ? handleRemovePlaylistSong : undefined}
                      onPlay={onPlaySong}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
      
      {/* Need Recommendations - Show when no songs and no session active */}
      {!isSessionActive && songs.length === 0 && onOpenRecommendations && (
        <div className="flex justify-center items-center min-h-[200px]">
          <button
            onClick={onOpenRecommendations}
            className="px-6 py-3 bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white rounded-full hover:brightness-110 transition-all"
          >
            Need Recommendations?
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
