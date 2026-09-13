import { useState, useRef, useEffect, useCallback } from 'react';

export function useDraggable({ initialPosition = null, margin = 16 } = {}) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  // Initialize position to bottom-right if not provided
  useEffect(() => {
    if (!position && typeof window !== 'undefined') {
      const defaultWidth = 280;
      const defaultHeight = 180;
      setPosition({
        x: Math.max(margin, window.innerWidth - defaultWidth - margin),
        y: Math.max(margin, window.innerHeight - defaultHeight - 100)
      });
    }
  }, [position, margin]);

  // Adjust if window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev || !dragRef.current) return prev;
        const rect = dragRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - margin;
        const maxY = window.innerHeight - rect.height - margin;
        return {
          x: Math.min(Math.max(margin, prev.x), Math.max(margin, maxX)),
          y: Math.min(Math.max(margin, prev.y), Math.max(margin, maxY))
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [margin]);

  const snapToCorner = useCallback((currentX, currentY) => {
    if (!dragRef.current) return;
    const rect = dragRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - margin;
    const maxY = window.innerHeight - rect.height - margin;

    const snapX = currentX < window.innerWidth / 2 ? margin : maxX;
    const snapY = currentY < window.innerHeight / 2 ? margin + 60 : maxY - 80;

    setPosition({ x: snapX, y: snapY });
  }, [margin]);

  const onDragStart = useCallback((clientX, clientY) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: position ? position.x : 0,
      startY: position ? position.y : 0
    };
  }, [position]);

  const onMouseDown = useCallback((e) => {
    // Only drag on left click and not on inner buttons/inputs
    if (e.button !== 0 || e.target.closest('button, input, textarea, a')) return;
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
  }, [onDragStart]);

  const onTouchStart = useCallback((e) => {
    if (e.target.closest('button, input, textarea, a')) return;
    const touch = e.touches[0];
    onDragStart(touch.clientX, touch.clientY);
  }, [onDragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      let newX = dragStartRef.current.startX + deltaX;
      let newY = dragStartRef.current.startY + deltaY;

      if (dragRef.current) {
        const rect = dragRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - margin;
        const maxY = window.innerHeight - rect.height - margin;
        newX = Math.min(Math.max(margin, newX), maxX);
        newY = Math.min(Math.max(margin, newY), maxY);
      }

      setPosition({ x: newX, y: newY });
    };

    const onTouchMove = (e) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.mouseX;
      const deltaY = touch.clientY - dragStartRef.current.mouseY;

      let newX = dragStartRef.current.startX + deltaX;
      let newY = dragStartRef.current.startY + deltaY;

      if (dragRef.current) {
        const rect = dragRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - margin;
        const maxY = window.innerHeight - rect.height - margin;
        newX = Math.min(Math.max(margin, newX), maxX);
        newY = Math.min(Math.max(margin, newY), maxY);
      }

      setPosition({ x: newX, y: newY });
    };

    const onEnd = () => {
      setIsDragging(false);
      if (position) {
        snapToCorner(position.x, position.y);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, position, margin, snapToCorner]);

  return {
    dragRef,
    position,
    isDragging,
    dragHandlers: {
      onMouseDown,
      onTouchStart
    }
  };
}
