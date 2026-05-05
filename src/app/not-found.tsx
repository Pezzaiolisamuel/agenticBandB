import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-600">404</p>
      <h1 className="mt-4 text-4xl text-brand-900">
        Page not found
      </h1>
      <p className="mt-4 max-w-xl text-lg text-stone-600">
        This scaffold includes the main public and admin routes, but the requested page
        could not be found.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Return to the homepage
      </Link>
    </main>
  );
}
