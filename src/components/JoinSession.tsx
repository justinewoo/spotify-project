import { QrCode, Keyboard } from "lucide-react";
import { useState } from "react";

interface JoinSessionProps {
  onJoinSession: (code: string) => void;
}

export function JoinSession({ onJoinSession }: JoinSessionProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'manual'>('qr');
  const [sessionCode, setSessionCode] = useState('');

  const handleSubmit = () => {
    if (sessionCode.trim() || selectedMethod === 'qr') {
      // For QR code, we'll use a mock code. In a real app, this would come from scanning
      const code = selectedMethod === 'qr' ? 'SCANNED' : sessionCode.toUpperCase();
      onJoinSession(code);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-white text-3xl mb-2">Join a Session</h1>
      <p className="text-gray-400 mb-8">Connect to an active listening session</p>

      {/* Method Selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setSelectedMethod('qr')}
          className={`p-6 rounded-lg border-2 transition-all text-center ${
            selectedMethod === 'qr'
              ? 'border-[#6343b8] bg-gradient-to-br from-[#6343b8]/20 to-[#9141a9]/20'
              : 'border-gray-700 bg-gray-800/50'
          }`}
        >
          <QrCode className={`w-12 h-12 mx-auto mb-3 ${
            selectedMethod === 'qr' ? 'text-[#6343b8]' : 'text-gray-400'
          }`} />
          <span className="text-white block">Scan QR Code</span>
        </button>

        <button
          onClick={() => setSelectedMethod('manual')}
          className={`p-6 rounded-lg border-2 transition-all text-center ${
            selectedMethod === 'manual'
              ? 'border-[#6343b8] bg-gradient-to-br from-[#6343b8]/20 to-[#9141a9]/20'
              : 'border-gray-700 bg-gray-800/50'
          }`}
        >
          <Keyboard className={`w-12 h-12 mx-auto mb-3 ${
            selectedMethod === 'manual' ? 'text-[#6343b8]' : 'text-gray-400'
          }`} />
          <span className="text-white block">Enter Code</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="mb-8">
        {selectedMethod === 'qr' ? (
          <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-dashed border-gray-600">
            <div className="aspect-square max-w-[240px] mx-auto bg-white rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-24 h-24 text-gray-400" />
            </div>
            <p className="text-center text-gray-400 text-sm">
              Position the QR code within the frame to scan
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-white mb-2">Session Code</label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="E.g. ABCDE"
              maxLength={5}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest uppercase focus:outline-none focus:border-[#6343b8]"
            />
            <p className="text-gray-400 text-sm mt-2 text-center">
              Enter the 5-letter code shared by the host
            </p>
          </div>
        )}
      </div>

      {/* Submit Button - Only show for manual entry */}
      {selectedMethod === 'manual' && (
        <button
          onClick={handleSubmit}
          disabled={sessionCode.length !== 5}
          className={`w-full p-4 rounded-lg font-bold transition-all ${
            sessionCode.length !== 5
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#6343b8] to-[#9141a9] text-white hover:brightness-110'
          }`}
        >
          Join Session
        </button>
      )}
    </div>
  );
}