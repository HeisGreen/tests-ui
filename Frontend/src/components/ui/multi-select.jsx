import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "../../lib/utils"

const MultiSelect = React.forwardRef(({
  options = [],
  selected = [],
  onSelectionChange,
  placeholder = "Select options...",
  className,
  searchable = true,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const containerRef = React.useRef(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const toggleOption = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onSelectionChange?.(newSelected)
  }

  const removeOption = (e, value) => {
    e.stopPropagation()
    onSelectionChange?.(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => {
    return options.find((o) => o.value === value)?.label || value
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} {...props}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-xl border-2 border-black/[0.08] bg-white/90 px-3 py-2 text-[0.875rem] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300",
          "hover:border-[#32d74b]/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]",
          isOpen && "border-[#32d74b] ring-4 ring-[#32d74b]/10",
        )}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5 pr-2">
          {selected.length > 0 ? (
            selected.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded-full bg-[#32d74b]/10 px-2.5 py-1 text-xs font-medium text-[#32d74b] border border-[#32d74b]/20"
              >
                {getLabel(value)}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, value)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-[#32d74b]/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[#86868b]/60 italic">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#86868b] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[1000] mt-1 overflow-hidden rounded-xl border-2 border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-black/[0.06] p-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-lg border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm outline-none focus:border-[#32d74b]/50 focus:ring-2 focus:ring-[#32d74b]/10 transition-all placeholder:text-[#86868b]/50"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-[250px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-[#86868b]">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                      isSelected
                        ? "bg-[#32d74b]/10 text-[#32d74b]"
                        : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        isSelected
                          ? "border-[#32d74b] bg-[#32d74b]"
                          : "border-[#86868b]/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={cn("flex-1", isSelected && "font-medium")}>
                      {option.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Selected Count Footer */}
          {selected.length > 0 && (
            <div className="border-t border-black/[0.06] px-3 py-2 text-xs text-[#86868b]">
              {selected.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  )
})

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
