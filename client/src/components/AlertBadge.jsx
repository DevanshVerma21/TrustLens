/**
 * AlertBadge - Notification dot with count
 */
export default function AlertBadge({ count = 0, inline = true, className = '' }) {
  if (!count || count === 0) {
    return null;
  }

  const display = count > 99 ? '99+' : count;

  return (
    <span
      className={`${inline ? 'inline-flex' : 'absolute'} items-center justify-center rounded-full text-[10px] font-semibold ${className}`}
      style={{
        minWidth: '18px',
        height: '18px',
        padding: '0 6px',
        backgroundColor: 'var(--color-danger)',
        color: 'white',
      }}
    >
      {display}
    </span>
  );
}
