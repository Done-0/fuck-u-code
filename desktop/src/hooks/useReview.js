import { useCallback, useState } from 'react';

const IDLE = { items: [], running: false };

/** Merge one progress event from the main process into the queue. */
function applyProgress(items, { filePath, status, review, error }) {
  return items.map((item) =>
    item.filePath === filePath ? { ...item, status, review, error } : item
  );
}

/** After a run fails as a whole (e.g. no provider), keep only files that finished. */
function keepFinished(items) {
  return items.filter((item) => item.status === 'done' || item.status === 'error');
}

/** The AI review queue: one entry per file, updated as the main process reports back. */
export function useReview() {
  const [review, setReview] = useState(IDLE);

  // Saved results of a just-opened project; shown until the next run replaces them.
  const restore = useCallback((items) => setReview({ items, running: false }), []);

  // Clearing also forgets the saved results.
  const clear = useCallback(() => {
    setReview(IDLE);
    window.fuc.clearReviews().catch(() => {});
  }, []);

  const start = useCallback(async (filePaths) => {
    setReview({
      running: true,
      items: filePaths.map((filePath) => ({ filePath, status: 'waiting' })),
    });
    const unsubscribe = window.fuc.onReviewProgress((progress) =>
      setReview((prev) => ({ ...prev, items: applyProgress(prev.items, progress) }))
    );
    try {
      await window.fuc.reviewFiles(filePaths);
      setReview((prev) => ({ ...prev, running: false }));
    } catch (err) {
      setReview((prev) => ({
        running: false,
        error: err.message,
        items: keepFinished(prev.items),
      }));
    } finally {
      unsubscribe();
    }
  }, []);

  return { review, start, clear, restore };
}
