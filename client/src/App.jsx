import React from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {BuilderApp} from "./BuilderApp.jsx";
import {BuilderContextProvider} from "./providers/BuilderContextProvider.jsx";

const App = () => {
    const qc = new QueryClient();

    return (
        <QueryClientProvider client={qc}>
            <BuilderContextProvider>
                <BuilderApp />
            </BuilderContextProvider>
        </QueryClientProvider>
    );
}

export default App;