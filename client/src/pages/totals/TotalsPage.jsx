import React, {useMemo, useState} from 'react';
import { Doughnut } from 'react-chartjs-2';

import {Card} from "../../components/Card.jsx";
import {getCategoryChartRangeOptions, getExpenseCategoriesWithTotalSpent, getTotalSpent} from "../../api.jsx";
import {useQuery} from "@tanstack/react-query";
import {getStatus} from "../../util.jsx";
import {Dropdown} from '../../components/Dropdown.jsx'
import {formatCurrency} from "./utils/formatters.js";

import './css/totalsPage.css';

const PIE_COLORS = [
    "rgb(255, 99, 132)",   // pink/red
    "rgb(54, 162, 235)",   // blue
    "rgb(255, 206, 86)",   // yellow
    "rgb(75, 192, 192)",   // teal
    "rgb(153, 102, 255)",  // purple
    "rgb(255, 159, 64)",   // orange
    "rgb(199, 199, 199)",  // gray
    "rgb(255, 99, 71)",    // tomato
    "rgb(100, 181, 246)",  // light blue
    "rgb(129, 199, 132)",  // light green
    "rgb(255, 238, 88)",   // bright yellow
    "rgb(244, 143, 177)",  // pink
    "rgb(171, 71, 188)",   // violet
    "rgb(77, 182, 172)",   // turquoise
    "rgb(255, 112, 67)"    // coral
];

export default function TotalsPage() {
    const [selectedCategoryChartRangeOption, setSelectedCategoryChartRangeOption] = useState("AllTime");
    const { data: categoryChartRangeOptions = [] } = useQuery({
        queryKey: ['categoryChartRangeOptions'],
        queryFn: async () => {
            const options = await getCategoryChartRangeOptions();
            return options ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: categoryTotals = {} } = useQuery({
        queryKey: ['categories', selectedCategoryChartRangeOption],
        queryFn: async () => {
            const result = await getExpenseCategoriesWithTotalSpent(selectedCategoryChartRangeOption);
            return result ?? {};
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: totalSpent = 0 } = useQuery({
        queryKey: ['totalSpent'],
        queryFn: async () => {
            const result = await getTotalSpent();
            return result ?? 0;
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });
    
    const { categories, combinedTotalSpent } = useMemo(() => {
        return {
            categories: categoryTotals.categories ?? categoryTotals.Categories ?? [],
            combinedTotalSpent: categoryTotals.combinedTotalSpend ?? categoryTotals.CombinedTotalSpend ?? 0
        };
    }, [categoryTotals]);

    const categoryPieData = useMemo(() => {
        if (!categories.length) return { labels: [], datasets: [] };

        const labels = categories.map(x => x.name);
        const data = categories.map(x => x.categoryTotalSpent);
        const colors = PIE_COLORS.slice(0, labels.length);

        return {
            labels,
            datasets: [
                {
                    label: "Category Breakdown",
                    data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                },
            ],
        };
    }, [categories]);

    const handleRangeChange = (e, name) => {
        e.preventDefault();
        setSelectedCategoryChartRangeOption(name);
    }

    return (
        <div className="totals-page">
            <div className="totals-hero">
                <div className="totals-hero-title">
                    <span className="totals-eyebrow">Totals</span>
                    <h1 className="totals-title">Spending Overview</h1>
                    <p className="totals-subtitle">See where money goes and how much you have spent over time.</p>
                </div>
                <div className="totals-stat">
                    <span className="totals-stat-label">Total Spent</span>
                    <span className="totals-stat-value">{formatCurrency(totalSpent)}</span>
                </div>
            </div>

            <div className="totals-grid">
                <Card
                    title={"Category Breakdown"}
                    className="totals-card"
                    bodyClassName="totals-card-body"
                    style={{width: '100%'}}
                >
                    <div className="totals-range">
                        <span className="totals-stat-label">Range</span>
                        <Dropdown
                            title={"Range"}
                            options={Object.entries(categoryChartRangeOptions)}
                            handleOptionChange={handleRangeChange}
                            changeTitleOnOptionChange={true}
                        />
                    </div>
                    <div className="totals-range-total">
                        <span className="totals-range-label">Total for range</span>
                        <span className="totals-range-value">{formatCurrency(combinedTotalSpent)}</span>
                    </div>
                    <div className="totals-chart">
                        <Doughnut data={categoryPieData} style={{ maxWidth: '24rem', maxHeight: '24rem' }} />
                    </div>
                </Card>
                <Card
                    title={"Total Spent"}
                    className="totals-card totals-total-card"
                    style={{width: '100%'}}
                >
                    <div className="totals-total-amount">{formatCurrency(totalSpent)}</div>
                    <div className="totals-total-subtext">Across all tracked expenses.</div>
                </Card>
            </div>
        </div>
    );
}
