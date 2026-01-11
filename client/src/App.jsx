import React from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {BuilderApp} from "./BuilderApp.jsx";
import {BuilderContextProvider} from "./providers/BuilderContextProvider.jsx";

const App = () => {
    const qc = new QueryClient();

    return (
        <QueryClientProvider client={qc}>
            <BuilderContextProvider>
                <BuilderApp />
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </BuilderContextProvider>
        </QueryClientProvider>
    );
}

export default App;