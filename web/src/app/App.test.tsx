import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('渲染主标题', () => {
    render(<App />)
    expect(screen.getByText('J-Circuit v1.2 原型')).toBeInTheDocument()
  })
})
