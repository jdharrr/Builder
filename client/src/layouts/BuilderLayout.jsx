import React from 'react';

import {NavBarSection} from "../sections/navBarSection.jsx";
import {Fab} from "../components/fab.jsx";

export const BuilderLayout = ({children}) => {
    return (
        <>
            <NavBarSection />
            {children}
            <Fab />
        </>
    );
}