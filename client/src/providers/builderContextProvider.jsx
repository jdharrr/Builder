import React from 'react';

import {UserProvider} from "./user/userProvider.jsx";

export const BuilderContextProvider = ({ children }) => {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}