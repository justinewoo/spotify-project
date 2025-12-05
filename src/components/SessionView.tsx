interface SessionViewProps {
  playlistName: string;
  onStartSession: (sessionCode: string) => void;
  onOpenSettings?: () => void;
}

export function SessionView({ playlistName, onStartSession, onOpenSettings }: SessionViewProps) {
  // Generate a random 5-letter code
  const sessionCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  // Generate QR code data URL (using a simple placeholder pattern)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`groupie://session/${sessionCode}`)}`;

  const handleInvite = () => {
    // In a real app, this would open share options
    if (navigator.share) {
      navigator.share({
        title: `Join ${playlistName}`,
        text: `Join my Groupie session! Code: ${sessionCode}`,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(sessionCode);
      alert('Session code copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col items-center px-6 pt-6 pb-8">
      <h1 className="text-white text-3xl mb-4">{playlistName}</h1>
      
      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl mb-3 shadow-2xl">
        <img 
          src={qrCodeUrl} 
          alt="Session QR Code" 
          className="w-40 h-40"
        />
      </div>

      {/* Session Code */}
      <div className="text-white text-3xl tracking-widest mb-4">
        {sessionCode}
      </div>

      {/* Invite Button */}
      <button 
        onClick={handleInvite}
        className="w-64 px-6 py-3 mb-3 bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white rounded-lg hover:brightness-110 transition-all"
      >
        Invite
      </button>

      {/* Session Settings */}
      {onOpenSettings && (
        <button 
          onClick={onOpenSettings}
          className="w-64 px-6 py-3 mb-3 bg-gradient-to-r from-[#374151] to-[#4b5563] text-white rounded-lg hover:brightness-110 transition-all"
        >
          Session Settings
        </button>
      )}

      {/* Start Button */}
      <button 
        onClick={() => onStartSession(sessionCode)}
        className="w-64 px-6 py-3 bg-gradient-to-r from-[#b1487a] to-[#c0504e] text-white rounded-lg hover:brightness-110 transition-all"
      >
        Start
      </button>
    </div>
  );
}
