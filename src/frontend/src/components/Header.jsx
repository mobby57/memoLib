import { Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../store';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour! 👋
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">Admin</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
