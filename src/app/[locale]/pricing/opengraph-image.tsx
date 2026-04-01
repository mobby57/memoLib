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
          background: 'linear-gradient(135deg, #111827 0%, #2563eb 45%, #14b8a6 100%)',
          color: '#ffffff',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 700, marginBottom: 16 }}>Tarifs MemoLib</div>
        <div style={{ fontSize: 36, maxWidth: 900 }}>
          Comparez les plans pour avocats independants, cabinets et equipes
        </div>
      </div>
    ),
    size
  );
}