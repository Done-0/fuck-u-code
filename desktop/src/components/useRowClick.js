import { useMemo } from 'react';

/**
 * Table plugin that makes body rows clickable and keyboard-activatable.
 * Selection is exposed as data-selected so CSS can style it.
 */
export function useRowClick(onActivate, isSelected) {
  return useMemo(
    () => ({
      transformBodyRow: (props, item) => ({
        ...props,
        htmlProps: {
          ...props.htmlProps,
          tabIndex: 0,
          'data-clickable': 'true',
          'data-selected': isSelected?.(item) ? 'true' : undefined,
          onClick: () => onActivate(item),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate(item);
            }
          },
        },
      }),
    }),
    [onActivate, isSelected]
  );
}
