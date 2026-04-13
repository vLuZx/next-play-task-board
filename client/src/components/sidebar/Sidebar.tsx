import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiLayout, FiUsers, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { ThemeSwitch } from './theme-switch/ThemeSwitch'
import { ViewModeSwitch } from './view-mode-switch/ViewModeSwitch'
import './Sidebar.css'

type SidebarProps = {
	themeMode: 'light' | 'dark' | 'system'
	boardViewMode: 'row' | 'column'
	allowRowView: boolean
	onChangeThemeMode: (mode: 'light' | 'dark' | 'system') => void
	onChangeBoardViewMode: (mode: 'row' | 'column') => void
}

const navItems = [
	{ to: '/', icon: <FiLayout aria-hidden="true" />, label: 'Task Board' },
	{ to: '/team', icon: <FiUsers aria-hidden="true" />, label: 'Team Members' },
]

export function Sidebar({ themeMode, boardViewMode, allowRowView, onChangeThemeMode, onChangeBoardViewMode }: Readonly<SidebarProps>) {
	const [isCollapsed, setIsCollapsed] = useState(false)

	return (
		<>
			{isCollapsed ? null : (
				<button
					type="button"
					className="sidebar__mobile-backdrop"
					onClick={() => setIsCollapsed(true)}
					aria-label="Collapse sidebar"
				/>
			)}
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
				<ViewModeSwitch
					boardViewMode={boardViewMode}
					allowRowView={allowRowView}
					onChangeBoardViewMode={onChangeBoardViewMode}
				/>
				<ThemeSwitch themeMode={themeMode} onChangeThemeMode={onChangeThemeMode} />
			</div>
			</aside>
		</>
	)
}
