import { NextRequest, NextResponse } from 'next/server';
import { legalDocs, type Jurisdiction } from '@/lib/legal/documents';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const jurisdiction = (searchParams.get('jurisdiction') || 'GLOBAL') as Jurisdiction;

        // Generate Cookie Policy for jurisdiction
        const cookies = legalDocs.generateCookiePolicy(jurisdiction);

        return NextResponse.json({
            document: cookies,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cookie Policy - MemoLib</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { color: #1a202c; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 30px; }
    .meta { background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .meta p { margin: 5px 0; color: #4a5568; }
  </style>
</head>
<body>
  <div class="meta">
    <p><strong>Version:</strong> ${cookies.version}</p>
    <p><strong>Effective Date:</strong> ${cookies.effectiveDate.toLocaleDateString()}</p>
    <p><strong>Last Updated:</strong> ${cookies.lastUpdated.toLocaleDateString()}</p>
    <p><strong>Jurisdiction:</strong> ${jurisdiction}</p>
  </div>
  ${cookies.content.replace(/^# /gm, '<h1>').replace(/\n\n/g, '</p><p>').replace(/^/g, '<p>').replace(/$/, '</p>')}
</body>
</html>`
        });
    } catch (error: any) {
        console.error('Error generating Cookie Policy:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
