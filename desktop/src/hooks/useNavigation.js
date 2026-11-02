import { useCallback, useState } from 'react';

/**
 * Which view is on screen, plus the selections that travel with it:
 * the file open in the Files panel and the active settings section.
 */
export function useNavigation() {
  const [view, setView] = useState('home');
  const [selectedFile, setSelectedFile] = useState(null);
  const [settingsSection, setSettingsSection] = useState('general');

  // Jump to a file from anywhere (overview ranking, functions table, AI queue).
  const openFile = useCallback((filePath) => {
    setSelectedFile(filePath);
    setView('files');
  }, []);

  const openSettings = useCallback((section) => {
    setSettingsSection(section);
    setView('settings');
  }, []);

  const clearSelection = useCallback(() => setSelectedFile(null), []);

  return {
    view,
    go: setView,
    selectedFile,
    selectFile: setSelectedFile,
    clearSelection,
    openFile,
    settingsSection,
    setSettingsSection,
    openSettings,
  };
}
