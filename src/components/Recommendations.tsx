import { useState } from "react";
import { X } from "lucide-react";
import { fetchRecommendedSongs } from "../backend";
import type { DbCatalogSong } from "../backend";

interface RecommendationsProps {
  onClose: () => void;
  onAddSong: (song: Song) => void;
  onQueueSong?: (song: Song) => void;
}

interface BarSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
}

function BarSlider({ value, onChange, label }: BarSliderProps) {
  const bars = 20; // Total number of bars
  const filledBars = Math.round((value / 100) * bars);

  const getBarColor = (index: number) => {
    const position = index / bars;
    if (position < 0.25) return "#ef4444"; // red
    if (position < 0.5) return "#f97316"; // orange
    if (position < 0.75) return "#eab308"; // yellow
    return "#22c55e"; // green
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const newValue = Math.round((x / rect.width) * 100);
    onChange(Math.max(0, Math.min(100, newValue)));
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-gray-400 text-xs">{value}</span>
      </div>
      <div
        className="flex gap-1 h-8 items-center cursor-pointer w-full"
        onClick={handleClick}
      >
        {Array.from({ length: bars }).map((_, index) => (
          <div
            key={index}
            className="flex-1 h-full rounded-sm transition-all"
            style={{
              backgroundColor:
                index < filledBars ? getBarColor(index) : "#1f2937",
            }}
          />
        ))}
      </div>
    </div>
  );
}



export function Recommendations({ onClose, onAddSong, onQueueSong }: RecommendationsProps) {
  const [energy, setEnergy] = useState(50);
  const [danceability, setDanceability] = useState(50);
  const [popularity, setPopularity] = useState(50);
  const [blockExplicit, setBlockExplicit] = useState(false);
  const [blockedArtists, setBlockedArtists] = useState<string[]>([]);
  const [artistInput, setArtistInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DbCatalogSong[]>([]);

  const handleAddBlockedArtist = () => {
    if (artistInput.trim() && !blockedArtists.includes(artistInput.trim())) {
      setBlockedArtists([...blockedArtists, artistInput.trim()]);
      setArtistInput("");
    }
  };

  const handleRemoveArtist = (artist: string) => {
    setBlockedArtists(blockedArtists.filter(a => a !== artist));
  };

  const mapCatalogToSong = (c: DbCatalogSong): Song => ({
    id: c.song_id,
    title: c.title,
    artist: c.artist,
    album: c.album ?? "",
    albumArt: c.album_art ?? "",
  });

  const deriveTagsFromSliders = () => {
    const tags: string[] = [];
    if (energy > 65) tags.push("energetic");
    if (energy < 35) tags.push("chill");
    if (danceability > 65) tags.push("dance");
    if (danceability < 35) tags.push("acoustic");
    if (popularity < 35) tags.push("indie");
    return tags;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    const blocked = blockedArtists.map((a) => a.trim()).filter(Boolean);

    try {
      // Pull a wide pool, then score locally for closest matches
      const recs = await fetchRecommendedSongs({
        energy: undefined,
        danceability: undefined,
        popularity: undefined,
        blockExplicit: false, // handle explicit locally so we don't shrink the pool prematurely
        blockedArtists: undefined, // handle block locally
        includeTags: undefined, // don't pre-filter by tags; we'll score by sliders instead
        limit: 400,
      });

      // Respect block rules first
      const blockedSet = new Set(blocked.map((b) => b.toLowerCase()));
      const filtered = recs.filter((song) => {
        const artistMatch = song.artist?.toLowerCase?.() ?? "";
        if (blockedSet.has(artistMatch)) return false;
        if (blockExplicit && song.is_explicit) return false;
        return true;
      });

      if (!filtered.length) {
        setResults([]);
        setError("No recommendations found that respect the block settings.");
        return;
      }

      // Score by closeness to sliders and always return at least 1 (up to 5)
      const scored = filtered
        .map((song) => {
          const score =
            Math.abs(song.energy - energy) +
            Math.abs(song.danceability - danceability) +
            Math.abs(song.popularity - popularity);
          return { song, score };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map((entry) => entry.song);

      setResults(scored.length ? scored : filtered.slice(0, 1));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Could not load recommendations. Please try again.");
      console.error("Recommendations fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-white text-xl">Recommendations</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Energy Slider */}
          <BarSlider
            value={energy}
            onChange={setEnergy}
            label="Energy"
          />

          {/* Danceability Slider */}
          <BarSlider
            value={danceability}
            onChange={setDanceability}
            label="Danceability"
          />

          {/* Popularity Slider */}
          <BarSlider
            value={popularity}
            onChange={setPopularity}
            label="Popularity"
          />

          {/* Block Explicit Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <label className="text-white">Block Explicit Language</label>
            <button
              onClick={() => setBlockExplicit(!blockExplicit)}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${blockExplicit ? 'bg-gradient-to-r from-[#6343b8] to-[#9141a9]' : 'bg-zinc-700'}
              `}
            >
              <div
                className={`
                  absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${blockExplicit ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Block Artists */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="block text-white mb-3">Block Artists</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={artistInput}
                onChange={(e) => setArtistInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBlockedArtist()}
                placeholder="Enter artist name"
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:border-[#6343b8]"
              />
              <button
                onClick={handleAddBlockedArtist}
                className="px-4 py-2 bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white rounded-lg hover:brightness-110 transition-all"
              >
                Add
              </button>
            </div>

            {/* Blocked Artists List */}
            {blockedArtists.length > 0 && (
              <div className="space-y-2">
                {blockedArtists.map((artist) => (
                  <div
                    key={artist}
                    className="flex items-center justify-between px-4 py-2 bg-zinc-800 rounded-lg"
                  >
                    <span className="text-white">{artist}</span>
                    <button
                      onClick={() => handleRemoveArtist(artist)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Generate Recommendations"}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2">
              {results.map((song) => (
                <div
                  key={song.song_id}
                  className="flex items-center gap-3 p-3 bg-zinc-800/60 rounded-xl border border-zinc-800"
                >
                  {song.album_art && (
                    <img
                      src={song.album_art}
                      alt={song.title}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">
                      {song.title}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {song.artist}
                    </div>
                    <div className="text-xs text-gray-500">
                      Energy {song.energy} | Dance {song.danceability} | Pop {song.popularity}
                      {song.is_explicit ? " | Explicit" : ""}
                    </div>
                    {song.tags?.length ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {song.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[11px] bg-zinc-700 rounded-full text-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onAddSong(mapCatalogToSong(song))}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white"
                    >
                      Add to Playlist
                    </button>
                    {onQueueSong && (
                      <button
                        onClick={() => onQueueSong(mapCatalogToSong(song))}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#6343b8] to-[#9141a9] rounded-lg text-sm text-white hover:brightness-110"
                      >
                        Queue
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
