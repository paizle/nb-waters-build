import './SelectWater.scss'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useCombobox } from 'downshift'
import { XCircleIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import useDebounce from '../../Hooks/useDebounce'

export default function FeatureSelect({
  items,
  selectItemId,
  selectedItemId,
}) {

  const parentRef = useRef()

  const [isWaiting, setIsWaiting] = useState(true)

  const [inputValue, setInputValue] = useState('')

  const debouncedInputValue = useDebounce(inputValue, 500)

  const scrollToSelected = useRef(null)

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getItemProps,
  } = useCombobox({
    onInputValueChange(e) {
      const { stateChangeTypes } = useCombobox
      if (e.type === stateChangeTypes.InputBlur) {
        return
      } else if (
        e.type === stateChangeTypes.ItemClick ||
        e.type === stateChangeTypes.InputKeyDownEnter
      ) {
        selectItemId(e.selectedItem.id)
      } else if (e.type === stateChangeTypes.InputChange) {
        setInputValue(e.inputValue)
      } else {
        selectItemId(e.selectedItem.id)
      }
    },
    onSelectedItemChange: (e) => {
      selectItemId(e.selectedItem.id)
    },
    inputValue,
    items,
    itemToString(item) {
      return item ? item.name : ''
    },
  })

  

  const renderedItems = useMemo(() => {
    const search = debouncedInputValue.toLowerCase().trim()

    const tempItems = search
      ? items.filter((item) => search ? selectedItemId === item.id || item.name.toLowerCase().includes(search) : item)
      : items

    return tempItems
      .map((item) => (
        <button
          className={`${item.id === selectedItemId ? 'selected' : ''}`}
          key={item.id}
          data-id={item.id}
          {...getItemProps({ item, index: items.findIndex(i => i.id === item.id) })}
        >
          {item.name}
        </button>
      ));
  }, [items, selectedItemId, getItemProps, debouncedInputValue]);

  useEffect(() => {
    if (inputValue === debouncedInputValue) {
      setIsWaiting(false)
    } else {
      setIsWaiting(true)
    }
    
  }, [inputValue, debouncedInputValue, renderedItems])

  const clearSelection = () => {
    if (inputValue) {
      setInputValue('')
    } else {
      selectItemId(null)
    }
  }

  useEffect(() => {
    if (parentRef.current && selectedItemId) {
      if (scrollToSelected.current) {
        clearTimeout(scrollToSelected.current)
      }
      scrollToSelected.current = setTimeout(() => {
          scrollToSelected.current = null
          parentRef.current
            .querySelector(`[data-id="${selectedItemId}"]`)
            .scrollIntoView({ behavior: 'instant' });
        }, 10)
    }
  }, [selectedItemId, scrollToSelected, renderedItems])

  return (
    <div className={`SelectWater`} ref={parentRef}>
      <div className="input" {...getLabelProps()}>
          <input
            placeholder={'Search by Water Name'}
            {...getInputProps()}
          />
          <button
            className="clear-selection"
            aria-label="Clear Selection"
            type="button"
            onClick={clearSelection}
          >
            {isWaiting 
              ? <LoadingSpinner />
              : <XCircleIcon /> 
            }
            
          </button>
      </div>
    
      <div className={`menu ${isOpen ? 'open' : ''}`} {...getMenuProps()}>
        {renderedItems}
      </div>
    </div>
  )
}