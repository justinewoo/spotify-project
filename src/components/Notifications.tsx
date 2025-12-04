import { motion, AnimatePresence } from "motion/react";
import { Users, Music, ThumbsUp } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'vote';
}

interface NotificationsProps {
  notifications: Notification[];
}

export function Notifications({ notifications }: NotificationsProps) {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Users size={18} className="text-blue-400" />;
      case 'success':
        return <Music size={18} className="text-green-400" />;
      case 'vote':
        return <ThumbsUp size={18} className="text-purple-400" />;
    }
  };

  const getGradient = (type: Notification['type']) => {
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
    <div className="fixed top-16 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className={`
              bg-gradient-to-r ${getGradient(notification.type)}
              backdrop-blur-xl border rounded-xl
              px-4 py-3 shadow-2xl
              min-w-[280px] max-w-[320px]
            `}
          >
            <div className="flex items-center gap-3">
              {getIcon(notification.type)}
              <span className="text-white text-sm">{notification.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
