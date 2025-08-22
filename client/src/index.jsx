import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import {BuilderContextProvider} from "./providers/builderContextProvider.jsx";

createRoot(document.getElementById('main')).render(
  <StrictMode>
      <BuilderContextProvider>
        <App />
      </BuilderContextProvider>
  </StrictMode>
)