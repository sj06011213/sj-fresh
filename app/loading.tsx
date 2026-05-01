export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-6 flex justify-center">
        <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </header>

      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 flex-1 animate-pulse rounded-md bg-zinc-200/70 dark:bg-zinc-700/70"
          />
        ))}
      </div>

      <ul className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </ul>
    </main>
  )
}
