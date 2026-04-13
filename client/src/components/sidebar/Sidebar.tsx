import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiLayout, FiUsers, FiChevronLeft, FiChevronRight, FiSun, FiMoon, FiMonitor, FiList, FiColumns } from 'react-icons/fi'
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

export function Sidebar({ themeMode, boardViewMode, allowRowView, onChangeThemeMode, onChangeBoardViewMode }: SidebarProps) {
	const [isCollapsed, setIsCollapsed] = useState(false)

	return (
		<>
			{!isCollapsed ? (
				<button
					type="button"
					className="sidebar__mobile-backdrop"
					onClick={() => setIsCollapsed(true)}
					aria-label="Collapse sidebar"
				/>
			) : null}
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
				<div
					className={`sidebar__view-group${allowRowView ? '' : ' sidebar__view-group--single'}`}
					role="group"
					aria-label="Board view mode"
				>
					{allowRowView ? (
						<button
							type="button"
							className={`sidebar__view-btn${boardViewMode === 'row' ? ' sidebar__view-btn--active' : ''}`}
							onClick={() => onChangeBoardViewMode('row')}
							aria-pressed={boardViewMode === 'row'}
							aria-label="Row view"
							title="Switch to Change View"
						>
							<FiList aria-hidden="true" />
						</button>
					) : null}
					<button
						type="button"
						className={`sidebar__view-btn${boardViewMode === 'column' ? ' sidebar__view-btn--active' : ''}`}
						onClick={() => onChangeBoardViewMode('column')}
						aria-pressed={boardViewMode === 'column'}
						aria-label="Column view"
						title="Switch to Change View"
					>
						<FiColumns aria-hidden="true" />
					</button>
				</div>
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
		</>
	)
}
