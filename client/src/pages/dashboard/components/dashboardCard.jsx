import React from 'react';

import '../css/dashboardCard.css';

export const Card = ({ title, children}) => {
    return (
        <div className="card">
            <h1 className={'titleText'}>{title}</h1>
            {children}
        </div>
    );
}