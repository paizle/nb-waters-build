import './SelectWater.scss'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCombobox } from 'downshift'
import { useVirtualizer } from '@tanstack/react-virtual'
import { XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import useWaterSearch from '../../Hooks/useWaterSearch'

const ROW_HEIGHT = 34

/**
 * Searchable, virtualized water picker. Filtering runs against the in-memory
 * index (via `useWaterSearch`); only the visible rows are rendered, so even
 * 17k results stay smooth. The menu opens upward from the footer.
 */
export default function SelectWater({ items, selectedId, onSelect }) {
  const [inputValue, setInputValue] = useState('')
  const filtered = useWaterSearch(items, inputValue)
  const listRef = useRef(null)

  // Reflect external selection (e.g. clicking the map) in the input.
  useEffect(() => {
    const selected = items.find((item) => item.id === selectedId)
    setInputValue(selected ? selected.name : '')
  }, [selectedId, items])

  const {
    isOpen,
    highlightedIndex,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
  } = useCombobox({
    items: filtered,
    inputValue,
    itemToString: (item) => item?.name ?? '',
    onInputValueChange: ({ inputValue: value, type }) => {
      if (type === useCombobox.stateChangeTypes.InputChange) setInputValue(value ?? '')
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onSelect(selectedItem.id)
    },
  })

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })

  useEffect(() => {
    if (isOpen) rowVirtualizer.measure()
  }, [isOpen, rowVirtualizer])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) rowVirtualizer.scrollToIndex(highlightedIndex)
  }, [isOpen, highlightedIndex, rowVirtualizer])

  const virtualRows = rowVirtualizer.getVirtualItems()
  const hasResults = filtered.length > 0
  const showMenu = isOpen && hasResults

  const placeholder = useMemo(
    () => (items.length ? `Search ${items.length.toLocaleString()} waters` : 'Search waters'),
    [items.length]
  )

  const clear = () => {
    setInputValue('')
    onSelect(null)
  }

  return (
    <div className="SelectWater">
      <ul className={`menu ${showMenu ? 'open' : ''}`} {...getMenuProps({ ref: listRef })}>
        {showMenu && (
          <li className="menu-spacer" style={{ height: rowVirtualizer.getTotalSize() }}>
            {virtualRows.map((row) => {
              const item = filtered[row.index]
              const isSelected = item.id === selectedId
              const isHighlighted = highlightedIndex === row.index
              return (
                <div
                  key={item.id}
                  className={`option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  style={{ height: row.size, transform: `translateY(${row.start}px)` }}
                  {...getItemProps({ item, index: row.index })}
                >
                  {item.name}
                </div>
              )
            })}
          </li>
        )}
      </ul>

      <div className="input">
        <button type="button" className="icon search" {...getToggleButtonProps()} aria-label="Open list">
          <MagnifyingGlassIcon />
        </button>
        <input {...getInputProps()} placeholder={placeholder} />
        {inputValue && (
          <button type="button" className="icon clear" onClick={clear} aria-label="Clear selection">
            <XCircleIcon />
          </button>
        )}
      </div>
    </div>
  )
}
