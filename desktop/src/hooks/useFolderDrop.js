import { useRef, useState } from 'react';

/**
 * Read a drop: `{ path }` for a folder, `{ notFolder: true }` for a plain file,
 * or null when nothing usable was dropped.
 */
function readDrop(dataTransfer) {
  const file = dataTransfer.files?.[0];
  if (!file) return null;
  const entry = dataTransfer.items?.[0]?.webkitGetAsEntry?.();
  if (entry && !entry.isDirectory) return { notFolder: true };
  return { path: window.fuc.getPathForFile(file) };
}

/** Window-wide drag-and-drop of a project folder. Spread `handlers` on the root element. */
export function useFolderDrop({ isDisabled, onFolder, onNotFolder }) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave fire for every child element crossed, so count the depth.
  const depth = useRef(0);

  const handlers = {
    onDragEnter: (event) => {
      if (isDisabled || !event.dataTransfer.types.includes('Files')) return;
      depth.current += 1;
      setIsDragging(true);
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDragging(false);
    },
    // Without this the browser would navigate to the dropped file.
    onDragOver: (event) => event.preventDefault(),
    onDrop: (event) => {
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      const dropped = isDisabled ? null : readDrop(event.dataTransfer);
      if (dropped?.notFolder) onNotFolder();
      else if (dropped) onFolder(dropped.path);
    },
  };

  return { isDragging, handlers };
}
