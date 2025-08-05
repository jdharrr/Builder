import React from 'react';

import '../css/dashboardCard.css';

export const Card = ({ title, customComponent: CustomComponent, customProps }) => {
    return (
        <div className="card">
            <h1>{title}</h1>
            {CustomComponent && <CustomComponent {...customProps} /> }
        </div>
    );
}