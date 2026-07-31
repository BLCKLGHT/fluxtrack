export default function DashboardLoading() {
  return (
    <main aria-label="Loading section">
      <div className="h-3 w-28 animate-pulse rounded bg-[#dfe7e2]" />
      <div className="mt-4 h-11 w-72 animate-pulse rounded-xl bg-[#dfe7e2]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[20px] bg-[#eef3ef]" />)}
      </div>
    </main>
  );
}
