import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #06b6d4 100%)',
          color: '#ffffff',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, marginBottom: 18 }}>MemoLib</div>
        <div style={{ fontSize: 44, fontWeight: 600, maxWidth: 900 }}>
          Demo interactive pour cabinets d'avocats
        </div>
      </div>
    ),
    size
  );
}