import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  // @ts-expect-error jsdom 环境缺省定义
  window.ResizeObserver = ResizeObserverMock
}

if (typeof window !== 'undefined' && typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = () => ''
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return null
  }
}
