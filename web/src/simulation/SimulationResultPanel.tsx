import Plot from 'react-plotly.js'

import type { SimulationData } from '@/types/circuit'

import styles from './SimulationResultPanel.module.css'

export interface SimulationResultPanelProps {
  result: SimulationData | null
  error: string | null
  isRunning: boolean
}

export function SimulationResultPanel({ result, error, isRunning }: SimulationResultPanelProps) {
  const hasSignals = Boolean(result && result.signals.length > 0)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>仿真结果</div>
      <div className={styles.body}>
        {isRunning ? (
          <div className={styles.message}>正在运行仿真，请稍候…</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : hasSignals && result ? (
          <Plot
            className={styles.plot}
            data={result.signals.map((signal) => ({
              x: result.time,
              y: signal.values,
              type: 'scatter',
              mode: 'lines',
              name: signal.label ?? signal.id,
            }))}
            layout={{
              autosize: true,
              margin: { l: 48, r: 16, t: 16, b: 40 },
              legend: { orientation: 'h' },
              xaxis: { title: '时间 (s)' },
              yaxis: { title: '数值' },
              paper_bgcolor: 'rgba(248, 250, 252, 0.92)',
              plot_bgcolor: 'rgba(255, 255, 255, 0.98)',
            }}
            config={{ responsive: true, displaylogo: false }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className={styles.message}>暂无仿真结果</div>
        )}
      </div>
    </div>
  )
}
