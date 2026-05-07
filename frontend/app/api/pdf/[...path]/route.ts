import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
const MEDIA_ROOT = path.resolve(process.cwd(), '..', 'backend', 'media');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const pdfPath = path.join('/');
        const localPath = pathModuleSafeJoin(MEDIA_ROOT, path);

        if (localPath) {
            try {
                const pdfBuffer = await readFile(localPath);

                return new NextResponse(pdfBuffer, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'inline',
                        'Cache-Control': 'public, max-age=3600',
                    },
                });
            } catch {
                // Fall back to Django media serving below.
            }
        }

        // Construct the full URL to fetch the PDF from the backend
        const url = `${API_BASE}/media/${path.map(encodeURIComponent).join('/')}`;

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
                'Content-Type': response.headers.get('Content-Type') ?? 'application/pdf',
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

function pathModuleSafeJoin(root: string, segments: string[]) {
    const target = path.resolve(root, ...segments);
    const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

    if (target !== root && !target.startsWith(rootWithSeparator)) {
        return null;
    }

    return target;
}
