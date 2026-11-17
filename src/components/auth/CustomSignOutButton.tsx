'use client';
import { SignOutButton } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export function CustomSignOutButton() {
  return (
    <SignOutButton redirectUrl="/fr/auth/login">
      <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left">
        <LogOut className="w-4 h-4" />
        Déconnexion
      </button>
    </SignOutButton>
  );
}
