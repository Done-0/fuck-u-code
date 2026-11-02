import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Pagination } from '@astryxdesign/core/Pagination';
import {
  Table,
  paginateData,
  pixel,
  proportional,
  useTableSortable,
  useTableSortableState,
} from '@astryxdesign/core/Table';
import { useT } from '../i18n.js';
import { useRowClick } from '../components/useRowClick.js';
import { useFitRowHeight } from '../components/useFitRowHeight.js';
import { SearchIcon } from '../icons.jsx';

const PAGE_SIZE = 10;

export function FunctionsView({ report, onOpenFile }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const paneRef = useRef(null);
  const rowHeight = useFitRowHeight(paneRef, PAGE_SIZE);

  const rows = useMemo(
    () =>
      report.fileResults.flatMap((file) =>
        file.parseResult.functions.map((fn, index) => ({
          id: `${file.filePath}:${fn.startLine}:${index}`,
          name: fn.name,
          filePath: file.filePath,
          line: fn.startLine,
          complexity: fn.complexity,
          nesting: fn.nestingDepth,
          length: fn.lineCount,
          params: fn.parameterCount,
        }))
      ),
    [report]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) => row.name.toLowerCase().includes(term) || row.filePath.toLowerCase().includes(term)
    );
  }, [rows, query]);

  const { sortedData, sortConfig, sort } = useTableSortableState({
    data: filtered,
    defaultSort: [{ sortKey: 'complexity', direction: 'descending' }],
  });

  // A new search or sort order starts over at the first page.
  useEffect(() => setPage(1), [query, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = paginateData(sortedData, currentPage, PAGE_SIZE);
  const firstRow = sortedData.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(currentPage * PAGE_SIZE, sortedData.length);
  const sortPlugin = useTableSortable(sortConfig);
  const clickPlugin = useRowClick(useCallback((row) => onOpenFile(row.filePath), [onOpenFile]));

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('col_function'),
        width: proportional(2, { minWidth: 180 }),
        sortable: true,
        renderCell: (row) => <span className="code">{row.name}</span>,
      },
      {
        key: 'filePath',
        header: t('col_file'),
        width: proportional(3, { minWidth: 200 }),
        sortable: true,
        renderCell: (row) => (
          <span className="file-path-dir" title={row.filePath}>
            {row.filePath}:{row.line}
          </span>
        ),
      },
      {
        key: 'complexity',
        header: t('col_complexity'),
        width: pixel(120),
        align: 'center',
        sortable: true,
        renderCell: (row) => <span className="complexity-pill">{row.complexity}</span>,
      },
      {
        key: 'nesting',
        header: t('col_nesting'),
        width: pixel(96),
        align: 'center',
        sortable: true,
      },
      { key: 'length', header: t('col_length'), width: pixel(88), align: 'center', sortable: true },
      {
        key: 'params',
        header: t('col_params'),
        width: pixel(112),
        align: 'center',
        sortable: true,
      },
    ],
    [t]
  );

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader padding={6} hasDivider>
          <HStack gap={3} vAlign="end" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={1}>
                <Heading level={1}>{t('nav_functions')}</Heading>
                <Text type="supporting" color="secondary">
                  {t('functions_count', { count: filtered.length })}
                </Text>
              </VStack>
            </StackItem>
            <TextInput
              label={t('functions_search')}
              isLabelHidden
              placeholder={t('functions_search')}
              startIcon={SearchIcon}
              value={query}
              onChange={setQuery}
              hasClear
              width={320}
            />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={0} isScrollable={false}>
          {/* The table's own wrapper scrolls, so its sticky header stays in view. */}
          <div
            ref={paneRef}
            className="table-pane is-paged"
            style={{ '--row-height': `${rowHeight}px` }}
          >
            <Table
              className="click-table"
              data={pageRows}
              columns={columns}
              idKey="id"
              density="balanced"
              hasHover
              plugins={{ sort: sortPlugin, click: clickPlugin }}
            />
            <div className="table-pane-footer pager">
              <Text type="supporting" color="secondary" hasTabularNumbers>
                {t('page_range', { from: firstRow, to: lastRow, total: sortedData.length })}
              </Text>
              <Pagination
                page={currentPage}
                onChange={setPage}
                totalItems={sortedData.length}
                pageSize={PAGE_SIZE}
                hasFirstLast
                siblingCount={1}
                label={t('nav_functions')}
                isDisabled={sortedData.length <= PAGE_SIZE}
              />
            </div>
          </div>
        </LayoutContent>
      }
    />
  );
}
