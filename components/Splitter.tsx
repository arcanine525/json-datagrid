import React, { RefObject } from 'react';

/**
 * Draggable divider between two panels. Emits a 0..1 ratio representing the
 * fraction of the container occupied by the first panel. Double-click resets
 * to 0.5.
 *
 * The splitter measures the container itself rather than tracking deltas so the
 * pointer position always matches the handle — robust to layout reflow during
 * the drag.
 */
interface SplitterProps {
  ratio: number;
  onChange: (ratio: number) => void;
  /** When true, the splitter is a horizontal bar resized by vertical drag. */
  vertical: boolean;
  containerRef: RefObject<HTMLElement>;
  min?: number;
  max?: number;
}

const Splitter: React.FC<SplitterProps> = ({
  ratio,
  onChange,
  vertical,
  containerRef,
  min = 0.15,
  max = 0.85,
}) => {
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const cursor = vertical ? 'row-resize' : 'col-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const r = vertical
        ? (ev.clientY - rect.top) / rect.height
        : (ev.clientX - rect.left) / rect.width;
      onChange(Math.max(min, Math.min(max, r)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const inc = vertical
      ? e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0
      : e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
    if (inc !== 0) {
      e.preventDefault();
      onChange(Math.max(min, Math.min(max, ratio + inc)));
    } else if (e.key === 'Home') {
      e.preventDefault(); onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault(); onChange(max);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); onChange(0.5);
    }
  };

  const base =
    'flex-shrink-0 bg-light-border dark:bg-dark-border hover:bg-light-accent dark:hover:bg-dark-accent transition-colors';
  const orient = vertical
    ? 'h-1.5 w-full cursor-row-resize'
    : 'w-1.5 h-full cursor-col-resize';

  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'horizontal' : 'vertical'}
      aria-valuemin={Math.round(min * 100)}
      aria-valuemax={Math.round(max * 100)}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onDoubleClick={() => onChange(0.5)}
      onKeyDown={onKeyDown}
      title="Drag to resize · double-click to reset"
      className={`${base} ${orient}`}
    />
  );
};

export default Splitter;
