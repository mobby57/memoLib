import { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (message) => addNotification(message, 'success');
  const error = (message) => addNotification(message, 'error');
  const warning = (message) => addNotification(message, 'warning');
  const info = (message) => addNotification(message, 'info');

  return (
    <NotificationContext.Provider value={{ success, error, warning, info }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500/90 text-white border-green-400';
      case 'error': return 'bg-red-500/90 text-white border-red-400';
      case 'warning': return 'bg-yellow-500/90 text-white border-yellow-400';
      default: return 'bg-blue-500/90 text-white border-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-lg ${getColors(notification.type)} animate-in slide-in-from-right`}
        >
          {getIcon(notification.type)}
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => onRemove(notification.id)}
            className="hover:bg-white/20 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};