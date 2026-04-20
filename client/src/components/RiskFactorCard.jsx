/**
 * RiskFactorCard - Shows a single risk factor with status
 */
export default function RiskFactorCard({ factor = {} }) {
  const {
    name = 'Factor',
    status = 'normal',
    description = 'No details available',
    detail,
    weight = null,
    icon = null,
  } = factor;

  const statusConfig = {
    danger: { bg: 'rgba(220, 38, 38, 0.12)', text: '#DC2626', label: 'Danger' },
    warning: { bg: 'rgba(217, 119, 6, 0.12)', text: '#D97706', label: 'Warning' },
    normal: { bg: 'rgba(22, 163, 74, 0.12)', text: '#16A34A', label: 'Normal' },
  };

  const statusKey = statusConfig[status] ? status : 'normal';
  const colors = statusConfig[statusKey];

  return (
    <div
      className="rounded-lg border bg-white p-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text)' }}
        >
          {icon || <span className="text-sm">*</span>}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {name}
              </h4>
              {weight !== null && weight !== undefined && (
                <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                  Weight: {weight}
                </p>
              )}
            </div>
            <span
              className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {colors.label}
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {detail || description}
          </p>
        </div>
      </div>
    </div>
  );
}
