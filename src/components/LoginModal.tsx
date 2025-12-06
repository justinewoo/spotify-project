import { useState } from "react";
import { X } from "lucide-react";

interface LoginModalProps {
  onSubmit: (email: string, displayName: string) => void;
  onContinueGuest: () => void;
}

export function LoginModal({ onSubmit, onContinueGuest }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onSubmit(email.trim(), displayName.trim() || "Listener");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl">Welcome</h2>
          <X className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Enter your email and name to continue. We'll create an account if it doesn't exist.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:border-[#6343b8]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we show you?"
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:border-[#6343b8]"
            />
          </div>
        </div>
        <div className="space-y-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!email.trim()}
            className={`w-full py-3 rounded-lg text-white transition-all ${
              email.trim()
                ? "bg-gradient-to-r from-[#6343b8] to-[#9141a9] hover:brightness-110"
                : "bg-zinc-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
          <button
            onClick={onContinueGuest}
            className="w-full py-3 rounded-lg text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
