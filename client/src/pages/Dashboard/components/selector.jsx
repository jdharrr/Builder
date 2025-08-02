import React, {useEffect, useRef} from 'react';

import '../css/selector.css';

export const Selector = ({ options, handleSelect, handleClose }) => {
    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose]);

    return (
      <div className="selectorWrapper" ref={wrapperRef}>
          <select onChange={handleSelect}>
              <option value="">Select an action</option>
              {options.map((option, i) => (
                <option value={option} key={i} >{option}</option>
              ))}
          </select>
      </div>
    );
}