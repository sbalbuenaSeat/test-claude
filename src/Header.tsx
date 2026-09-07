import { useTheme } from './ThemeContext'
import './Header.css'

function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="app-header">
      <label className="theme-toggle">
        <span className="theme-toggle__label">Dark mode</span>
        <span className="theme-toggle__switch">
          <input
            type="checkbox"
            role="switch"
            className="theme-toggle__input"
            checked={theme === 'dark'}
            aria-checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <span className="theme-toggle__track">
            <span className="theme-toggle__thumb" />
          </span>
        </span>
      </label>
    </header>
  )
}

export default Header
