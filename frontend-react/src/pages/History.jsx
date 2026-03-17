import React, { useState, useEffect } from 'react';
import { Clock, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axiosConfig';

const History = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/user-forecasts');
                if (res.data.success) {
                    setHistory(res.data.forecasts);
                }
            } catch (err) {
                setError("Failed to load forecast history.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDownload = (datasetId, product) => {
        window.open(`http://127.0.0.1:5000/download-forecast/${datasetId}/${encodeURIComponent(product)}`, '_blank');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-5xl mx-auto space-y-8">
            <header>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <Clock className="text-violet-500" size={32}/> Forecast History
                </h2>
                <p className="text-gray-500 mt-1">Review and download your previously generated AI demand forecasts.</p>
            </header>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 font-bold text-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-violet-500">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p className="font-bold text-gray-600">Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p className="font-bold text-lg text-gray-600">No forecasts found.</p>
                        <p className="text-sm mt-1">Generate your first forecast from the Workspace.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5">Dataset Name</th>
                                    <th className="px-6 py-5">Product</th>
                                    <th className="px-6 py-5">Date Generated</th>
                                    <th className="px-6 py-5">Confidence</th>
                                    <th className="px-6 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map((item, index) => {
                                    const confColor = item.confidence === "High" ? "text-green-600 bg-green-50" : item.confidence === "Medium" ? "text-orange-600 bg-orange-50" : "text-red-600 bg-red-50";
                                    return (
                                        <tr key={index} className="hover:bg-violet-50/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                                                <FileText size={16} className="text-violet-400"/>
                                                {item.dataset_name}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">{item.product}</td>
                                            <td className="px-6 py-4 text-gray-500">{item.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-1 rounded-md uppercase tracking-wider font-bold ${confColor}`}>
                                                    {item.confidence}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDownload(item.dataset_id, item.product)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-violet-600 font-bold rounded-xl hover:bg-violet-50 hover:border-violet-200 transition-all text-xs"
                                                >
                                                    <Download size={14} /> CSV
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;