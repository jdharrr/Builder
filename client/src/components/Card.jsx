import React from 'react';

import '../css/global.css';

export const Card = ({children, title = null, className = '', bodyClassName = '', style = {}}) => {
    const cardClassName = `card m-5 p-3 ${className}`.trim();
    const cardBodyClassName = `card-body ${bodyClassName}`.trim();
    const cardStyle = {width: 'fit-content', ...style};

    return (
        <div className={cardClassName} style={cardStyle}>
            {title && <h1 className={'titleText text-center'}>{title}</h1>}
            <div className={cardBodyClassName} style={{maxWidth: '100%'}}>
                {children}
            </div>
        </div>
    );
}
