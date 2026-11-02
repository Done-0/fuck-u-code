import { useCallback, useMemo, useState } from 'react';
import { Layout, LayoutContent, LayoutHeader, LayoutPanel } from '@astryxdesign/core/Layout';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import {
  Table,
  pixel,
  proportional,
  useTableSortable,
  useTableSortableState,
} from '@astryxdesign/core/Table';
import { useT } from '../i18n.js';
import { countIssues, languageName, toMess } from '../score.js';
import { FilePath, MessBadge } from '../components/common.jsx';
import { useRowClick } from '../components/useRowClick.js';
import { FileDetail } from './FileDetail.jsx';
import { SearchIcon } from '../icons.jsx';

const MAX_ROWS = 500;

export function FilesView({ report, selectedFile, onSelectFile, onReview, isReviewing }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');

  const rows = useMemo(
    () =>
      report.fileResults.map((file) => ({
        id: file.filePath,
        filePath: file.filePath,
        language: file.parseResult.language,
        mess: toMess(file.score),
        lines: file.parseResult.totalLines,
        functions: file.parseResult.functions.length,
        issues: countIssues(file),
      })),
    [report]
  );

  const languageOptions = useMemo(() => {
    const languages = [...new Set(rows.map((row) => row.language))].sort();
    return [
      { value: 'all', label: t('files_all_languages') },
      ...languages.map((value) => ({ value, label: languageName(value) })),
    ];
  }, [rows, t]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (language === 'all' || row.language === language) &&
        (term === '' || row.filePath.toLowerCase().includes(term))
    );
  }, [rows, query, language]);

  const { sortedData, sortConfig } = useTableSortableState({
    data: filtered,
    defaultSort: [{ sortKey: 'mess', direction: 'descending' }],
  });
  const sortPlugin = useTableSortable(sortConfig);
  const clickPlugin = useRowClick(
    useCallback((row) => onSelectFile(row.filePath), [onSelectFile]),
    useCallback((row) => row.filePath === selectedFile, [selectedFile])
  );

  const selected = selectedFile
    ? report.fileResults.find((file) => file.filePath === selectedFile)
    : null;

  // With the detail panel open the table loses ~480px, so drop the secondary columns.
  const isCompact = Boolean(selected);
  const columns = useMemo(
    () =>
      [
        {
          key: 'filePath',
          header: t('col_file'),
          width: proportional(4, { minWidth: 200 }),
          sortable: true,
          renderCell: (row) => <FilePath path={row.filePath} />,
        },
        !isCompact && {
          key: 'language',
          header: t('col_language'),
          width: pixel(120),
          sortable: true,
          renderCell: (row) => languageName(row.language),
        },
        { key: 'lines', header: t('col_lines'), width: pixel(84), align: 'center', sortable: true },
        !isCompact && {
          key: 'functions',
          header: t('col_functions'),
          width: pixel(84),
          align: 'center',
          sortable: true,
        },
        {
          key: 'issues',
          header: t('col_issues'),
          width: pixel(84),
          align: 'center',
          sortable: true,
        },
        {
          key: 'mess',
          header: t('col_score'),
          width: pixel(96),
          align: 'center',
          sortable: true,
          renderCell: (row) => <MessBadge mess={row.mess} />,
        },
      ].filter(Boolean),
    [t, isCompact]
  );

  const visible = sortedData.slice(0, MAX_ROWS);

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader padding={6} hasDivider>
          <HStack gap={3} vAlign="end" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={1}>
                <Heading level={1}>{t('nav_files')}</Heading>
                <Text type="supporting" color="secondary">
                  {t('files_count', { count: filtered.length })}
                </Text>
              </VStack>
            </StackItem>
            <TextInput
              label={t('files_search')}
              isLabelHidden
              placeholder={t('files_search')}
              startIcon={SearchIcon}
              value={query}
              onChange={setQuery}
              hasClear
              width={280}
            />
            <Selector
              label={t('files_language')}
              isLabelHidden
              options={languageOptions}
              value={language}
              onChange={setLanguage}
              width={180}
            />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={0} isScrollable={false}>
          {/* The table's own wrapper scrolls, so its sticky header stays in view. */}
          <div className="table-pane">
            <Table
              className="click-table"
              data={visible}
              columns={columns}
              idKey="id"
              density="balanced"
              hasHover
              plugins={{ sort: sortPlugin, click: clickPlugin }}
            />
            {sortedData.length > MAX_ROWS && (
              <div className="table-pane-footer">
                <Text type="supporting" color="secondary">
                  {t('list_truncated', { shown: MAX_ROWS, total: sortedData.length })}
                </Text>
              </div>
            )}
          </div>
        </LayoutContent>
      }
      end={
        selected ? (
          <LayoutPanel
            width={480}
            hasDivider
            padding={0}
            role="complementary"
            label={selected.filePath}
          >
            <FileDetail
              file={selected}
              onClose={() => onSelectFile(null)}
              onReview={() => onReview(selected.filePath)}
              isReviewing={isReviewing}
            />
          </LayoutPanel>
        ) : undefined
      }
    />
  );
}
