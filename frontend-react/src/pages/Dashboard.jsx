import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FileText, X, CheckCircle, Download, Database, LayoutPanelLeft, UploadCloud, ArrowRight } from 'lucide-react';
import api from '../api/axiosConfig';
import { AppContext } from '../context/AppContext';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // Connect to Global State for state preservation
    const { uploadState, updateUploadState, resetUploadState } = useContext(AppContext);
    const { file, previewData, cleanFileName, metadata, forecastParams } = uploadState;

    // Local UI State
    const [userName, setUserName] = useState("User");
    const [stats, setStats] = useState({ datasets: 0, forecasts: 0, products: 0 });
    const [isUploading, setIsUploading] = useState(false);
    const [isForecasting, setIsForecasting] = useState(false);

    // Fetch dynamic user data and counts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.success) {
                    setUserName(res.data.user.name.split(' ')[0]);
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch user data", err);
            }
        };
        fetchUserData();
    }, []);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            updateUploadState({ file: acceptedFiles[0] });
        }
    }, [updateUploadState]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
        onDrop, 
        noClick: true, 
        multiple: false,
        accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls', '.xlsx'] }
    });

    const handleCleanData = async () => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload-dataset', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Save results to Global State
            updateUploadState({
                previewData: res.data.preview,
                cleanFileName: res.data.clean_file,
                metadata: {
                    products: res.data.products,
                    dateRange: res.data.date_range,
                    rows: res.data.rows,
                    datasetId: res.data.dataset_id
                }
            });
        } catch (err) {
            alert("Error processing file: " + (err.response?.data?.message || err.message));
        } finally {
            setIsUploading(false);
        }
    };

    const triggerForecast = async () => {
        setIsForecasting(true);
        try {
            const res = await api.post('/generate-forecast', {
                dataset_id: metadata.datasetId,
                product: forecastParams.product,
                months: forecastParams.months // Passes the timeframe to Flask
            });
            
            // Save the ML results to the Global Context so Analytics can read it
            updateUploadState({
                forecastResults: res.data.results,
                forecastDatasetId: metadata.datasetId
            });

            // Navigate to Analytics
            navigate('/analytics');
            
        } catch (err) {
            alert("Forecast Error: " + (err.response?.data?.message || err.message));
        } finally {
            setIsForecasting(false);
        }
    };

    const handleDownloadCleaned = () => {
        const url = `http://127.0.0.1:5000/cleandata/${cleanFileName}`;
        window.open(url, '_blank');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {userName}</h2>
                <p className="text-gray-500 mt-1">Manage your datasets and prepare your forecasts.</p>
            </header>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Datasets</p><p className="text-3xl font-bold text-gray-900">{stats.datasets}</p></div>
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Database size={20}/></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Forecasts Run</p><p className="text-3xl font-bold text-gray-900">{stats.forecasts}</p></div>
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><LayoutPanelLeft size={20}/></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Products</p><p className="text-3xl font-bold text-gray-900">{stats.products}</p></div>
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><CheckCircle size={20}/></div>
                </div>
            </div>

            {!previewData ? (
                /* SECTION: UPLOAD ZONE */
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    {!file ? (
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all ${isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}>
                            <input {...getInputProps()} />
                            <div className="w-16 h-16 bg-white shadow-sm text-violet-600 rounded-full flex items-center justify-center mb-4"><UploadCloud size={32} /></div>
                            <p className="text-lg font-semibold text-gray-900">Drag & drop your dataset here</p>
                            <p className="text-sm text-gray-500 mt-1 mb-6">Supports .CSV and .XLSX files</p>
                            <button onClick={open} className="px-6 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition-all">Explore System Files</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-6 border border-violet-200 bg-violet-50 rounded-2xl">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-violet-600"><FileText size={24} /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={resetUploadState} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                                <button onClick={handleCleanData} disabled={isUploading} className="px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md">
                                    {isUploading ? "Cleaning..." : "Clean Data"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* SECTIONS: PREVIEW → METADATA → CONTROLS */
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    
                    {/* 1. CLEAN DATA PREVIEW */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500"/> Clean Data Preview
                            </h3>
                            <button onClick={resetUploadState} className="text-xs font-bold text-red-500 hover:text-red-700 underline underline-offset-4">Discard & Re-upload</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-gray-400 font-bold uppercase tracking-widest border-b border-gray-200 bg-gray-50">
                                        {Object.keys(previewData[0]).map((key) => <th key={key} className="px-6 py-4">{key}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewData.slice(0, 7).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            {Object.values(row).map((val, j) => <td key={j} className="px-6 py-4 font-medium text-gray-600">{val}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. METADATA CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Products Found</p>
                            <p className="text-xl font-bold text-gray-900">{metadata?.products.length}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date Scope</p>
                            <p className="text-xs font-bold text-gray-900 mt-1">{metadata?.dateRange.start} → {metadata?.dateRange.end}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Records</p>
                            <p className="text-xl font-bold text-gray-900">{metadata?.rows}</p>
                        </div>
                        <button onClick={handleDownloadCleaned} className="bg-violet-50 border border-violet-100 p-5 rounded-2xl flex items-center justify-center gap-3 text-violet-600 hover:bg-violet-100 transition-colors shadow-sm">
                            <Download size={20} />
                            <span className="text-sm font-bold">Download CSV</span>
                        </button>
                    </div>

                    {/* 3. FORECASTING CONTROLS */}
                    <div className="bg-white p-8 rounded-3xl border-2 border-violet-100 shadow-xl shadow-violet-100/20 flex flex-col lg:flex-row items-end gap-6">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Target Product</label>
                            <select 
                                value={forecastParams.product}
                                onChange={(e) => updateUploadState({ forecastParams: { ...forecastParams, product: e.target.value }})}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-gray-700 appearance-none"
                            >
                                <option value="All Products">Forecast All Products</option>
                                {metadata?.products.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="w-full lg:w-60">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Forecast Period</label>
                            <select 
                                value={forecastParams.months}
                                onChange={(e) => updateUploadState({ forecastParams: { ...forecastParams, months: parseFloat(e.target.value) }})}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-gray-700 appearance-none"
                            >
                                <option value={0.5}>2 Weeks</option>
                                <option value={1}>1 Month</option>
                                <option value={2}>2 Months</option>
                                <option value={3}>3 Months</option>
                                <option value={6}>6 Months</option>
                                <option value={12}>1 Year</option>
                            </select>
                        </div>
                        <button 
                            onClick={triggerForecast}
                            disabled={isForecasting}
                            className="w-full lg:w-auto px-10 py-4 bg-violet-600 text-white font-black rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isForecasting ? "Processing Models..." : "Run Forecasting Pipeline"}
                            {!isForecasting && <ArrowRight size={20}/>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;