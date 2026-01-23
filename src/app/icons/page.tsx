'use client';

import { 
  Menu, X, Search, User, FileText, LayoutDashboard, Settings, 
  Check, AlertCircle, LogOut, Home, Users, Folder, Mail, Bell,
  Calendar, Clock, Download, Upload, Edit, Trash2, Plus, Minus,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Filter,
  MoreVertical, Eye, EyeOff, Lock, Unlock, Save, Send, Share2,
  Star, Heart, ThumbsUp, MessageCircle, Phone, MapPin, Briefcase,
  DollarSign, TrendingUp, TrendingDown, BarChart, PieChart,
  Activity, Zap, Sun, Moon, Cloud, Wifi, WifiOff
} from 'lucide-react';
import { useState } from 'react';

const iconCategories = [
  {
    name: 'Navigation',
    icons: [
      { name: 'Menu', component: Menu },
      { name: 'X', component: X },
      { name: 'Home', component: Home },
      { name: 'ChevronRight', component: ChevronRight },
      { name: 'ChevronLeft', component: ChevronLeft },
      { name: 'ChevronUp', component: ChevronUp },
      { name: 'ChevronDown', component: ChevronDown },
    ]
  },
  {
    name: 'Actions',
    icons: [
      { name: 'Plus', component: Plus },
      { name: 'Minus', component: Minus },
      { name: 'Edit', component: Edit },
      { name: 'Trash2', component: Trash2 },
      { name: 'Save', component: Save },
      { name: 'Send', component: Send },
      { name: 'Share2', component: Share2 },
      { name: 'Download', component: Download },
      { name: 'Upload', component: Upload },
    ]
  },
  {
    name: 'Interface',
    icons: [
      { name: 'Search', component: Search },
      { name: 'Filter', component: Filter },
      { name: 'Settings', component: Settings },
      { name: 'MoreVertical', component: MoreVertical },
      { name: 'Eye', component: Eye },
      { name: 'EyeOff', component: EyeOff },
      { name: 'Lock', component: Lock },
      { name: 'Unlock', component: Unlock },
    ]
  },
  {
    name: 'Business',
    icons: [
      { name: 'User', component: User },
      { name: 'Users', component: Users },
      { name: 'FileText', component: FileText },
      { name: 'Folder', component: Folder },
      { name: 'LayoutDashboard', component: LayoutDashboard },
      { name: 'Briefcase', component: Briefcase },
      { name: 'DollarSign', component: DollarSign },
    ]
  },
  {
    name: 'Communication',
    icons: [
      { name: 'Mail', component: Mail },
      { name: 'MessageCircle', component: MessageCircle },
      { name: 'Phone', component: Phone },
      { name: 'Bell', component: Bell },
    ]
  },
  {
    name: 'Status',
    icons: [
      { name: 'Check', component: Check },
      { name: 'AlertCircle', component: AlertCircle },
      { name: 'Star', component: Star },
      { name: 'Heart', component: Heart },
      { name: 'ThumbsUp', component: ThumbsUp },
    ]
  },
  {
    name: 'Data',
    icons: [
      { name: 'BarChart', component: BarChart },
      { name: 'PieChart', component: PieChart },
      { name: 'TrendingUp', component: TrendingUp },
      { name: 'TrendingDown', component: TrendingDown },
      { name: 'Activity', component: Activity },
    ]
  },
  {
    name: 'Autres',
    icons: [
      { name: 'Calendar', component: Calendar },
      { name: 'Clock', component: Clock },
      { name: 'MapPin', component: MapPin },
      { name: 'Sun', component: Sun },
      { name: 'Moon', component: Moon },
      { name: 'Cloud', component: Cloud },
      { name: 'Wifi', component: Wifi },
      { name: 'WifiOff', component: WifiOff },
      { name: 'Zap', component: Zap },
      { name: 'LogOut', component: LogOut },
    ]
  }
];

export default function IconsDemo() {
  const [selectedSize, setSelectedSize] = useState(24);
  const [selectedColor, setSelectedColor] = useState('#000000');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Galerie d'Icônes Lucide
          </h1>
          <p className="text-gray-600">
            Plus de 90 icônes disponibles pour votre application
          </p>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille: {selectedSize}px
              </label>
              <input
                type="range"
                min="16"
                max="64"
                value={selectedSize}
                onChange={(e) => setSelectedSize(Number(e.target.value))}
                className="w-48"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="h-10 w-20 rounded border border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Icon Categories */}
        {iconCategories.map((category) => (
          <div key={category.name} className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {category.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {category.icons.map(({ name, component: Icon }) => (
                <div
                  key={name}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    navigator.clipboard.writeText(`<${name} size={${selectedSize}} />`);
                  }}
                >
                  <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                    <Icon size={selectedSize} color={selectedColor} />
                  </div>
                  <span className="mt-2 text-xs text-gray-600 text-center break-all">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Usage Guide */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Comment utiliser
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Importer l'icône</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { Menu, Search, User } from 'lucide-react';`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Utiliser dans votre composant</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`export default function MyComponent() {
  return (
    <>
      <Menu size={24} />
      <Search size={20} color="#3b82f6" />
      <User className="text-blue-500" strokeWidth={2.5} />
    </>
  );
}`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Props disponibles</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">size</code> - Taille de l'icône (défaut: 24)</li>
                <li><code className="bg-gray-100 px-1 rounded">color</code> - Couleur (défaut: currentColor)</li>
                <li><code className="bg-gray-100 px-1 rounded">strokeWidth</code> - Épaisseur du trait (défaut: 2)</li>
                <li><code className="bg-gray-100 px-1 rounded">className</code> - Classes CSS</li>
                <li>Toutes les props SVG standard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
