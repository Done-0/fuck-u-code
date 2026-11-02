/**
 * Microsoft Fluent Emoji 3D (MIT, see assets/emoji/LICENSE), shipped as images
 * so they look the same on Windows, macOS and Linux.
 */

const files = import.meta.glob('../assets/emoji/*.png', { eager: true, import: 'default' });
const EMOJI = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.png', ''), url])
);

export function Emoji({ name, size = 24, label, className }) {
  return (
    <img
      src={EMOJI[name]}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={`emoji${className ? ` ${className}` : ''}`}
      draggable={false}
    />
  );
}

/** A quality level's emoji; the top level wears a crown. */
export function LevelEmoji({ level, size = 24, className }) {
  if (!level.crowned) return <Emoji name={level.icon} size={size} className={className} />;
  return (
    <span
      className={`crowned${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
    >
      <Emoji name={level.icon} size={size} />
      <Emoji name="crown" size={Math.round(size * 0.6)} className="crowned-crown" />
    </span>
  );
}
