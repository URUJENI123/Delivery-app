'use client';

interface QuickRepliesProps {
  onSelect: (message: string) => void;
}

const replies = [
  "I'm arriving",
  'Be there in 5 mins',
  'Please call me',
  'Traffic delay',
  'Package ready',
  'At the location',
];

export function QuickReplies({ onSelect }: QuickRepliesProps) {
  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-3.5 py-2 text-caption text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors whitespace-nowrap"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
