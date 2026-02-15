import React, {useMemo, useState} from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

import {Card} from "../../components/Card.jsx";
import {
    getAllExpenseCategories,
    getCategoryAvgSpent,
    getCategoryChartRangeOptions,
    getExpenseCategoriesWithTotalSpent,
    getMonthlyTotals,
    getTotalSpent
} from "../../api.jsx";
import {useQuery} from "@tanstack/react-query";
import {getStatus} from "../../util.jsx";
import {Dropdown} from '../../components/Dropdown.jsx'
import {formatCurrency} from "./utils/formatters.js";
import {MONTHS, getYearRange} from "../../constants/dateConstants.js";

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
    const [selectedCategoryChartRangeOption, setSelectedCategoryChartRangeOption] = useState("ThisMonth");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonthlyCategoryId, setSelectedMonthlyCategoryId] = useState('');
    const [selectedAvgYear, setSelectedAvgYear] = useState(new Date().getFullYear());
    const years = getYearRange();
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

    const { data: monthlyCategories = [] } = useQuery({
        queryKey: ['expenseCategories', 'monthlyTotals'],
        queryFn: async () => {
            const result = await getAllExpenseCategories();
            return result ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: monthlyTotals = {} } = useQuery({
        queryKey: ['monthlyTotals', selectedYear, selectedMonthlyCategoryId],
        queryFn: async () => {
            const result = await getMonthlyTotals(selectedYear, selectedMonthlyCategoryId || null);
            return result ?? {};
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: categoryAvgSpent = {} } = useQuery({
        queryKey: ['categoryAvgSpent', selectedAvgYear],
        queryFn: async () => {
            const result = await getCategoryAvgSpent(selectedAvgYear);
            return result ?? {};
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

    const monthlyTotalsData = useMemo(() => {
        const totals = monthlyTotals.monthlyTotals ?? monthlyTotals.MonthlyTotals ?? [];
        const totalsByMonth = totals.reduce((acc, item) => {
            acc[item.month ?? item.Month] = item.totalSpent ?? item.TotalSpent ?? 0;
            return acc;
        }, {});

        const data = MONTHS.map((month) => totalsByMonth[month] ?? 0);

        return {
            labels: MONTHS,
            datasets: [
                {
                    label: `Monthly Total (${selectedYear})`,
                    data,
                    backgroundColor: "rgba(59, 130, 246, 0.5)",
                    borderColor: "rgba(59, 130, 246, 0.9)",
                    borderWidth: 1,
                    borderRadius: 8,
                }
            ]
        };
    }, [monthlyTotals, selectedYear]);

    const yearTotalSpent = useMemo(() => {
        return monthlyTotals.yearTotalSpent ?? monthlyTotals.YearTotalSpent ?? 0;
    }, [monthlyTotals]);

    const categoryAvgList = useMemo(() => {
        const avgMap = categoryAvgSpent.categories ?? categoryAvgSpent.Categories ?? categoryAvgSpent ?? {};
        const items = Object.entries(avgMap)
            .map(([name, value]) => [name, Number(value) || 0])
            .sort((a, b) => b[1] - a[1]);

        if (items.length === 0) {
            return { items: [], maxValue: 0 };
        }

        const maxValue = Math.max(...items.map(([, value]) => value), 0);
        return { items, maxValue };
    }, [categoryAvgSpent]);

    const monthlyTotalsOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => formatCurrency(context.raw ?? 0)
                }
            }
        },
        scales: {
            x: {
                grid: { display: false }
            },
            y: {
                ticks: {
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    }), []);

    const handleRangeChange = (e, name) => {
        e.preventDefault();
        setSelectedCategoryChartRangeOption(name);
    }

    const handleYearChange = (e, year) => {
        e.preventDefault();
        setSelectedYear(year);
    }

    const handleMonthlyCategoryChange = (e, categoryId) => {
        e.preventDefault();
        setSelectedMonthlyCategoryId(categoryId);
    }

    const handleAvgYearChange = (e, year) => {
        e.preventDefault();
        setSelectedAvgYear(year);
    }

    const monthlyCategoryOptions = useMemo(() => {
        const base = [['', 'All Categories']];
        const mapped = monthlyCategories.map((category) => [category.id, category.name]);
        return base.concat(mapped);
    }, [monthlyCategories]);

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
                            title={"This Month"}
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
                    title={"Monthly Spend"}
                    className="totals-card"
                    bodyClassName="totals-card-body"
                    style={{width: '100%'}}
                >
                    <div className="totals-range">
                        <span className="totals-stat-label">Year</span>
                        <Dropdown
                            title={selectedYear}
                            options={years}
                            handleOptionChange={handleYearChange}
                            maxHeight={'16rem'}
                            includeScrollbarY={true}
                            changeTitleOnOptionChange={true}
                        />
                    </div>
                    <div className="totals-range">
                        <span className="totals-stat-label">Category</span>
                        <Dropdown
                            title="All Categories"
                            options={monthlyCategoryOptions}
                            handleOptionChange={handleMonthlyCategoryChange}
                            maxHeight={'16rem'}
                            includeScrollbarY={true}
                            changeTitleOnOptionChange={true}
                        />
                    </div>
                    <div className="totals-year-total">
                        <span className="totals-range-label">Year total</span>
                        <span className="totals-range-value">{formatCurrency(yearTotalSpent)}</span>
                    </div>
                    <div className="totals-chart totals-chart--wide">
                        <Bar data={monthlyTotalsData} options={monthlyTotalsOptions} />
                    </div>
                </Card>
                <Card
                    title={"Avg Monthly Spend by Category"}
                    className="totals-card"
                    bodyClassName="totals-card-body"
                    style={{width: '100%'}}
                >
                    <div className="totals-range">
                        <span className="totals-stat-label">Year</span>
                        <Dropdown
                            title={selectedAvgYear}
                            options={years}
                            handleOptionChange={handleAvgYearChange}
                            maxHeight={'16rem'}
                            includeScrollbarY={true}
                            changeTitleOnOptionChange={true}
                        />
                    </div>
                    <div className="totals-avg-list">
                        {categoryAvgList.items.length === 0 ? (
                            <div className="totals-empty">No average data yet.</div>
                        ) : categoryAvgList.items.map(([name, value]) => {
                            const width = categoryAvgList.maxValue
                                ? Math.max(4, (value / categoryAvgList.maxValue) * 100)
                                : 0;
                            return (
                                <div className="totals-avg-row" key={name}>
                                    <span className="totals-avg-label">{name}</span>
                                    <div className="totals-avg-bar">
                                        <div className="totals-avg-bar-fill" style={{ width: `${width}%` }} />
                                    </div>
                                    <span className="totals-avg-value">{formatCurrency(value)}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
