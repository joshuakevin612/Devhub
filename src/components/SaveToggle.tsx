"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/Button";

interface SaveToggleProps {
  saved: boolean;
  onChange?: (saved: boolean) => void;
  addPath: string;
  addBody: Record<string, unknown>;
  removePath: string;
}

/**
 * Favorite/bookmark toggle shared by developer and repo detail pages.
 * Optimistically flips state on success; surfaces the API error inline
 * rather than failing silently.
 */
export function SaveToggle({ saved, onChange, addPath, addBody, removePath }: SaveToggleProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <Button variant="secondary" onClick={() => router.push("/login")}>
        Sign in to save
      </Button>
    );
  }

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      if (isSaved) {
        await apiDelete(removePath);
        setIsSaved(false);
        onChange?.(false);
      } else {
        await apiPost(addPath, addBody);
        setIsSaved(true);
        onChange?.(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={isSaved ? "secondary" : "primary"} loading={loading} onClick={toggle}>
        {isSaved ? "Saved" : "Save"}
      </Button>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
