"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  pdfUrl: string;
  currentPage: number;
  highlights?: Array<{
    page: number;
    text: string;
    color: string;
  }>;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  onPageTextLoad?: (page: number, text: string) => void;
  isDarkMode?: boolean;
  scale?: number;
}

export default function PdfViewer({
  pdfUrl,
  currentPage,
  highlights = [],
  onPageChange,
  onLoadSuccess,
  onPageTextLoad,
  isDarkMode = false,
  scale = 1,
}: PdfViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const root = viewerRef.current;
      if (!root) return;

      const spans = Array.from(root.querySelectorAll<HTMLSpanElement>(".react-pdf__Page__textContent span"));
      spans.forEach((span) => {
        if (!span.dataset.bcOriginalText) {
          span.dataset.bcOriginalText = span.textContent || "";
        }

        if (span.dataset.bcMarker === "true") {
          span.textContent = span.dataset.bcOriginalText || "";
          delete span.dataset.bcMarker;
        }
      });

      const pageHighlights = highlights
        .filter((highlight) => highlight.page === currentPage)
        .map((highlight) => ({
          ...highlight,
          text: normalizeText(highlight.text),
        }))
        .filter((highlight) => highlight.text.length > 0);

      if (pageHighlights.length === 0 || spans.length === 0) {
        return;
      }

      const segments: Array<{ span: HTMLSpanElement; start: number; end: number; text: string }> = [];
      let pageText = "";

      spans.forEach((span) => {
        const text = normalizeText(span.dataset.bcOriginalText || span.textContent || "");
        if (!text) return;

        if (pageText) {
          pageText += " ";
        }

        const start = pageText.length;
        pageText += text;
        segments.push({ span, start, end: pageText.length, text });
      });

      const rangesBySpan = new Map<HTMLSpanElement, Array<{ start: number; end: number; color: string }>>();

      pageHighlights.forEach((highlight) => {
        const start = pageText.indexOf(highlight.text);
        if (start === -1) return;

        const end = start + highlight.text.length;
        segments.forEach((segment) => {
          if (segment.end < start || segment.start > end) return;

          const localStart = Math.max(0, start - segment.start);
          const localEnd = Math.min(segment.text.length, end - segment.start);
          if (localEnd <= localStart) return;

          const ranges = rangesBySpan.get(segment.span) ?? [];
          ranges.push({
            start: localStart,
            end: localEnd,
            color: getMarkerColor(highlight.color),
          });
          rangesBySpan.set(segment.span, ranges);
        });
      });

      rangesBySpan.forEach((ranges, span) => {
        const text = normalizeText(span.dataset.bcOriginalText || span.textContent || "");
        const merged = ranges
          .sort((a, b) => a.start - b.start)
          .reduce<Array<{ start: number; end: number; color: string }>>((acc, range) => {
            const previous = acc[acc.length - 1];
            if (previous && range.start <= previous.end && range.color === previous.color) {
              previous.end = Math.max(previous.end, range.end);
            } else {
              acc.push({ ...range });
            }
            return acc;
          }, []);

        let html = "";
        let cursor = 0;
        merged.forEach((range) => {
          html += escapeHtml(text.slice(cursor, range.start));
          html += `<mark style="${getMarkerStyle(range.color)}">${escapeHtml(text.slice(range.start, range.end))}</mark>`;
          cursor = range.end;
        });
        html += escapeHtml(text.slice(cursor));

        span.dataset.bcMarker = "true";
        span.innerHTML = html;
      });
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [currentPage, highlights, scale]);

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
      ref={viewerRef}
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

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getMarkerColor(color: string) {
  const map: Record<string, string> = {
    yellow: "rgba(253, 224, 71, 0.72)",
    green: "rgba(134, 239, 172, 0.68)",
    blue: "rgba(147, 197, 253, 0.68)",
    pink: "rgba(249, 168, 212, 0.68)",
    purple: "rgba(196, 181, 253, 0.68)",
  };

  return map[color] ?? map.yellow;
}

function getMarkerStyle(color: string) {
  return [
    "background:" + color,
    "border-radius:3px",
    "box-decoration-break:clone",
    "-webkit-box-decoration-break:clone",
    "padding:0 1px",
    "color:inherit",
  ].join(";");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
