import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { BoardPage } from '@/pages/BoardPage'
import { TeamMembersPage } from '@/pages/TeamMembersPage'
import './App.css'

type ThemeMode = 'light' | 'dark' | 'system'
type BoardViewMode = 'row' | 'column'

function getSystemTheme() {
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark' as const
	}

	return 'light' as const
}

function App() {
	const [themeMode, setThemeMode] = useState<ThemeMode>('system')
	const [boardViewMode, setBoardViewMode] = useState<BoardViewMode>('column')
	const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)
	const [isLargeViewport, setIsLargeViewport] = useState(() => {
		if (typeof window === 'undefined') {
			return true
		}

		return window.matchMedia('(min-width: 1280px)').matches
	})
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

	useEffect(() => {
		const mediaQuery = window.matchMedia('(min-width: 1280px)')

		function handleViewportChange(event: MediaQueryListEvent) {
			setIsLargeViewport(event.matches)
		}

		setIsLargeViewport(mediaQuery.matches)
		mediaQuery.addEventListener('change', handleViewportChange)

		return () => {
			mediaQuery.removeEventListener('change', handleViewportChange)
		}
	}, [])

	useEffect(() => {
		if (!isLargeViewport && boardViewMode === 'row') {
			setBoardViewMode('column')
		}
	}, [isLargeViewport, boardViewMode])

	return (
		<BrowserRouter>
			<div className="app-shell">
				<Sidebar
					themeMode={themeMode}
					boardViewMode={boardViewMode}
					allowRowView={isLargeViewport}
					onChangeThemeMode={setThemeMode}
					onChangeBoardViewMode={setBoardViewMode}
				/>
				<div className="app-shell__content">
					<Routes>
						<Route path="/" element={<BoardPage boardViewMode={boardViewMode} />} />
						<Route path="/team" element={<TeamMembersPage />} />
					</Routes>
				</div>
			</div>
		</BrowserRouter>
	)
}

export default App
