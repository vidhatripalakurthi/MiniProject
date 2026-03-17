import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FileText, X, CheckCircle, Download, Database, LayoutPanelLeft, UploadCloud, ArrowRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import api from '../api/axiosConfig';
import { AppContext } from '../context/AppContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { uploadState, updateUploadState, resetUploadState } = useContext(AppContext);
    const { file, previewData, cleanFileName, metadata, forecastParams } = uploadState;

    const [stats, setStats] = useState({ uniqueDatasets: 0, totalForecasts: 0 });
    const [isUploading, setIsUploading] = useState(false);
    const [isForecasting, setIsForecasting] = useState(false);
    const [error, setError] = useState("");
    
    // Custom Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard-stats');
                if (res.data.success) {
                    setStats({
                        uniqueDatasets: res.data.unique_datasets,
                        totalForecasts: res.data.unique_forecasts
                    });
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            updateUploadState({ file: acceptedFiles[0] });
        }
    }, [updateUploadState]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
        onDrop, noClick: true, multiple: false, accept: { 'text/csv': ['.csv'] }
    });

    const handleCleanData = async () => {
        setIsUploading(true);
        setError("");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload-dataset', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            updateUploadState({
                previewData: res.data.preview,
                cleanFileName: res.data.clean_file,
                metadata: {
                    products: res.data.products,
                    dateRange: res.data.date_range,
                    rows: res.data.rows,
                    datasetId: res.data.dataset_id
                },
                // Initialize forecastParams product as an empty array so nothing is selected by default
                forecastParams: { ...forecastParams, product: [], months: 6 }
            });
        } catch (err) {
            setError(err.response?.data?.message || "Error processing dataset.");
        } finally {
            setIsUploading(false);
        }
    };

    const toggleProductSelection = (prod) => {
        const currentSelected = Array.isArray(forecastParams.product) ? forecastParams.product : [];
        let newSelection;
        if (currentSelected.includes(prod)) {
            newSelection = currentSelected.filter(p => p !== prod);
        } else {
            newSelection = [...currentSelected, prod];
        }
        updateUploadState({ forecastParams: { ...forecastParams, product: newSelection } });
    };

    const triggerForecast = async () => {
        const selected = forecastParams.product || [];
        if (selected.length === 0) {
            setError("Please select at least one product.");
            return;
        }

        setIsForecasting(true);
        setError("");
        try {
            const res = await api.post('/generate-forecast', {
                dataset_id: metadata.datasetId,
                product: selected, 
                months: forecastParams.months || 6
            });
            
            updateUploadState({
                forecastResults: res.data.results,
                forecastDatasetId: metadata.datasetId
            });

            navigate('/analytics');
        } catch (err) {
            setError(err.response?.data?.message || "Forecast failed.");
        } finally {
            setIsForecasting(false);
        }
    };

    const handleDownloadCleaned = () => {
        window.open(`http://127.0.0.1:5000/cleandata/${cleanFileName}`, '_blank');
    };

    // Helper for dropdown display text
    const selectedCount = Array.isArray(forecastParams.product) ? forecastParams.product.length : 0;
    const totalProducts = metadata?.products?.length || 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-6xl mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <header className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Workspace</h2>
                <p className="text-gray-500 mt-1">Upload data and run your forecasting pipeline.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unique Datasets</p>
                        <p className="text-3xl font-black text-gray-900">{stats.uniqueDatasets}</p>
                    </div>
                    <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl"><Database size={24}/></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Forecasts</p>
                        <p className="text-3xl font-black text-gray-900">{stats.totalForecasts}</p>
                    </div>
                    <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl"><LayoutPanelLeft size={24}/></div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 font-bold text-sm">
                    <X size={18} className="bg-red-100 rounded-full p-0.5" />
                    {error}
                </div>
            )}

            {!previewData ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    {!file ? (
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all ${isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}>
                            <input {...getInputProps()} />
                            <div className="w-20 h-20 bg-white shadow-md text-violet-600 rounded-3xl flex items-center justify-center mb-6"><UploadCloud size={40} /></div>
                            <p className="text-xl font-bold text-gray-900">Drop dataset to begin</p>
                            <p className="text-sm text-gray-500 mt-2 mb-8">CSV files containing Date, Product, and Demand</p>
                            <button onClick={open} className="px-8 py-3 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-2xl hover:bg-gray-50 shadow-sm transition-all">Browse Files</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-8 border border-violet-200 bg-violet-50 rounded-3xl">
                            <div className="flex items-center space-x-5">
                                <div className="p-4 bg-white rounded-2xl shadow-sm text-violet-600"><FileText size={32} /></div>
                                <div>
                                    <p className="text-lg font-black text-gray-900">{file.name}</p>
                                    <p className="text-sm font-bold text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={resetUploadState} className="p-3 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                                <button onClick={handleCleanData} disabled={isUploading} className="px-8 py-3.5 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 disabled:opacity-50 shadow-xl shadow-violet-200 transition-all">
                                    {isUploading ? "Processing..." : "Clean & Preprocess"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                                <CheckCircle size={18} className="text-green-500"/> Dataset Preview
                            </h3>
                            <button onClick={resetUploadState} className="text-xs font-bold text-red-500 hover:opacity-70 underline underline-offset-4">Change Dataset</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-gray-400 font-black uppercase tracking-widest border-b border-gray-200 bg-gray-50">
                                        {Object.keys(previewData[0]).map((key) => <th key={key} className="px-6 py-4">{key}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewData.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            {Object.values(row).map((val, j) => <td key={j} className="px-6 py-4 font-bold text-gray-600">{val}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Products</p>
                            <p className="text-2xl font-black text-gray-900">{metadata?.products.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date Range</p>
                            <p className="text-sm font-black text-gray-900 mt-1 uppercase">{metadata?.dateRange.start} — {metadata?.dateRange.end}</p>
                        </div>
                        <button onClick={handleDownloadCleaned} className="bg-violet-50 border border-violet-100 p-6 rounded-3xl flex items-center justify-center gap-3 text-violet-600 hover:bg-violet-100 transition-all font-black text-sm uppercase tracking-widest shadow-sm">
                            <Download size={20} /> Download CSV
                        </button>
                    </div>

                    {/* LIGHT PURPLE PIPELINE BAR */}
                    <div className="bg-violet-50 p-8 rounded-3xl shadow-sm flex flex-col lg:flex-row items-end gap-6 border border-violet-100">
                        
                        {/* CUSTOM MULTI-SELECT */}
                        <div className="flex-1 w-full relative" ref={dropdownRef}>
                            <label className="text-xs font-black text-violet-400 uppercase tracking-widest mb-3 block">Target Products</label>
                            
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full p-4 bg-white border border-violet-200 rounded-2xl text-violet-900 font-bold outline-none flex items-center justify-between hover:bg-violet-100/50 transition-colors"
                            >
                                <span>{selectedCount === totalProducts && totalProducts > 0 ? "All Products Selected" : `${selectedCount} Products Selected`}</span>
                                <ChevronDown size={20} className="text-violet-400"/>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-violet-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-violet-50 mb-2">
                                        <span className="text-xs font-bold text-violet-400">Select Multiple</span>
                                        <button 
                                            onClick={() => updateUploadState({ forecastParams: { ...forecastParams, product: selectedCount === totalProducts ? [] : metadata.products }})}
                                            className="text-xs text-violet-600 font-bold hover:text-violet-800"
                                        >
                                            {selectedCount === totalProducts ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>
                                    {metadata?.products.map(prod => {
                                        const isSelected = Array.isArray(forecastParams.product) && forecastParams.product.includes(prod);
                                        return (
                                            <div 
                                                key={prod} 
                                                onClick={() => toggleProductSelection(prod)}
                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-violet-50 rounded-xl cursor-pointer transition-colors"
                                            >
                                                {isSelected ? <CheckSquare size={18} className="text-violet-600"/> : <Square size={18} className="text-violet-200"/>}
                                                <span className="text-sm font-bold text-gray-800">{prod}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* TIMELINE SELECT */}
                        <div className="w-full lg:w-64">
                            <label className="text-xs font-black text-violet-400 uppercase tracking-widest mb-3 block">Timeline</label>
                            <select 
                                value={forecastParams.months || 6}
                                onChange={(e) => updateUploadState({ forecastParams: { ...forecastParams, months: parseFloat(e.target.value) }})}
                                className="w-full p-4 bg-white border border-violet-200 rounded-2xl text-violet-900 font-bold outline-none focus:ring-2 focus:ring-violet-400 appearance-none cursor-pointer"
                            >
                                <option value={0.5} className="bg-white text-gray-900">2 Weeks</option>
                                <option value={1} className="bg-white text-gray-900">1 Month</option>
                                <option value={2} className="bg-white text-gray-900">2 Months</option>
                                <option value={3} className="bg-white text-gray-900">3 Months</option>
                                <option value={6} className="bg-white text-gray-900">6 Months</option>
                                <option value={9} className="bg-white text-gray-900">9 Months</option>
                                <option value={12} className="bg-white text-gray-900">1 Year</option>
                            </select>
                        </div>

                        <button 
                            onClick={triggerForecast}
                            disabled={isForecasting || selectedCount === 0}
                            className="w-full lg:w-auto px-10 py-4.5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 shadow-xl shadow-violet-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isForecasting ? "Processing AI..." : "Run Pipeline"}
                            {!isForecasting && <ArrowRight size={22}/>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;