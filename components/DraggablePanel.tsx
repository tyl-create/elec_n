import React, { useState, useEffect, useRef } from 'react';

interface DraggablePanelProps {
  children: React.ReactNode;
  initialPos?: { x: number; y: number };
  className?: string;
  header?: React.ReactNode;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({ 
  children, 
  initialPos = { x: 20, y: 100 },
  className = "",
  header
}) => {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;

      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));

      dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Only drag from header if provided, or entire panel if no header
    // But usually header is the handle. 
    // Here we assume the wrapper div is the handle if specific handle not clicked, 
    // but better to let the user click anywhere if it's a small panel.
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  return (
    <div 
      ref={panelRef}
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 50,
        touchAction: 'none'
      }}
      className={`shadow-2xl rounded-xl backdrop-blur-xl border border-slate-600 bg-slate-900/90 overflow-hidden ${className}`}
    >
      <div 
        onMouseDown={handleDown}
        onTouchStart={handleDown}
        className="cursor-move p-2 border-b border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        {header || <div className="h-2 w-10 bg-slate-600 rounded-full mx-auto" />}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
};
