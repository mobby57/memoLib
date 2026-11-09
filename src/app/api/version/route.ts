import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);

    const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT || null;
    const env = process.env.NODE_ENV || 'production';
    const previewProtected = process.env.PREVIEW_PROTECT === 'true';

    return NextResponse.json(
      {
        name: pkg.name || 'app',
        version: pkg.version || null,
        commit,
        env,
        previewProtected,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: 'version_unavailable' }, { status: 500 });
  }
}
