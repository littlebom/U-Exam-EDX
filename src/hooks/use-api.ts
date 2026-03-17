"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { PaginationMeta } from "@/types";

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error?.message ?? "Unknown error");
  }
  return json;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

interface UseListParams {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
  [key: string]: string | number | undefined;
}

export function useList<T>(
  key: string,
  endpoint: string,
  params: UseListParams = {}
) {
  const queryString = buildQueryString(params);
  const url = `${endpoint}${queryString ? `?${queryString}` : ""}`;

  return useQuery<PaginatedResult<T>>({
    queryKey: [key, params],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `API error ${res.status}`);
      }
      const json = await res.json();
      return {
        data: json.data ?? [],
        meta: json.meta ?? { page: 1, perPage: 20, total: 0, totalPages: 0 },
      };
    },
  });
}

export function useDetail<T>(
  key: string,
  endpoint: string,
  enabled = true
) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => {
      const json = await apiFetch<{ data: T }>(endpoint);
      return (json as { data: T }).data;
    },
    enabled,
  });
}

export function useSimpleList<T>(key: string, endpoint: string) {
  return useQuery<T[]>({
    queryKey: ["simple", key],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      return json.data ?? [];
    },
  });
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null
  );
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}
