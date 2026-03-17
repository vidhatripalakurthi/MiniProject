import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [uploadState, setUploadState] = useState({
        file: null,
        previewData: null,
        cleanFileName: "",
        metadata: null,
        forecastParams: { product: 'All Products', months: 6 },
        // NEW: Add storage for the forecast results
        forecastResults: null, 
        forecastDatasetId: null 
    });

    const updateUploadState = (updates) => {
        setUploadState(prev => ({ ...prev, ...updates }));
    };

    const resetUploadState = () => {
        setUploadState({
            file: null,
            previewData: null,
            cleanFileName: "",
            metadata: null,
            forecastParams: { product: 'All Products', months: 6 },
            forecastResults: null,
            forecastDatasetId: null
        });
    };

    return (
        <AppContext.Provider value={{ uploadState, updateUploadState, resetUploadState }}>
            {children}
        </AppContext.Provider>
    );
};