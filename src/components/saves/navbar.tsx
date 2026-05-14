'use client';

import { Bookmark, Plus, User } from 'lucide-react';

type NavbarProps = {
  onAddClick: () => void;
};

export function Navbar({ onAddClick }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded text-white flex items-center justify-center">
              <Bookmark className="w-4 h-4" fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Saves</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onAddClick}
              className="text-gray-500 hover:text-gray-900 focus:outline-none hidden sm:block"
              title="Add URL"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 cursor-pointer">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
