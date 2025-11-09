import type { SimulationSettings } from '@/types/circuit'

import styles from './SimulationControls.module.css'

export interface SimulationControlsProps {
  settings: SimulationSettings
  onChange: (settings: SimulationSettings) => void
  onRun: () => void
  disabled?: boolean
  isRunning?: boolean
}

export function SimulationControls({ settings, onChange, onRun, disabled, isRunning }: SimulationControlsProps) {
  return (
    <div className={styles.controls}>
      <label className={styles.field}>
        <span>仿真时长（秒）</span>
        <input
          className={styles.input}
          type="number"
          min={0}
          step={0.001}
          value={settings.tStop}
          onChange={(event) => onChange({ ...settings, tStop: Number(event.target.value) })}
        />
      </label>
      <label className={styles.field}>
        <span>采样点数</span>
        <input
          className={styles.input}
          type="number"
          min={1}
          step={1}
          value={settings.nSamples}
          onChange={(event) => onChange({ ...settings, nSamples: Number(event.target.value) })}
        />
      </label>
      <button
        type="button"
        className={styles.button}
        disabled={disabled || isRunning}
        onClick={onRun}
      >
        {isRunning ? '仿真中…' : '运行仿真'}
      </button>
    </div>
  )
}
