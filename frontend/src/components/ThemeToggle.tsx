/**
 * @file: ThemeToggle.tsx
 * @description: Компонент переключения между светлой и темной темой
 * @dependencies: App.tsx
 * @created: 2026-01-26
 */

import { useEffect, useState } from 'react'
import './ThemeToggle.css'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Переключить тему" title={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}>
      <span className="theme-toggle-icon">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
