import React, { useState, useRef, useEffect } from 'react';

/**
 * KtSelect - Replicates the exact Metronic UI / ktui select markup structure.
 * This hooks directly into the styles in public/assets/css/styles.css.
 */
export default function KtSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder, 
  className = '', 
  enableSearch = false, 
  searchPlaceholder = "Rechercher..." 
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find(o => o.value === value);
  const isPlaceholder = !selectedOption;
  
  const displayLabel = selectedOption 
    ? (typeof selectedOption.label === 'object' ? JSON.stringify(selectedOption.label) : selectedOption.label)
    : placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Prepend placeholder option if it exists and there isn't already an option with value === ''
  const hasEmptyOption = safeOptions.some(o => o.value === '');
  const selectOptions = placeholder && !hasEmptyOption 
    ? [{ value: '', label: placeholder }, ...safeOptions]
    : safeOptions;

  const filteredOptions = searchQuery.trim() === ''
    ? selectOptions
    : selectOptions.filter(o => 
        String(o.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(o.value).toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div
      ref={containerRef}
      className={`kt-select-wrapper relative ${className}`}
      style={{ zIndex: open ? 100 : undefined }}
    >
      {/* Trigger Button - Replicates .kt-select-display.kt-select */}
      <div
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`kt-select-display kt-select${open ? ' active' : ''}`}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className={isPlaceholder ? 'kt-select-placeholder' : 'kt-select-option-text'}>
          {displayLabel}
        </span>
      </div>

      {/* Dropdown Menu - Replicates .kt-select-dropdown */}
      {open && (
        <div
          className="kt-select-dropdown absolute z-50 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden"
          style={{
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
          }}
        >
          {/* Search container */}
          {enableSearch && (
            <div className="kt-select-search bg-white dark:bg-zinc-950 relative flex items-center">
              <input
                type="text"
                style={{
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                  width: '100%',
                  padding: '6px 0',
                  fontSize: '14px',
                }}
                className="text-zinc-800 dark:text-zinc-200"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on click
                autoFocus
              />
            </div>
          )}

          {/* Options Container - Replicates .kt-select-options */}
          <div 
            className="kt-select-options overflow-y-auto"
            style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-4 text-sm text-zinc-400 text-center">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`kt-select-option${isSelected ? ' highlighted' : ''}`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent)' : undefined,
                      color: isSelected ? 'var(--accent-foreground)' : undefined,
                    }}
                  >
                    <span className="kt-select-option-text">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
