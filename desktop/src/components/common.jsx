import { Card } from '@astryxdesign/core/Card';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { TONE_BADGE, fmt, tone } from '../score.js';
import { useT } from '../i18n.js';

const TIME_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

/** "5 分钟前" in the app's language; Astryx Timestamp follows the system locale instead. */
export function RelativeTime({ value }) {
  const t = useT();
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const [unit, size] = TIME_UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? ['second', 1];
  const amount = unit === 'second' ? 0 : Math.round(seconds / size);
  const text = new Intl.RelativeTimeFormat(t.locale, { numeric: 'auto' }).format(amount, unit);
  return (
    <Text type="supporting" color="secondary">
      <time dateTime={value} title={date.toLocaleString(t.locale)}>
        {text}
      </time>
    </Text>
  );
}

export function SectionHeading({ title, hint, end }) {
  return (
    <HStack hAlign="between" vAlign="center" gap={3}>
      <HStack gap={2} vAlign="center">
        <Heading level={3}>{title}</Heading>
        {hint ? (
          <Text type="supporting" color="secondary">
            {hint}
          </Text>
        ) : null}
      </HStack>
      {end}
    </HStack>
  );
}

export function StatTile({ label, value, detail }) {
  return (
    <Card padding={4}>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          {label}
        </Text>
        <span className="stat-value">{value}</span>
        {detail ? (
          <Text type="supporting" color="secondary" maxLines={1}>
            {detail}
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

export function MessBadge({ mess }) {
  return <Badge variant={TONE_BADGE[tone(mess)]} label={fmt(mess)} />;
}

/** File path split into a bold name and a muted directory. */
export function FilePath({ path }) {
  const parts = path.split(/[\\/]/);
  const name = parts.pop();
  const dir = parts.join('/');
  return (
    <span className="file-path" title={path}>
      <span className="file-path-name">{name}</span>
      {dir && <span className="file-path-dir">{dir}</span>}
    </span>
  );
}
