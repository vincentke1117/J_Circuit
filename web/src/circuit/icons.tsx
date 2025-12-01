import type { ReactElement } from 'react'
import type { CircuitComponentType } from './components'

type IconProps = { size?: number }

function baseSvg(children: ReactElement | ReactElement[], size = 16) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconResistor({ size = 16 }: IconProps) {
  return baseSvg(
    <path d="M2 12h4l2-4 2 8 2-8 2 8 2-4h4" />, 
    size,
  )
}

export function IconCapacitor({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M2 12h7" />
      <path d="M15 12h7" />
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </>,
    size,
  )
}

export function IconInductor({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M2 12c2-4 6-4 8 0" />
      <path d="M10 12c2-4 6-4 8 0" />
      <path d="M18 12c2-4 6-4 8 0" />
    </>,
    size,
  )
}

export function IconVDC({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M10 9h4" />
      <path d="M12 7v4" />
      <path d="M10 15h4" />
    </>,
    size,
  )
}

export function IconVAC({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M6 12c2-3 4 3 6 0s4-3 6 0" />
    </>,
    size,
  )
}

export function IconGround({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M12 10v4" />
      <path d="M6 14h12" />
      <path d="M8 16h8" />
      <path d="M10 18h4" />
    </>,
    size,
  )
}

export function IconVProbe({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </>,
    size,
  )
}

export function IconIProbe({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v8" />
      <path d="M12 8l-2 2" />
      <path d="M12 8l2 2" />
    </>,
    size,
  )
}

// 直流电流源
export function IconIDC({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v8" />
      <path d="M12 16l-2-2" />
      <path d="M12 16l2-2" />
    </>,
    size,
  )
}

// 交流电流源
export function IconIAC({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M6 12c2-3 4 3 6 0s4-3 6 0" />
      <path d="M12 8l-2 2" />
      <path d="M12 8l2 2" />
    </>,
    size,
  )
}

// 电压控制电压源 (VCVS)
export function IconVCVS({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M10 10h4" />
      <path d="M12 8v2" />
      <path d="M10 14h4" />
    </>,
    size,
  )
}

// 电流控制电压源 (CCVS)
export function IconCCVS({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M10 10h4" />
      <path d="M12 8v2" />
      <path d="M10 14h4" />
      <circle cx="10" cy="12" r="1" fill="currentColor" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
    </>,
    size,
  )
}

// 电压控制电流源 (VCCS)
export function IconVCCS({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M12 10v4" />
      <path d="M12 14l-2-2" />
      <path d="M12 14l2-2" />
    </>,
    size,
  )
}

// 电流控制电流源 (CCCS)
export function IconCCCS({ size = 16 }: IconProps) {
  return baseSvg(
    <>
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M12 10v4" />
      <path d="M12 14l-2-2" />
      <path d="M12 14l2-2" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="14" cy="10" r="1" fill="currentColor" />
    </>,
    size,
  )
}

export function IconSwitch({ size = 16, state = 0 }: IconProps & { state?: number }) {
  const isOpen = state === 0
  return baseSvg(
    <>
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
      <path d="M0 12h8" />
      <path d="M16 12h8" />
      {isOpen ? (
        <path d="M8 12l7-4" />
      ) : (
        <path d="M8 12h8" />
      )}
    </>,
    size,
  )
}

export function ComponentIcon({ type, size = 16, parameters }: { type: CircuitComponentType; size?: number; parameters?: Record<string, number> }) {
  switch (type) {
    case 'switch':
      return <IconSwitch size={size} state={parameters?.state} />
    case 'resistor':
      return <IconResistor size={size} />
    case 'capacitor':
      return <IconCapacitor size={size} />
    case 'inductor':
      return <IconInductor size={size} />
    case 'vsource_dc':
      return <IconVDC size={size} />
    case 'vsource_ac':
      return <IconVAC size={size} />
    case 'isource_dc':
      return <IconIDC size={size} />
    case 'isource_ac':
      return <IconIAC size={size} />
    case 'vcvs':
      return <IconVCVS size={size} />
    case 'ccvs':
      return <IconCCVS size={size} />
    case 'vccs':
      return <IconVCCS size={size} />
    case 'cccs':
      return <IconCCCS size={size} />
    case 'ground':
      return <IconGround size={size} />
    case 'voltage_probe':
      return <IconVProbe size={size} />
    case 'current_probe':
      return <IconIProbe size={size} />
    default:
      return baseSvg(<circle cx="12" cy="12" r="6" />, size)
  }
}