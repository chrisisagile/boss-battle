import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center px-6 py-16">
      <div className="max-w-3xl">
        <p className="font-medium text-amber-300 text-sm uppercase tracking-[0.24em]">
          Boss Battle
        </p>
        <h1 className="mt-6 font-semibold text-5xl text-stone-50 tracking-tight sm:text-6xl">
          Clean application base. No demo routes, no fake data.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-stone-300 leading-8">
          The starter scaffold has been stripped back to a single route and the
          shared TanStack plumbing. Use this as the starting point for real
          screens, real data flows, and actual domain code.
        </p>
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <StatusCard
          title="Routing"
          body="File-based TanStack Router is still in place with a single home route."
        />
        <StatusCard
          title="Data"
          body="Mock endpoints, seed arrays, and the fake Convex todo list are gone."
        />
        <StatusCard
          title="Infra"
          body="Convex is still wired through AppHost, but the schema starts empty so you can build real features on it."
        />
      </section>
    </main>
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur">
      <h2 className="font-semibold text-lg text-stone-100">{title}</h2>
      <p className="mt-2 text-sm text-stone-300 leading-6">{body}</p>
    </article>
  );
}
