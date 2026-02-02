import React from 'react';

import {Card} from "../../components/Card.jsx";
import {PaymentsTableSection} from "./sections/PaymentsTableSection.jsx";

import './css/paymentsPage.css';

export default function PaymentsPage() {
    return (
        <div className="payments-page">
            <div className="payments-hero">
                <div className="payments-hero-title">
                    <span className="payments-eyebrow">Payments</span>
                    <h1 className="payments-title">Payment Table</h1>
                    <p className="payments-subtitle">Review and organize payment history with the same table layout.</p>
                </div>
            </div>

            <Card className="payments-page-card" bodyClassName="payments-page-body" style={{width: 'min(90rem, 100%)'}}>
                <PaymentsTableSection />
            </Card>
        </div>
    );
}
