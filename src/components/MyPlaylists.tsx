import { Music } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  albumArt: string | null;
  songs: Array<any>;
}

interface MyPlaylistsProps {
  playlists: Playlist[];
  onPlaylistClick: (playlistId: string) => void;
}

export function MyPlaylists({ playlists, onPlaylistClick }: MyPlaylistsProps) {
  return (
    <div className="p-6">
      <h2 className="text-white text-3xl mb-6">My Playlists</h2>
      
      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Music size={64} className="text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-lg">No playlists yet</p>
          <p className="text-zinc-500 text-sm mt-2">Create your first playlist to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onPlaylistClick(playlist.id)}
              className="aspect-square bg-gradient-to-br from-[#6343b8] to-[#9141a9] rounded-lg overflow-hidden hover:brightness-110 transition-all flex flex-col items-center justify-center p-4 relative group"
            >
              {playlist.albumArt ? (
                <img 
                  src={playlist.albumArt} 
                  alt={playlist.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Music size={48} className="text-white opacity-50 mb-2" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <h3 className="text-white truncate">{playlist.name}</h3>
                <p className="text-white/70 text-sm">
                  {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
