import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';

const MAX_SUGGESTIONS = 300;
const MAX_LIST_HEIGHT = 280;
const GAP = 4;

/**
 * Window-relative placement under the input. The list is position: fixed so
 * cards with overflow: hidden (for their rounded corners) cannot clip it.
 */
function useListPosition(anchorRef, isShown) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!isShown) return undefined;
    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const top = rect.bottom + GAP;
      setStyle({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, Math.min(MAX_LIST_HEIGHT, window.innerHeight - top - 12)),
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchorRef, isShown]);

  return style;
}

/**
 * Free-text input with a suggestion list (an ARIA combobox): type any value,
 * or pick one of `suggestions` with the mouse or the arrow keys and Enter.
 */
export function SuggestInput({ label, value, onChange, suggestions, placeholder, width }) {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const anchorRef = useRef(null);

  // Right after a pick the text equals a suggestion, so show the whole list again.
  const matches = useMemo(() => {
    const term = value.trim().toLowerCase();
    const showAll = !term || suggestions.includes(value);
    const list = showAll ? suggestions : suggestions.filter((s) => s.toLowerCase().includes(term));
    return list.slice(0, MAX_SUGGESTIONS);
  }, [suggestions, value]);

  const isShown = isOpen && matches.length > 0;
  const listStyle = useListPosition(anchorRef, isShown);
  const optionId = (index) => `${listId}-${index}`;

  useEffect(() => {
    if (isShown && active >= 0)
      document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  });

  const pick = (name) => {
    onChange(name);
    setIsOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && isShown && active >= 0) {
      event.preventDefault();
      pick(matches[active]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={anchorRef} className="suggest" style={{ width }}>
      <TextInput
        label={label}
        isLabelHidden
        value={value}
        onChange={(next) => {
          onChange(next);
          setIsOpen(true);
          setActive(-1);
        }}
        placeholder={placeholder}
        autoComplete="off"
        onKeyDown={onKeyDown}
        onFocus={() => setIsOpen(true)}
        // A click on the already-focused field (e.g. right after a pick) reopens the list.
        onClick={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        role="combobox"
        aria-expanded={isShown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isShown && active >= 0 ? optionId(active) : undefined}
      />
      {isShown && listStyle && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="suggest-list"
          style={listStyle}
        >
          {matches.map((name, index) => (
            <li
              key={name}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              className={`suggest-option${index === active ? ' is-active' : ''}${name === value ? ' is-current' : ''}`}
              // mousedown, not click: the input's blur would close the list first.
              onMouseDown={(event) => {
                event.preventDefault();
                pick(name);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
