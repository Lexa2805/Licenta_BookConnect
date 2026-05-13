"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  pdfUrl: string;
  currentPage: number;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  onPageTextLoad?: (page: number, text: string) => void;
  isDarkMode?: boolean;
  scale?: number;
}

export default function PdfViewer({
  pdfUrl,
  currentPage,
  onPageChange,
  onLoadSuccess,
  onPageTextLoad,
  isDarkMode = false,
  scale = 1,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proxyUrl, setProxyUrl] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNumPages(0);
    setPdfDocument(null);

    if (!pdfUrl?.trim()) {
      setProxyUrl("");
      return;
    }

    try {
      const url = new URL(pdfUrl, window.location.origin);
      const mediaIndex = url.pathname.indexOf("/media/");

      if (mediaIndex >= 0) {
        const mediaPath = url.pathname.slice(mediaIndex + "/media/".length);
        setProxyUrl(`/api/pdf/${mediaPath}`);
        return;
      }

      if (url.pathname.startsWith("/api/pdf/")) {
        setProxyUrl(`${url.pathname}${url.search}`);
        return;
      }

      setProxyUrl(url.toString());
    } catch {
      setProxyUrl(pdfUrl);
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (!numPages || currentPage <= numPages) {
      return;
    }
    onPageChange?.(numPages);
  }, [currentPage, numPages, onPageChange]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageText() {
      if (!pdfDocument || !currentPage || !onPageTextLoad) {
        return;
      }

      try {
        const page = await pdfDocument.getPage(currentPage);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: { str?: string }) => item.str || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (!cancelled) {
          onPageTextLoad(currentPage, text);
        }
      } catch (nextError) {
        console.error("Error extracting PDF page text:", nextError);
        if (!cancelled) {
          onPageTextLoad(currentPage, "");
        }
      }
    }

    loadPageText();

    return () => {
      cancelled = true;
    };
  }, [currentPage, onPageTextLoad, pdfDocument]);

  const handleLoadSuccess = (pdf: { numPages: number }) => {
    setPdfDocument(pdf);
    const loadedPages = pdf.numPages;
    setNumPages(loadedPages);
    setLoading(false);
    onLoadSuccess?.(loadedPages);
  };

  const handleLoadError = (nextError: Error) => {
    console.error("Error loading PDF:", nextError);
    setError("Failed to load PDF. Please try again later.");
    setLoading(false);
  };

  if (!proxyUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No PDF URL provided</p>
      </div>
    );
  }

  return (
    <div
      className="pdf-viewer flex h-full w-full flex-col items-center overflow-auto"
      style={{ filter: isDarkMode ? "invert(1) hue-rotate(180deg)" : "none" }}
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading PDF...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="mb-4 text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                setReloadKey((key) => key + 1);
              }}
              className="rounded bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!error && (
        <Document
          key={`${proxyUrl}-${reloadKey}`}
          file={proxyUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          className="pdf-document"
        >
          <Page
            pageNumber={numPages ? Math.min(currentPage, numPages) : currentPage}
            scale={scale}
            className="pdf-page mb-4 shadow-lg"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      )}
    </div>
  );
}
