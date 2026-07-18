// Generic server-side pagination/search/sort over an already-fetched array.
// Use this (plus <PaginationControls>) whenever a module lists "too many"
// records — don't ship the full array to the client and filter/sort there.
export type SortDir = "asc" | "desc";

export type PageParams = {
  page: number;
  pageSize: number;
  search: string;
  sortField: string;
  sortDir: SortDir;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

export function parsePageParams(
  searchParams: SearchParamsInput,
  opts: { prefix?: string; defaultSort: string; defaultDir?: SortDir; pageSize?: number },
): PageParams {
  const prefix = opts.prefix ?? "";
  const get = (key: string) => {
    const value = searchParams[`${prefix}${key}`];
    return Array.isArray(value) ? value[0] : value;
  };

  const rawDir = get("dir");
  return {
    page: Math.max(1, Number(get("page")) || 1),
    pageSize: opts.pageSize ?? 20,
    search: get("q") ?? "",
    sortField: get("sort") ?? opts.defaultSort,
    sortDir: rawDir === "asc" || rawDir === "desc" ? rawDir : (opts.defaultDir ?? "asc"),
  };
}

export type PaginatedResult<T> = {
  rows: T[];
  page: number;
  totalCount: number;
  totalPages: number;
};

export function paginate<T extends Record<string, unknown>>(
  all: T[],
  params: PageParams,
  searchKeys: (keyof T)[],
): PaginatedResult<T> {
  const q = params.search.trim().toLowerCase();
  const filtered = q
    ? all.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q)),
      )
    : all;

  const sorted = [...filtered].sort((a, b) => {
    const va = a[params.sortField as keyof T];
    const vb = b[params.sortField as keyof T];
    const cmp =
      typeof va === "string" && typeof vb === "string"
        ? va.localeCompare(vb)
        : (Number(va) || 0) - (Number(vb) || 0);
    return params.sortDir === "asc" ? cmp : -cmp;
  });

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.pageSize;

  return { rows: sorted.slice(start, start + params.pageSize), page, totalCount, totalPages };
}
