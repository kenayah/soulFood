import type { Child } from "hono/jsx"

export function Pagination({
  page,
  total,
  limit,
  baseUrl,
  additionalParams,
}: {
  page: number
  total: number
  limit: number
  baseUrl: string
  additionalParams?: Record<string, string>
}) {
  const totalPages = Math.ceil(total / limit)
  if (total === 0) return null

  function href(p: number) {
    const params = new URLSearchParams(additionalParams ?? {})
    if (p > 1) params.set("page", String(p))
    return baseUrl + (params.toString() ? "?" + params.toString() : "")
  }

  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1)
    }
  }

  return (
    <div class="flex items-center justify-center gap-4 mt-4">
      <span class="text-sm text-base-content/50">{total} item{total !== 1 ? "s" : ""}</span>
      {totalPages > 1 && (
        <div class="join">
          {page > 1 && (
            <a href={href(page - 1)} class="join-item btn btn-sm">&laquo; Prev</a>
          )}
          {pages.map((p) =>
            p === -1 ? (
              <span class="join-item btn btn-sm btn-disabled">...</span>
            ) : (
              <a
                href={href(p)}
                class={"join-item btn btn-sm" + (p === page ? " btn-active" : "")}
              >
                {p}
              </a>
            ),
          )}
          {page < totalPages && (
            <a href={href(page + 1)} class="join-item btn btn-sm">Next &raquo;</a>
          )}
        </div>
      )}
      {totalPages <= 1 && page === 1 && (
        <span class="text-sm text-base-content/50">Page 1 of 1</span>
      )}
    </div>
  )
}
