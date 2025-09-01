import React from 'react';

import {NavBarSection} from "../sections/NavBarSection.jsx";
import {Fab} from "../components/Fab.jsx";

export const BuilderLayout = ({children}) => {
    return (
        <>
            <NavBarSection />
            {children}
            <Fab />
        </>
    );
}