/**
 * Safe pagination parser — clamps page and perPage to valid ranges.
 * Prevents oversized queries (perPage=999999) and negative values.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; perPage?: number; maxPerPage?: number } = {}
) {
  const { page: defaultPage = 1, perPage: defaultPerPage = 20, maxPerPage = 100 } = defaults;

  const rawPage = parseInt(searchParams.get("page") ?? String(defaultPage), 10);
  const rawPerPage = parseInt(searchParams.get("perPage") ?? String(defaultPerPage), 10);

  return {
    page: Math.max(1, isNaN(rawPage) ? defaultPage : rawPage),
    perPage: Math.min(maxPerPage, Math.max(1, isNaN(rawPerPage) ? defaultPerPage : rawPerPage)),
  };
}
