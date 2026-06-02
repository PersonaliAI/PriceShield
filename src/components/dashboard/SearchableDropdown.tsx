"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  className = "",
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute fixed position from the trigger's bounding rect so the panel
  // escapes any overflow:auto/hidden ancestor (e.g. the dashboard <main>).
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const panelHeight = 280; // approx max: search box ~44px + options max-h-56 ~224px
    const openUpward = spaceBelow < panelHeight && rect.top > panelHeight;
    setPanelStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, []);

  const openDropdown = () => {
    calcPosition();
    setIsOpen(true);
    setSearch("");
  };

  const closeDropdown = () => setIsOpen(false);

  const toggleDropdown = () => (isOpen ? closeDropdown() : openDropdown());

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      closeDropdown();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  // Close + reposition on scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => closeDropdown();
    const onResize = () => calcPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, calcPosition]);

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const handleSelect = (val: string) => {
    onChange(val);
    closeDropdown();
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className="w-full h-11 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex items-center justify-between text-sm transition-all select-none cursor-pointer"
      >
        <span className={selectedOption ? "text-foreground truncate" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Panel — position:fixed so it's never clipped by overflow:auto parents */}
      {isOpen && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="rounded-xl bg-zinc-950/95 border border-zinc-800/80 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Search */}
          <div className="relative flex items-center px-2 py-1.5 border-b border-zinc-900/80">
            <Search className="absolute left-4 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-zinc-900/80 border border-zinc-800/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 font-medium"
                        : "text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                    }`}
                  >
                    <span className="truncate pr-4">{opt.label}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
