'use client';

import { ReactNode, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  children: ReactNode;
  defaultHeight?: number;
  expandedHeight?: number | string;
  collapsedHeight?: number;
  className?: string;
  showOverlay?: boolean;
}

export function BottomSheet({
  children,
  defaultHeight = 280,
  expandedHeight = '60%',
  collapsedHeight = 80,
  className,
  showOverlay = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleDragEnd = useCallback(
    (_: any, info: any) => {
      const threshold = 80;
      if (info.offset.y < -threshold) {
        setIsExpanded(true);
      } else if (info.offset.y > threshold) {
        setIsExpanded(false);
      }
    },
    [],
  );

  return (
    <>
      {showOverlay && isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={{ y: 0 }}
        animate={{
          height: isExpanded ? expandedHeight : defaultHeight,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] border-t border-gray-200',
          className,
        )}
        style={{ touchAction: 'none' }}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="overflow-y-auto h-full pb-safe-area-bottom">{children}</div>
      </motion.div>
    </>
  );
}

export function BottomSheetDesktop({ children }: { children: ReactNode }) {
  return (
    <div className="w-[380px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
      {children}
    </div>
  );
}
