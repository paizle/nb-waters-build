import './SelectWater.scss'
import { useState, useMemo, useEffect, useRef } from 'react'
import Downshift, { useCombobox } from 'downshift'

export default function FeatureSelect({
  items,
  selectItem,
  selectedItemId,
  getName,
  getKey,
  inputRef,
	onFocus,
	onBlur
}) {

  const parentRef = useRef()

  const [inputValue, setInputValue] = useState('')

  const [selectedItem, setSelectedItem] = useState(selectedItemId ? items.filter((item) => item.id === selectedItemId) : null)

  useEffect(() => {
    if (selectedItemId !== selectItem.id) {
      const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) : null
      setSelectedItem(selectedItem)

      if (parentRef.current && selectedItem) {
        setTimeout(() => {
          parentRef.current.querySelector(`[data-id="${selectedItem.id}"]`).scrollIntoView({ behavior: 'smooth' });
        }, 10)
      }
      
      
    }
  }, [selectedItemId])

  const {
      isOpen,
      getLabelProps,
      getMenuProps,
      getInputProps,
      highlightedIndex,
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
          //setSelectedItem(e.selectedItem)
          selectItem(e.selectedItem)
        } else if (e.type === stateChangeTypes.InputChange) {
          setInputValue(e.inputValue)
        } else {
          //setSelectedItem(e.selectedItem)
          selectItem(e.selectedItem)
        }
      },
      inputValue,
      items,
      selectedItem,
      itemToString(item) {
        return item.name
      },
    })

  const renderedItems = useMemo(() => {
    const search = inputValue.toLowerCase().trim()

    const tempItems = search 
      ? items.filter((item) => search ? selectedItem === item || item.name.toLowerCase().includes(search) : item)
      : items

    return tempItems
      .map((item) => (
        <button
          className={`${item === selectedItem ? 'selected' : ''}`}
          key={item.id}
          data-id={item.id}
          {...getItemProps({ item, index: items.findIndex(i => i.id === item.id) })}
        >
          {item.name}
        </button>
      ));
  }, [items, selectedItem, getItemProps, getKey, getName, inputValue]);

  return (
    <div className={`SelectWater`} ref={parentRef}>
      <div className="input" {...getLabelProps()}>
        
          <input
            placeholder={'Search by Water Name'}
            
            {...getInputProps()}
          />
          {/*
          <button
            className="clear-input"
            aria-label="Clear Search"
            type="button"
            onClick={clearSearch}
          >
            <XCircleIcon />
          </button>
          */}
      </div>
    
      <div className={`menu ${isOpen ? 'open' : ''}`} {...getMenuProps()}>
        {renderedItems}
      </div>
    </div>
  )
}