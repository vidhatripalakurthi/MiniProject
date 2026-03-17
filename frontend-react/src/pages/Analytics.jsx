import React, { useContext, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Legend
} from 'recharts';
import { Download, TrendingUp, ArrowLeft, BarChart2, Calendar, Image as ImageIcon, Table2, Layers } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import html2canvas from 'html2canvas';

const CHART_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-50 min-w-[200px]">
                <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 border-b pb-2">
                    <Calendar size={14}/> {label}
                </p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-sm font-semibold text-gray-600">{entry.name}:</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                            {Number(entry.value).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const navigate = useNavigate();
    const { uploadState } = useContext(AppContext);
    const { forecastResults } = uploadState || {};
    
    const chartWrapperRef = useRef(null);

    const availableProducts = forecastResults ? Object.keys(forecastResults) : [];
    
    // UI States
    const [selectedProducts, setSelectedProducts] = useState(availableProducts);
    const [chartType, setChartType] = useState('Area'); 
    const [timeframe, setTimeframe] = useState('Weekly'); // Weekly, Monthly, Quarterly

    // 1. Merge & Aggregate Data
    const { chartData, maxPoints, minPoints } = useMemo(() => {
        if (!forecastResults || selectedProducts.length === 0) return { chartData: [], maxPoints: {}, minPoints: {} };

        const groupedData = {};
        const localMax = {};
        const localMin = {};

        selectedProducts.forEach(prod => {
            localMax[prod] = { value: -Infinity, date: null };
            localMin[prod] = { value: Infinity, date: null };
        });

        // First pass: Merge
        selectedProducts.forEach(product => {
            const productData = forecastResults[product] || {};
            const records = productData.full_forecast || productData.preview || [];

            records.forEach(item => {
                const dateStr = item.Week ? item.Week.split(' to ')[0] : "01-01-2000";
                const val = Math.round(item.Forecast_Demand || 0);

                const [day, month, year] = dateStr.split('-');
                let key = dateStr;
                let displayDate = dateStr;

                if (timeframe === 'Monthly') {
                    key = `${year}-${month}`;
                    displayDate = `${month}-${year}`;
                } else if (timeframe === 'Quarterly') {
                    const q = Math.ceil(parseInt(month) / 3);
                    key = `${year}-Q${q}`;
                    displayDate = `Q${q} ${year}`;
                }

                if (!groupedData[key]) {
                    groupedData[key] = { date: displayDate, sortKey: key };
                }
                
                // Add up values for aggregated timeframes
                groupedData[key][product] = (groupedData[key][product] || 0) + val;
            });
        });

        // Second pass: Calculate Min/Max and Convert to Array
        const mergedArray = Object.values(groupedData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        mergedArray.forEach(row => {
            selectedProducts.forEach(prod => {
                const val = row[prod];
                if (val !== undefined) {
                    if (val > localMax[prod].value) localMax[prod] = { value: val, date: row.date };
                    if (val < localMin[prod].value) localMin[prod] = { value: val, date: row.date };
                }
            });
        });
        
        return { chartData: mergedArray, maxPoints: localMax, minPoints: localMin };
    }, [forecastResults, selectedProducts, timeframe]);

    if (!forecastResults || availableProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6"><TrendingUp size={32}/></div>
                <h2 className="text-2xl font-bold text-gray-800">No Active Forecast Data</h2>
                <p className="text-gray-500 mt-2 mb-6">You need to generate a forecast from the dashboard first.</p>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700">
                    Back to Workspace
                </button>
            </div>
        );
    }

    const toggleProduct = (prod) => {
        setSelectedProducts(prev => prev.includes(prod) ? prev.filter(p => p !== prod) : [...prev, prod]);
    };

    // Frontend CSV Generation
    const handleDownloadCSV = () => {
        if (!chartData || chartData.length === 0) return;
        
        const headers = ["Date", ...selectedProducts];
        const rows = chartData.map(row => {
            return [row.date, ...selectedProducts.map(p => row[p] || 0)].join(",");
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TrendCast_Forecast_${timeframe}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadChart = async () => {
        if (chartWrapperRef.current) {
            try {
                const canvas = await html2canvas(chartWrapperRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
                const link = document.createElement('a');
                link.download = `TrendCast_Chart.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            } catch (err) { console.error("Chart export failed:", err); }
        }
    };

    const renderChart = () => {
        const commonProps = { width: 900, height: 400, data: chartData, margin: { top: 20, right: 30, left: 0, bottom: 0 }};
        const renderElements = () => selectedProducts.map((product, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            const max = maxPoints[product];
            const min = minPoints[product];
            return (
                <React.Fragment key={product}>
                    {chartType === 'Area' && <Area type="monotone" dataKey={product} name={product} stroke={color} fill={color} fillOpacity={0.1} strokeWidth={3} isAnimationActive={false} />}
                    {chartType === 'Line' && <Line type="monotone" dataKey={product} name={product} stroke={color} strokeWidth={3} dot={{r: 2}} isAnimationActive={false} />}
                    {chartType === 'Bar' && <Bar dataKey={product} name={product} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />}
                    {chartType === 'Scatter' && <Scatter dataKey={product} name={product} fill={color} isAnimationActive={false} />}

                    {/* Reference Dots for Line/Area */}
                    {(chartType === 'Area' || chartType === 'Line') && max.date && (
                        <ReferenceDot x={max.date} y={max.value} r={6} fill={color} stroke="#fff" strokeWidth={2} label={{ position: 'top', value: `Max`, fill: color, fontSize: 11, fontWeight: 'bold' }}/>
                    )}
                    {(chartType === 'Area' || chartType === 'Line') && min.date && (
                        <ReferenceDot x={min.date} y={min.value} r={6} fill={color} stroke="#fff" strokeWidth={2} label={{ position: 'bottom', value: `Min`, fill: color, fontSize: 11, fontWeight: 'bold' }}/>
                    )}
                </React.Fragment>
            );
        });

        const axesAndGrid = (
            <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} minTickGap={20} dy={10}/>
                <YAxis type="number" domain={['dataMin - 10', 'auto']} tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} dx={-5}/>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
            </>
        );

        switch (chartType) {
            case 'Line': return <LineChart {...commonProps}>{axesAndGrid}{renderElements()}</LineChart>;
            case 'Bar': return <BarChart {...commonProps}>{axesAndGrid}{renderElements()}</BarChart>;
            case 'Scatter': return <ScatterChart {...commonProps}>{axesAndGrid}{renderElements()}</ScatterChart>;
            default: return <AreaChart {...commonProps}>{axesAndGrid}{renderElements()}</AreaChart>;
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 w-full max-w-7xl mx-auto space-y-6">
            
            {/* CONTROL PANEL */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                
                {/* Product Filters with Confidence Badges */}
                <div className="flex-1 w-full">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Layers size={14}/> Compare Products</span>
                    <div className="flex flex-wrap gap-2">
                        {availableProducts.map((prod, index) => {
                            const isSelected = selectedProducts.includes(prod);
                            const color = CHART_COLORS[index % CHART_COLORS.length];
                            
                            // Extract confidence for the badge
                            const confidence = forecastResults[prod]?.confidence || "N/A";
                            const confColor = confidence === "High" ? "text-green-600 bg-green-50" : confidence === "Medium" ? "text-orange-600 bg-orange-50" : "text-red-600 bg-red-50";

                            return (
                                <button 
                                    key={prod} onClick={() => toggleProduct(prod)}
                                    style={{ backgroundColor: isSelected ? `${color}15` : '#f9fafb', color: isSelected ? color : '#9ca3af', borderColor: isSelected ? color : 'transparent' }}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80 flex items-center gap-2`}
                                >
                                    <span>{prod}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider ${confColor} ${!isSelected && 'opacity-60 grayscale'}`}>
                                        {confidence}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Aggregation & Chart Type Toggles */}
                <div className="flex flex-col gap-3 w-full lg:w-auto">
                    
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
                        {['Weekly', 'Monthly', 'Quarterly'].map(time => (
                            <button 
                                key={time} onClick={() => setTimeframe(time)}
                                className={`flex-1 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${timeframe === time ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
                        {['Area', 'Line', 'Bar', 'Scatter'].map(type => (
                            <button 
                                key={type} onClick={() => setChartType(type)}
                                className={`flex-1 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${chartType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-col gap-2 w-full lg:w-auto">
                    <button onClick={handleDownloadChart} className="flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
                        <ImageIcon size={16} /> Export Image
                    </button>
                    <button onClick={handleDownloadCSV} className="flex items-center justify-center gap-2 px-6 py-2 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all text-sm">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* CHART VIEW */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BarChart2 size={20} className="text-violet-500"/> Future Demand
                    </h3>
                    <span className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                        {timeframe} Data
                    </span>
                </div>
                
                <div ref={chartWrapperRef} className="w-full overflow-x-auto pb-4 pt-4 bg-white rounded-xl">
                    <div style={{ minWidth: '900px', height: '400px' }}>
                        {chartData.length > 0 ? renderChart() : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">Select at least one product.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* DATA MATRIX */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Table2 size={20} className="text-violet-500"/> Forecast Matrix</h3>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-gray-600 min-w-max">
                        <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Time Period</th>
                                {selectedProducts.map(prod => {
                                    // Extract confidence for the table header
                                    const confidence = forecastResults[prod]?.confidence || "N/A";
                                    const confColor = confidence === "High" ? "text-green-500 bg-green-50 border-green-100" : confidence === "Medium" ? "text-orange-500 bg-orange-50 border-orange-100" : "text-red-500 bg-red-50 border-red-100";
                                    
                                    return (
                                        <th key={prod} className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-gray-900">{prod}</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${confColor}`}>
                                                    {confidence} CONFIDENCE
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {chartData.map((data, index) => (
                                <tr key={index} className="hover:bg-violet-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">{data.date}</td>
                                    {selectedProducts.map((prod, i) => (
                                        <td key={prod} className="px-6 py-3 text-right font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                                            {data[prod] ? data[prod].toLocaleString() : '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;