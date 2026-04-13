import { FiMoon, FiMonitor, FiSun } from 'react-icons/fi'
import './ThemeSwitch.css'

type ThemeMode = 'light' | 'dark' | 'system'

type ThemeSwitchProps = {
	themeMode: ThemeMode
	onChangeThemeMode: (mode: ThemeMode) => void
}

export function ThemeSwitch({ themeMode, onChangeThemeMode }: Readonly<ThemeSwitchProps>) {
	return (
		<div className="theme-switch" aria-label="Theme mode">
			<button
				type="button"
				className={`theme-switch__button${themeMode === 'light' ? ' theme-switch__button--active' : ''}`}
				onClick={() => onChangeThemeMode('light')}
				aria-pressed={themeMode === 'light'}
				aria-label="Light theme"
				title="Light"
			>
				<FiSun aria-hidden="true" />
			</button>
			<button
				type="button"
				className={`theme-switch__button${themeMode === 'system' ? ' theme-switch__button--active' : ''}`}
				onClick={() => onChangeThemeMode('system')}
				aria-pressed={themeMode === 'system'}
				aria-label="System theme"
				title="System"
			>
				<FiMonitor aria-hidden="true" />
			</button>
			<button
				type="button"
				className={`theme-switch__button${themeMode === 'dark' ? ' theme-switch__button--active' : ''}`}
				onClick={() => onChangeThemeMode('dark')}
				aria-pressed={themeMode === 'dark'}
				aria-label="Dark theme"
				title="Dark"
			>
				<FiMoon aria-hidden="true" />
			</button>
		</div>
	)
}
