import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate} from "react-router-dom";
import { Doughnut } from 'react-chartjs-2';

import {Card} from "../../components/Card.jsx";
import {getCategoryChartRangeOptions, getExpenseCategoriesWithTotalSpent, getTotalSpent} from "../../api.jsx";
import {useQuery} from "@tanstack/react-query";
import {getStatus} from "../../util.jsx";
import {Dropdown} from '../../components/Dropdown.jsx'

export default function TotalsPage() {
    const navigate = useNavigate();
    
    const [categoryChartRangeOptions, setCategoryChartRangeOptions] = useState([]);
    const [selectedCategoryChartRangeOption, setSelectedCategoryChartRangeOption] = useState("AllTime");

    const { data: categories = {} } = useQuery({
        queryKey: ['categories', selectedCategoryChartRangeOption],
        queryFn: async () => {
            const result = await getExpenseCategoriesWithTotalSpent(selectedCategoryChartRangeOption);
            return result ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        }
    });

    const { data: totalSpent = 0 } = useQuery({
        queryKey: ['totalSpent'],
        queryFn: async () => {
            const result = await getTotalSpent();
            const dollarString = toDollar(result)
            return dollarString ?? 0;
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        }
    });
    
    useEffect(() => {
        async function loadCategoryChartRangeOptions() {
            try {
                const options = await getCategoryChartRangeOptions();
                setCategoryChartRangeOptions(options);
            } catch(err) {
                if (getStatus(err) === 401) {
                    navigate('/login');
                }
            }
        }
        
        loadCategoryChartRangeOptions();
    }, [navigate])

    const categoryPieData = useMemo(() => {
        const pieColors = [
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

        if (!categories.length) return { labels: [], datasets: [] };

        const labels = categories.map(x => x.name);
        const data = categories.map(x => x.totalSpent);
        const colors = pieColors.slice(0, labels.length);

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

    function toDollar(amount) {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });
    }

    return (
        <>
            <Card title={"Category Breakdown"}>
                <Dropdown title={"Range"} options={Object.entries(categoryChartRangeOptions)} handleOptionChange={handleRangeChange} changeTitleOnOptionChange={true}/>
                <div className={"d-flex align-items-center justify-content-center"}>
                    <Doughnut data={categoryPieData} style={{ maxWidth: '30rem', maxHeight: '30rem' }} />
                </div>
            </Card>
            <Card title={"Total Spent"}>
                <div>
                    <p>{totalSpent.toString()}</p>
                </div>
            </Card>
        </>
    );
}