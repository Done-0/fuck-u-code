import { useLayoutEffect, useState } from 'react';

/**
 * Row height that lets `rows` table rows fill the pane's scroll area, so a
 * page of results uses the whole view. Clamped so rows stay readable.
 */
export function useFitRowHeight(paneRef, rows, { min = 44, max = 76 } = {}) {
  const [height, setHeight] = useState(min);

  useLayoutEffect(() => {
    const wrapper = paneRef.current?.querySelector('.astryx-table-scroll-wrapper');
    if (!wrapper) return undefined;

    const measure = () => {
      const head = wrapper.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      // A couple of pixels of slack keeps rounding from adding a scrollbar.
      const available = wrapper.clientHeight - head - 2;
      setHeight(Math.max(min, Math.min(max, Math.floor(available / rows))));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [paneRef, rows, min, max]);

  return height;
}
