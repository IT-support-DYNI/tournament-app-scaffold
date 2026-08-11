export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-500">Tournament App</p>
        <h1 className="text-3xl font-bold tracking-tight">Project scaffold ready</h1>
        <p className="mt-3 text-slate-600">
          Next.js, TypeScript, Tailwind CSS, and Prisma are configured. The next step is
          building the tournament domain on top of this foundation.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {['Next.js App Router', 'Tailwind CSS', 'Prisma + PostgreSQL'].map((item) => (
            <div key={item} className="rounded-lg bg-slate-100 p-3 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
