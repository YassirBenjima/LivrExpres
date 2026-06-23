import React, { useState, useRef, useEffect } from 'react';

/**
 * KtSelect - Replicates the exact Metronic UI / ktui select markup structure.
 * This hooks directly into the styles in public/assets/css/styles.css.
 */
export default function KtSelect({ value, onChange, options, placeholder, className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);
  const isPlaceholder = !selectedOption;
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          className="kt-select-dropdown absolute z-50 w-full"
          style={{
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
          }}
        >
          {/* Options Container - Replicates .kt-select-options */}
          <div className="kt-select-options max-h-[250px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`kt-select-option${isSelected ? ' focusedHighlighted' : ''}`}
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}
