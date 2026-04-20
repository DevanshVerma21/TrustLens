/**
 * LoadingSkeletons - Skeleton screens for loading states
 */
const blockStyle = { backgroundColor: 'var(--color-border-light)' };

const SkeletonBlock = ({ className, style }) => (
  <div
    className={`${className} animate-pulse rounded`}
    style={{ ...blockStyle, ...style }}
  />
);

export function CardSkeleton() {
  return (
    <div
      className="rounded-lg border bg-white p-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <SkeletonBlock className="h-4 w-2/3 mb-3" />
      <SkeletonBlock className="h-8 w-full mb-3" />
      <SkeletonBlock className="h-4 w-1/2" />
    </div>
  );
}

export function ChartSkeleton({ height = 220 }) {
  return (
    <div
      className="rounded-lg border bg-white p-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <SkeletonBlock className="h-4 w-1/3 mb-4" />
      <SkeletonBlock className="w-full" style={{ height }} />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      {[1, 2, 3, 4, 5].map((cell) => (
        <td key={cell} className="px-4 py-3">
          <SkeletonBlock className="h-4 w-24" />
        </td>
      ))}
    </tr>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CardSkeleton />
          <ChartSkeleton height={200} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div
            className="rounded-lg border bg-white p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <SkeletonBlock className="h-4 w-1/4 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton height={240} />
      <div
        className="rounded-lg border bg-white overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <table className="w-full">
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border bg-white p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <SkeletonBlock className="h-4 w-1/3 mb-2" />
          <SkeletonBlock className="h-3 w-2/3 mb-4" />
          <SkeletonBlock className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function PrivacySkeleton() {
  return (
    <div className="space-y-6">
      <ChartSkeleton height={240} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function FraudSimulationSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  CardSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  DashboardSkeleton,
  TransactionsSkeleton,
  AlertsSkeleton,
  PrivacySkeleton,
  FraudSimulationSkeleton,
};
