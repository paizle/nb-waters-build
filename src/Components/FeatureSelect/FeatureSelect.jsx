import './FeatureSelect.scss'
import { useState, useMemo } from 'react'
import Downshift, { useCombobox } from 'downshift'

export default function FeatureSelect({
  items,
  selectItem,
  getName,
  getKey,
  inputRef,
	onFocus,
	onBlur
}) {

  const [inputValue, setInputValue] = useState('')

  const {
      isOpen,
      getLabelProps,
      getMenuProps,
      getInputProps,
      highlightedIndex,
      getItemProps,
      selectedItem,
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
      inputValue,
      items,
      itemToString(item) {
        return item.name
      },
    })

  const renderedItems = useMemo(() => {
    return items.map((item, index) => (
      <button
        className={`${item === selectedItem ? 'selected' : ''}`}
        key={item.id}
        {...getItemProps({ item, index })}
      >
        {item.name}
      </button>
    ));
  }, [items, selectedItem, getItemProps, getKey, getName]);

  
  return (
    <div className={`FeatureSelect`}>
      <div className="input" {...getLabelProps()}>
        
          <input
            placeholder={'placeholder'}
            
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
        <button
          className={`${!selectedItem ? 'selected' : ''}`}
          key=""
          value=""
        >
          (select a water body)
        </button>
        {renderedItems}
      </div>
    </div>
  )
}