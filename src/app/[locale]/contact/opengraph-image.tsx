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
          background: 'linear-gradient(135deg, #172554 0%, #0ea5e9 55%, #22c55e 100%)',
          color: '#ffffff',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 700, marginBottom: 16 }}>Contact MemoLib</div>
        <div style={{ fontSize: 34, maxWidth: 900 }}>
          Demandez une demo et echangez avec notre equipe produit
        </div>
      </div>
    ),
    size
  );
}