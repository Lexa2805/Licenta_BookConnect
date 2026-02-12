import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const pdfPath = path.join('/');

        // Construct the full URL to fetch the PDF from the backend
        const url = `${API_BASE}/media/${pdfPath}`;

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'PDF not found' },
                { status: response.status }
            );
        }

        const pdfBuffer = await response.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error fetching PDF:', error);
        return NextResponse.json(
            { error: 'Failed to load PDF' },
            { status: 500 }
        );
    }
}
