import React from 'react';

import '../css/global.css';

export const Card = ({children, title = null}) => {
    return (
        <div className="card m-5 p-3" style={{width: "fit-content"}}>
            {title && <h1 className={'titleText text-center'}>{title}</h1>}
            <div className="card-body" style={{maxWidth: '100%'}}>
                {children}
            </div>
        </div>
    );
}