import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { BoardPage } from '@/pages/BoardPage'
import { TeamMembersPage } from '@/pages/TeamMembersPage'
import './App.css'

type ThemeMode = 'light' | 'dark' | 'system'

function getSystemTheme() {
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark' as const
	}

	return 'light' as const
}

function App() {
	const [themeMode, setThemeMode] = useState<ThemeMode>('system')
	const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)
	const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

		function handlePreferenceChange(event: MediaQueryListEvent) {
			setSystemTheme(event.matches ? 'dark' : 'light')
		}

		mediaQuery.addEventListener('change', handlePreferenceChange)

		return () => {
			mediaQuery.removeEventListener('change', handlePreferenceChange)
		}
	}, [])

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', resolvedTheme)
	}, [resolvedTheme])

	return (
		<BrowserRouter>
			<div className="app-shell">
				<Sidebar themeMode={themeMode} onChangeThemeMode={setThemeMode} />
				<div className="app-shell__content">
					<Routes>
						<Route path="/" element={<BoardPage />} />
						<Route path="/team" element={<TeamMembersPage />} />
					</Routes>
				</div>
			</div>
		</BrowserRouter>
	)
}

export default App
