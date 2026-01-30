import React from 'react';

type VersionInfo = {
  name?: string;
  version?: string | null;
  commit?: string | null;
  env?: string;
  previewProtected?: boolean;
  timestamp?: string;
};

export function BuildInfo() {
  const [info, setInfo] = React.useState<VersionInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const clientCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT || null;

  React.useEffect(() => {
    let mounted = true;
    fetch('/api/version')
      .then(async r => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then((data: VersionInfo) => {
        if (mounted) setInfo(data);
      })
      .catch(e => mounted && setError(e.message));
    return () => {
      mounted = false;
    };
  }, []);

  const mismatch = info && info.commit && clientCommit && info.commit !== clientCommit;

  return (
    <div data-testid="build-info" style={{ fontSize: 12, color: '#555' }}>
      {error && <span style={{ color: 'crimson' }}>Version error</span>}
      {!error && (
        <>
          <span>
            {info?.name || 'app'} v{info?.version || 'n/a'} • commit{' '}
            {clientCommit?.slice(0, 7) || 'n/a'}
          </span>
          {mismatch ? (
            <span style={{ marginLeft: 8, color: 'crimson' }}>
              (mismatch: server {info?.commit?.slice(0, 7)})
            </span>
          ) : (
            <span style={{ marginLeft: 8, color: 'green' }}>(synced)</span>
          )}
          {info?.previewProtected && <span style={{ marginLeft: 8 }}>(preview protected)</span>}
        </>
      )}
    </div>
  );
}
