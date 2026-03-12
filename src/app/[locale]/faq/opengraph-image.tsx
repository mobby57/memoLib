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
          background: 'linear-gradient(135deg, #1e1b4b 0%, #3b82f6 55%, #6366f1 100%)',
          color: '#ffffff',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 700, marginBottom: 16 }}>FAQ MemoLib</div>
        <div style={{ fontSize: 34, maxWidth: 900 }}>
          Reponses sur la securite, le RGPD, les tarifs et les integrations
        </div>
      </div>
    ),
    size
  );
}