import { Home, Search, Library, Users } from "lucide-react";
import { useMemo } from "react";

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  const navItems = useMemo(
    () => [
      { id: "home", label: "Home", icon: Home },
      { id: "search", label: "Search", icon: Search },
      { id: "friends", label: "Friends", icon: Users },
      { id: "library", label: "Your Library", icon: Library },
    ],
    []
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === id ? "text-white" : "text-gray-400"
            }`}
            aria-label={label}
          >
            <Icon size={28} />
          </button>
        ))}
      </div>
    </div>
  );
}
