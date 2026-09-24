"use client";

import { useEffect, useState } from "react";

interface SearchBarProps {
  placeholder: string;
  onSubmit: (query: string) => void;
  initialValue?: string;
}

export function SearchBar({ placeholder, onSubmit, initialValue = "" }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 rounded border border-hairline bg-surface px-4 py-2.5 text-sm text-ivory placeholder:text-muted/60 focus:border-signal focus:outline-none"
      />
      <button
        type="submit"
        className="rounded bg-signal px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
