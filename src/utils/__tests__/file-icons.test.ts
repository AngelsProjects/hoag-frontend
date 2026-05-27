import { describe, it, expect } from 'vitest'
import { getFileIcon } from '@/utils/file-icons'

describe('getFileIcon', () => {
  it('returns yellow for open folder', () => {
    const result = getFileIcon('dir', true)
    expect(result.emoji).toBe('📂')
    expect(result.color).toBe('#dcb67a')
  })

  it('returns yellow for closed folder', () => {
    const result = getFileIcon('dir', false)
    expect(result.emoji).toBe('📁')
    expect(result.color).toBe('#dcb67a')
  })

  it('returns blue for .ts files', () => {
    const result = getFileIcon('file', false, 'index.ts')
    expect(result.color).toBe('#519aba')
  })

  it('returns blue for .tsx files', () => {
    const result = getFileIcon('file', false, 'App.tsx')
    expect(result.color).toBe('#519aba')
  })

  it('returns yellow for .json files', () => {
    const result = getFileIcon('file', false, 'package.json')
    expect(result.color).toBe('#f7c948')
  })

  it('returns pink for .css files', () => {
    const result = getFileIcon('file', false, 'styles.css')
    expect(result.color).toBe('#ce9178')
  })

  it('returns pink for .scss files', () => {
    const result = getFileIcon('file', false, 'styles.scss')
    expect(result.color).toBe('#ce9178')
  })

  it('returns white for .md files', () => {
    const result = getFileIcon('file', false, 'README.md')
    expect(result.color).toBe('#cccccc')
  })

  it('returns grey for unknown extensions', () => {
    const result = getFileIcon('file', false, 'Makefile')
    expect(result.color).toBe('#858585')
  })
})
