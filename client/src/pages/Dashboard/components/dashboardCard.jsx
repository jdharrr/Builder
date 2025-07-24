import React from 'react';

import '../css/dashboardCard.css';

export const Card = ({ title, customComponent: CustomComponent }) => {
    return (
        <div className="card">
            <h1>{title}</h1>
            {CustomComponent && <CustomComponent /> }
        </div>
    );
}