'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Paperclip, SendHorizonal } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = 'Type a message...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-200">
      <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
        <Paperclip size={20} />
      </button>
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full bg-gray-100 rounded-full px-4 py-2.5 text-body-sm text-gray-950 placeholder:text-gray-400',
            'outline-none border-none focus:bg-white focus:border focus:border-gray-200 transition-all',
          )}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!value.trim()}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
          value.trim() ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed',
        )}
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
}
