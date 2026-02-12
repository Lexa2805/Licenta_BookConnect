"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf v9 - use local copy
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
    pdfUrl: string;
    currentPage: number;
    onPageChange?: (page: number) => void;
    onLoadSuccess?: (numPages: number) => void;
    isDarkMode?: boolean;
    scale?: number;
}

export default function PdfViewer({
    pdfUrl,
    currentPage,
    onPageChange,
    onLoadSuccess,
    isDarkMode = false,
    scale = 1.0
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [proxyUrl, setProxyUrl] = useState<string>('');

    useEffect(() => {
        // Convert backend URL to proxy URL
        if (pdfUrl) {
            // If it's a backend media URL, proxy it through our API
            if (pdfUrl.includes('/media/')) {
                const mediaPath = pdfUrl.split('/media/')[1];
                setProxyUrl(`/api/pdf/${mediaPath}`);
            } else if (pdfUrl.startsWith('http://127.0.0.1') || pdfUrl.startsWith('http://localhost')) {
                // Extract the path and proxy it
                try {
                    const url = new URL(pdfUrl);
                    const path = url.pathname.replace('/media/', '');
                    setProxyUrl(`/api/pdf/${path}`);
                } catch {
                    setProxyUrl(pdfUrl);
                }
            } else {
                // External URL, use directly
                setProxyUrl(pdfUrl);
            }
        }
    }, [pdfUrl]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        onLoadSuccess?.(numPages);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF. Please try again later.');
        setLoading(false);
    };

    if (!proxyUrl) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No PDF URL provided</p>
            </div>
        );
    }

    return (
        <div
            className="pdf-viewer w-full h-full overflow-auto flex flex-col items-center"
            style={{ filter: isDarkMode ? 'invert(1) hue-rotate(180deg)' : 'none' }}
        >
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Loading PDF...</span>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                            }}
                            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <Document
                file={proxyUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                className="pdf-document"
            >
                <Page
                    pageNumber={currentPage}
                    scale={scale}
                    className="pdf-page shadow-lg mb-4"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                />
            </Document>
        </div>
    );
}
