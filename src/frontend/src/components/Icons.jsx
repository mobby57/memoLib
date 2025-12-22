import {
  // Navigation & UI
  Home, Settings, User, Menu, X, ChevronDown, ChevronRight, ChevronLeft,
  // Email & Communication
  Mail, Send, Inbox, Archive, Trash2, Reply, Forward, Star, 
  // AI & Voice
  Mic, Volume2, Play, Square, Bot, Sparkles, Wand2, MessageSquare,
  // Files & Documents
  FileText, Upload, Download, File, Folder, Image, Paperclip,
  // Actions
  Plus, Edit, Save, Copy, Share, Search, Filter, RefreshCw,
  // Status & Feedback
  Check, AlertCircle, Info, AlertTriangle, Eye, EyeOff, Heart,
  // Accessibility
  Accessibility, Volume1, VolumeX, Type, Contrast, MousePointer,
  // Analytics & Stats
  BarChart3, TrendingUp, Calendar, Clock, Users, Activity,
  // Security
  Shield, Lock, Unlock, Key, UserCheck,
  // Social & External
  ExternalLink, Globe, Phone, MapPin, Github, Twitter
} from 'lucide-react';

// Composant d'icône unifié avec props standardisées
export const Icon = ({ 
  name, 
  size = 20, 
  className = '', 
  color = 'currentColor',
  strokeWidth = 2,
  ...props 
}) => {
  const iconMap = {
    // Navigation & UI
    home: Home,
    settings: Settings,
    user: User,
    menu: Menu,
    close: X,
    'chevron-down': ChevronDown,
    'chevron-right': ChevronRight,
    'chevron-left': ChevronLeft,
    
    // Email & Communication
    mail: Mail,
    send: Send,
    inbox: Inbox,
    archive: Archive,
    trash: Trash2,
    reply: Reply,
    forward: Forward,
    star: Star,
    
    // AI & Voice
    mic: Mic,
    volume: Volume2,
    play: Play,
    stop: Square,
    bot: Bot,
    sparkles: Sparkles,
    wand: Wand2,
    message: MessageSquare,
    
    // Files & Documents
    file: FileText,
    upload: Upload,
    download: Download,
    document: File,
    folder: Folder,
    image: Image,
    attachment: Paperclip,
    
    // Actions
    plus: Plus,
    edit: Edit,
    save: Save,
    copy: Copy,
    share: Share,
    search: Search,
    filter: Filter,
    refresh: RefreshCw,
    
    // Status & Feedback
    check: Check,
    alert: AlertCircle,
    info: Info,
    warning: AlertTriangle,
    eye: Eye,
    'eye-off': EyeOff,
    heart: Heart,
    
    // Accessibility
    accessibility: Accessibility,
    'volume-low': Volume1,
    'volume-off': VolumeX,
    type: Type,
    contrast: Contrast,
    pointer: MousePointer,
    
    // Analytics & Stats
    chart: BarChart3,
    trending: TrendingUp,
    calendar: Calendar,
    clock: Clock,
    users: Users,
    activity: Activity,
    
    // Security
    shield: Shield,
    lock: Lock,
    unlock: Unlock,
    key: Key,
    'user-check': UserCheck,
    
    // Social & External
    external: ExternalLink,
    globe: Globe,
    phone: Phone,
    location: MapPin,
    github: Github,
    twitter: Twitter
  };

  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
};

// Export des icônes individuelles pour usage direct
export {
  Home, Settings, User, Menu, X, ChevronDown, ChevronRight, ChevronLeft,
  Mail, Send, Inbox, Archive, Trash2, Reply, Forward, Star,
  Mic, Volume2, Play, Square, Bot, Sparkles, Wand2, MessageSquare,
  FileText, Upload, Download, File, Folder, Image, Paperclip,
  Plus, Edit, Save, Copy, Share, Search, Filter, RefreshCw,
  Check, AlertCircle, Info, AlertTriangle, Eye, EyeOff, Heart,
  Accessibility, Volume1, VolumeX, Type, Contrast, MousePointer,
  BarChart3, TrendingUp, Calendar, Clock, Users, Activity,
  Shield, Lock, Unlock, Key, UserCheck,
  ExternalLink, Globe, Phone, MapPin, Github, Twitter
};

export default Icon;