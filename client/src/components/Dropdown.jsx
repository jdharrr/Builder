import React, {useEffect, useState} from 'react';

export const Dropdown = ({title, options, handleOptionChange, maxHeight, includeScrollbarY, changeTitleOnOptionChange}) => {
    const [styling, setStyling] = useState({});
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (maxHeight !== undefined && maxHeight) {
            setStyling((prevState) => ({
                ...prevState,
                maxHeight,     
            }));
        }
        
        if (includeScrollbarY !== undefined && includeScrollbarY) {
            setStyling((prevState) => ({
                ...prevState,
                overflowY: 'auto',
            }))
        }
    }, [includeScrollbarY, maxHeight]);

    const handleChange = (e, name, label) => {
        if (changeTitleOnOptionChange) {
            label !== undefined ? setSelectedOption(label) : setSelectedOption(name);
        }

        handleOptionChange(e, name);
    }

    return (
        <div className="dropdown">
            <button className="btn dropdown-toggle border-dark-subtle" type="button"
                    data-bs-toggle="dropdown"
            >
                {changeTitleOnOptionChange && selectedOption ? selectedOption : title}
            </button>
            <ul className="dropdown-menu" style={styling} >
                {Array.isArray(options[0]) && options[0].length === 2 ?
                    options.map(([name, label], idx) => (
                    <li key={idx}>
                        <a className={"dropdown-item"} href={"#"}
                           onClick={(e) => handleChange(e, name, label)}>
                            {label}
                        </a>
                    </li>
                )) :
                   options.map((name, idx) => (
                   <li key={idx}>
                       <a className={"dropdown-item"} href={"#"}
                          onClick={(e) => handleChange(e, name)}>
                           {name}
                       </a>
                   </li>
                ))}
            </ul>
        </div>
    );
}