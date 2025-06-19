import './SelectWater.scss'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useCombobox } from 'downshift'
import { XCircleIcon } from '@heroicons/react/24/outline'

export default function FeatureSelect({
  items,
  selectItem,
  selectedItemId,
}) {

  const parentRef = useRef()

  const [inputValue, setInputValue] = useState('')

  const [shouldScroll, setShouldScroll] = useState(true)

  const scrollToSelection = () => {
    if (shouldScroll) {
      setTimeout(() => {
        parentRef.current
          .querySelector(`[data-id="${selectedItemId}"]`)
          .scrollIntoView({ behavior: 'instant' });
      }, 10)
    } else {
      setShouldScroll(true)
    }
  }

  useEffect(() => {
    if (parentRef.current && selectedItemId) {
      scrollToSelection()
    }
  }, [parentRef.current, selectedItemId])

  const {
      isOpen,
      getLabelProps,
      getMenuProps,
      getInputProps,
      getItemProps,
      stateChangeTypes,
    } = useCombobox({
      onInputValueChange(e) {
        const { stateChangeTypes } = useCombobox
        if (e.type === stateChangeTypes.InputBlur) {
          return
        } else if (
          e.type === stateChangeTypes.ItemClick ||
          e.type === stateChangeTypes.InputKeyDownEnter
        ) {
          selectItem(e.selectedItem)
        } else if (e.type === stateChangeTypes.InputChange) {
          setInputValue(e.inputValue)
        } else {
          selectItem(e.selectedItem)
        }
      },
      onSelectedItemChange: (e) => {
        setShouldScroll(false)
        selectItem(e.selectedItem)
      },
      inputValue,
      items,
      itemToString(item) {
        return item ? item.name : ''
      },
    })

  const getCustomItemProps = (options) => {
    
    const props = getItemProps(options)
    
    const newProps = {
      ...props,
      onMouseMove: null
    }
    
    return newProps
  }
    

  const renderedItems = useMemo(() => {
    const search = inputValue.toLowerCase().trim()

    const tempItems = search 
      ? items.filter((item) => search ? selectedItemId === item.id || item.name.toLowerCase().includes(search) : item)
      : items

    return tempItems
      .map((item) => (
        <button
          className={`${item.id === selectedItemId ? 'selected' : ''}`}
          key={item.id}
          data-id={item.id}
          {...getCustomItemProps({ item, index: items.findIndex(i => i.id === item.id) })}
        >
          {item.name}
        </button>
      ));
  }, [items, selectedItemId, getItemProps, inputValue]);

  const clearSelection = () => {
    if (inputValue) {
      setInputValue('')
      scrollToSelection()
    } else {
      selectItem(null)
    }
  }

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
            <XCircleIcon />
          </button>
      </div>
    
      <div className={`menu ${isOpen ? 'open' : ''}`} {...getMenuProps()}>
        {renderedItems}
      </div>
    </div>
  )
}