"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only use portals client-side
  useEffect(() => setMounted(true), []);

  // Compute position from trigger rect.
  // Portal renders at document.body so position:fixed is always viewport-relative,
  // even inside Dialog (backdrop-filter) or overflow:auto scroll containers.
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const panelHeight = 280;
    const openUpward = spaceBelow < panelHeight && rect.top > panelHeight;
    setPanelStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
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

  // Close on outside click (checks both trigger and portal panel)
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

  // Close on outside scroll, reposition on resize.
  // Ignore scroll events inside the panel itself (user scrolling the options list).
  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => calcPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, calcPosition]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
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

  const panel = (
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
  );

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

      {/* Panel rendered via portal so it escapes overflow:auto AND backdrop-filter containers */}
      {isOpen && mounted && createPortal(panel, document.body)}
    </div>
  );
}
