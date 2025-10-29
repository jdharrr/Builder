import { createRoot } from 'react-dom/client'

import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
);

createRoot(document.getElementById('main')).render(
    <App />
)