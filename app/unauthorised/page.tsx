import Link from "next/link";

export default function UnauthorisedPage() {
  return (
    <main id="main" className="operator-shell flex min-h-screen items-center">
      <section className="card w-full p-7">
        <p className="eyebrow">Access restricted</p>
        <h1 className="page-title mt-4">That area isn’t available to your role.</h1>
        <p className="muted mt-4">Your account remains signed in. Return to an area you can access.</p>
        <Link href="/operator" className="btn btn-primary mt-7 w-full">Return to operator app</Link>
      </section>
    </main>
  );
}
