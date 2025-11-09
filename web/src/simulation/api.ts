import type { SimulationPayload, SimulationResponse } from '@/types/circuit'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function runSimulationRequest(payload: SimulationPayload): Promise<SimulationResponse> {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`服务器返回错误状态：${response.status}`)
  }

  const data = (await response.json()) as SimulationResponse
  return data
}
