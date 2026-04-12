import { useEffect, useState } from 'react'
import { BoardPage } from '@/pages/BoardPage'

type ThemeMode = 'light' | 'dark'

function getInitialTheme(): ThemeMode {
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark'
	}

	return 'light'
}

function App() {
	const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme)
	}, [theme])

	return (
		<BoardPage
			theme={theme}
			onToggleTheme={() => {
				setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
			}}
		/>
	)
}

export default App