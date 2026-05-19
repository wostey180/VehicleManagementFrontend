import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="w-full bg-[#0C0B0A] border border-[#3A3530] rounded-lg px-4 py-3 text-sm text-left outline-none focus:border-[#C97B4A] transition-colors font-[DM_Sans] flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: open ? "#C97B4A" : undefined }}
      >
        <span className={selected ? "text-[#EDEAE4]" : "text-[#9A9490]/50"}>
          {selected ? (
            <span>
              {selected.label}
              {selected.sublabel && (
                <span className="text-[#9A9490] ml-2 text-xs">{selected.sublabel}</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              className="text-[#9A9490] hover:text-[#F09595] transition-colors cursor-pointer p-0.5"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#9A9490] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1A1815] border border-[#3A3530] rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#3A3530]">
            <Search size={13} className="text-[#9A9490] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-[#EDEAE4] placeholder-[#9A9490]/50 outline-none font-[DM_Sans]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[#9A9490] hover:text-[#EDEAE4]">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#9A9490] font-[DM_Sans] text-center">
                No results found
              </li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    opt.value === value
                      ? "bg-[#C97B4A]/15 text-[#C97B4A]"
                      : "text-[#EDEAE4] hover:bg-[#3A3530]/40"
                  }`}
                >
                  <span className="text-sm font-[DM_Sans]">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-xs text-[#9A9490] font-[DM_Sans] shrink-0">
                      {opt.sublabel}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
