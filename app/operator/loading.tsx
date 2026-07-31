export default function OperatorLoading() {
  return (
    <main className="operator-shell" aria-label="Loading section">
      <div className="mt-8 h-3 w-28 animate-pulse rounded bg-[#dfe7e2]" />
      <div className="mt-4 h-10 w-56 animate-pulse rounded-xl bg-[#dfe7e2]" />
      <div className="mt-8 grid gap-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-[20px] bg-[#eef3ef]" />)}
      </div>
    </main>
  );
}
