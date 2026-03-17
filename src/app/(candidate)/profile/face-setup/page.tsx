"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Face setup page — redirects to /profile where the FaceImageCard lives.
 * Kept for backward compatibility (verify page redirects here when no face image).
 */
export default function FaceSetupPage() {
  const router = useRouter();

  useEffect(() => {
    toast.info("กรุณาตั้งค่ารูปใบหน้าในหน้าโปรไฟล์");
    router.replace("/profile");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
