import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';
import { AppContext } from '../context/AppContext'; // Import the memory bank

const Analytics = () => {
    const navigate = useNavigate();
    
    // Pull the forecast results directly from Global State instead of URL location
    const { uploadState } = useContext(AppContext);
    const { forecastResults, forecastDatasetId: datasetId } = uploadState;

    // If the memory bank is empty (user hasn't run a forecast yet)
    if (!forecastResults) {
        return (
            <div className="flex flex-col items-center justify-center h-96 animate-in fade-in">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6"><TrendingUp size={32}/></div>
                <h2 className="text-2xl font-bold text-gray-800">No Active Forecast Data</h2>
                <p className="text-gray-500 mt-2 mb-6">You need to generate a forecast from the dashboard first.</p>
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-md hover:bg-violet-700">
                    <ArrowLeft size={18}/> Back to Workspace
                </button>
            </div>
        );
    }

    const handleDownload = (productName) => {
        const url = `http://127.0.0.1:5000/download-forecast/${datasetId}/${encodeURIComponent(productName)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Forecast Results</h2>
                    <p className="text-gray-500 mt-1">AI-generated demand predictions based on your dataset.</p>
                </div>
            </header>

            {Object.entries(forecastResults).map(([productName, data]) => (
                <div key={productName} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                    
                    <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-extrabold text-gray-900">{productName}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <CheckCircle size={16} className={data.confidence === "High" ? "text-green-500" : data.confidence === "Medium" ? "text-orange-500" : "text-red-500"} />
                                <span className="text-sm font-bold text-gray-600">Model Confidence: <span className={data.confidence === "High" ? "text-green-600" : "text-gray-900"}>{data.confidence}</span></span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleDownload(productName)}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white border-2 border-violet-100 text-violet-600 font-bold rounded-xl hover:bg-violet-50 shadow-sm transition-all"
                        >
                            <Download size={18} />
                            <span>Download CSV</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-gray-400 font-bold uppercase tracking-widest border-b border-gray-200">
                                    <th className="px-6 py-3">Predicted Week</th>
                                    <th className="px-6 py-3">Forecasted Demand (Units)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.preview.map((row, i) => (
                                    <tr key={i} className="hover:bg-violet-50/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-600">{row.Week}</td>
                                        <td className="px-6 py-4 font-bold text-violet-600">
                                            {Math.round(row.Forecast_Demand).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Analytics;