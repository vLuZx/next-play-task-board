import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiLayout, FiUsers, FiChevronLeft, FiChevronRight, FiSun, FiMoon, FiMonitor } from 'react-icons/fi'
import './Sidebar.css'

type SidebarProps = {
	themeMode: 'light' | 'dark' | 'system'
	onChangeThemeMode: (mode: 'light' | 'dark' | 'system') => void
}

const navItems = [
	{ to: '/', icon: <FiLayout aria-hidden="true" />, label: 'Board' },
	{ to: '/team', icon: <FiUsers aria-hidden="true" />, label: 'Team Members' },
]

export function Sidebar({ themeMode, onChangeThemeMode }: SidebarProps) {
	const [isCollapsed, setIsCollapsed] = useState(false)

	return (
		<aside className={`sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`}>
			<div className="sidebar__header">
				{!isCollapsed && (
					<span className="sidebar__logo">NextPlay</span>
				)}
				<button
					type="button"
					className="sidebar__toggle"
					onClick={() => setIsCollapsed((prev) => !prev)}
					aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					{isCollapsed ? <FiChevronRight aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
				</button>
			</div>

			<nav className="sidebar__nav" aria-label="Main navigation">
				{navItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.to === '/'}
						className={({ isActive }) =>
							`sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
						}
					>
						<span className="sidebar__nav-icon">{item.icon}</span>
						{!isCollapsed && (
							<span className="sidebar__nav-label">{item.label}</span>
						)}
					</NavLink>
				))}
			</nav>

			<div className="sidebar__footer">
				<div className="sidebar__theme-group" role="group" aria-label="Theme mode">
					<button
						type="button"
						className={`sidebar__theme-btn${themeMode === 'light' ? ' sidebar__theme-btn--active' : ''}`}
						onClick={() => onChangeThemeMode('light')}
						aria-pressed={themeMode === 'light'}
						aria-label="Light theme"
						title="Light"
					>
						<FiSun aria-hidden="true" />
					</button>
					<button
						type="button"
						className={`sidebar__theme-btn${themeMode === 'system' ? ' sidebar__theme-btn--active' : ''}`}
						onClick={() => onChangeThemeMode('system')}
						aria-pressed={themeMode === 'system'}
						aria-label="System theme"
						title="System"
					>
						<FiMonitor aria-hidden="true" />
					</button>
					<button
						type="button"
						className={`sidebar__theme-btn${themeMode === 'dark' ? ' sidebar__theme-btn--active' : ''}`}
						onClick={() => onChangeThemeMode('dark')}
						aria-pressed={themeMode === 'dark'}
						aria-label="Dark theme"
						title="Dark"
					>
						<FiMoon aria-hidden="true" />
					</button>
				</div>
			</div>
		</aside>
	)
}
