import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import React from 'react';

// Cleanup automatique après chaque test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock lucide-react — liste explicite des icônes utilisées par les composants testés
const createIconMock = (name: string) => {
  const Icon = (props: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

vi.mock('lucide-react', () => ({
  Brain: createIconMock('Brain'),
  AlertTriangle: createIconMock('AlertTriangle'),
  Clock: createIconMock('Clock'),
  User: createIconMock('User'),
  UserPlus: createIconMock('UserPlus'),
  FolderPlus: createIconMock('FolderPlus'),
  Mail: createIconMock('Mail'),
  Loader2: createIconMock('Loader2'),
  ChevronDown: createIconMock('ChevronDown'),
  ChevronUp: createIconMock('ChevronUp'),
  CheckCircle: createIconMock('CheckCircle'),
  Circle: createIconMock('Circle'),
  HelpCircle: createIconMock('HelpCircle'),
  ShieldCheck: createIconMock('ShieldCheck'),
  Sparkles: createIconMock('Sparkles'),
  ExternalLink: createIconMock('ExternalLink'),
  ArrowRight: createIconMock('ArrowRight'),
  Download: createIconMock('Download'),
  FileText: createIconMock('FileText'),
  Copy: createIconMock('Copy'),
  Scale: createIconMock('Scale'),
  Gavel: createIconMock('Gavel'),
  BookOpen: createIconMock('BookOpen'),
  MessageSquare: createIconMock('MessageSquare'),
  FileCheck: createIconMock('FileCheck'),
}));

// Mock global fetch
global.fetch = vi.fn();
