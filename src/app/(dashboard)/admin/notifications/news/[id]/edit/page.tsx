"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { NewsForm } from "@/components/news/news-form";

export default function EditNewsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["news-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/news/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        ไม่พบข่าวสาร
      </div>
    );
  }

  return <NewsForm mode="edit" initialData={data.data} />;
}
