interface Props {
  loaded: number
  total: number
}

/**
 * 読み込み中スクリーン（Pokégear LCD風）
 */
export function LoadingScreen({ loaded, total }: Props) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-4">
      <div className="pdx-lens-ball mb-4" style={{ width: 72, height: 72 }} />
      <h1 className="pdx-title mb-1" style={{ color: 'var(--ink)', textShadow: 'none', fontSize: 22 }}>
        ポケチャン Battle Dex
      </h1>
      <div className="pdx-sub mb-6" style={{ color: 'var(--red)' }}>
        TRAINER SUPPORT TOOL
      </div>

      <div
        className="pdx-lcd"
        style={{ width: 'min(360px, 90vw)', textAlign: 'center' }}
      >
        <div style={{ fontFamily: 'var(--font-arcade)', fontSize: 8, letterSpacing: '0.1em' }}>
          LOADING DEX DATA
        </div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
          {loaded} / {total}
        </div>
        <div
          style={{
            height: 10,
            background: 'rgba(0,0,0,0.18)',
            borderRadius: 4,
            margin: '8px 0 6px',
            overflow: 'hidden',
            border: '1.5px solid var(--lcd-deep)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--lcd-deep), var(--lcd-text))',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 13 }}>{pct}%</div>
      </div>

      <p className="mt-4" style={{ fontFamily: 'var(--font-pixel)', fontSize: 12, color: 'var(--ink-soft)' }}>
        初回のみ数分かかります
      </p>
    </div>
  )
}
