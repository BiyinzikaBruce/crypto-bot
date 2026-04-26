export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-48 rounded-xl bg-muted/40" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/40" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted/40" />
    </div>
  );
}
