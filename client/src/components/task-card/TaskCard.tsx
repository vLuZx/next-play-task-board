import { useEffect, useRef, useState } from 'react'
import './TaskCard.css'
import type { BoardTask, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'
import { Avatar } from '@/components/avatar/Avatar'

type TaskCardProps = {
	task: BoardTask
	assignees: TeamMember[]
	tags: TaskTag[]
	isDragging: boolean
	onEdit: () => void
	onDelete: () => void
	onOpenDetails: () => void
	onDragStart: () => void
	onDragEnd: () => void
}

function parseDueDate(value: string) {
	const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

	if (dateOnlyMatch) {
		const [, year, month, day] = dateOnlyMatch
		return new Date(Number(year), Number(month) - 1, Number(day))
	}

	return new Date(value)
}

function formatDueDate(dueDate?: string | null) {
	if (!dueDate) {
		return null
	}

	const parsedDate = parseDueDate(dueDate)

	if (Number.isNaN(parsedDate.getTime())) {
		return null
	}

	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
	}).format(parsedDate)
}

function getDueDateInfo(dueDate?: string | null) {
	if (!dueDate) {
		return { tone: 'gray' as const, isOverdue: false }
	}

	const due = parseDueDate(dueDate)

	if (Number.isNaN(due.getTime())) {
		return { tone: 'gray' as const, isOverdue: false }
	}

	const today = new Date()
	const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
	const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
	const dayDifference = (dueUtc - todayUtc) / (1000 * 60 * 60 * 24)

	if (dayDifference < 0) {
		return { tone: 'red' as const, isOverdue: true }
	}

	if (dayDifference <= 3) {
		return { tone: 'orange' as const, isOverdue: false }
	}

	if (dayDifference <= 7) {
		return { tone: 'yellow' as const, isOverdue: false }
	}

	return { tone: 'gray' as const, isOverdue: false }
}

export function TaskCard({
	task,
	assignees,
	tags,
	isDragging,
	onEdit,
	onDelete,
	onOpenDetails,
	onDragStart,
	onDragEnd,
}: TaskCardProps) {
	const formattedDueDate = formatDueDate(task.dueDate)
	const dueDateInfo = getDueDateInfo(task.dueDate)
	const [isExpanded, setIsExpanded] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isHoverTooltipVisible, setIsHoverTooltipVisible] = useState(false)
	const [hoverTooltipText, setHoverTooltipText] = useState('')
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
	const menuRef = useRef<HTMLDivElement | null>(null)
	const tooltipTimerRef = useRef<number | null>(null)
	const hasDescription = Boolean(task.description?.trim())

	useEffect(() => {
		if (!isMenuOpen) {
			return
		}

		function handlePointerDown(event: PointerEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setIsMenuOpen(false)
			}
		}

		window.addEventListener('pointerdown', handlePointerDown)

		return () => {
			window.removeEventListener('pointerdown', handlePointerDown)
		}
	}, [isMenuOpen])

	useEffect(() => {
		if (!isDeleteModalOpen) {
			return
		}

		function handleEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsDeleteModalOpen(false)
			}
		}

		window.addEventListener('keydown', handleEscapeKey)

		return () => {
			window.removeEventListener('keydown', handleEscapeKey)
		}
	}, [isDeleteModalOpen])

	useEffect(() => {
		return () => {
			if (tooltipTimerRef.current) {
				window.clearTimeout(tooltipTimerRef.current)
			}
		}
	}, [])

	function handleConfirmDelete() {
		setIsDeleteModalOpen(false)
		onDelete()
	}

	function openHoverTooltip(clientX: number, clientY: number, label: string) {
		setHoverTooltipText(label)
		setTooltipPosition({ x: clientX, y: clientY + 14 })
		if (tooltipTimerRef.current) {
			window.clearTimeout(tooltipTimerRef.current)
		}
		tooltipTimerRef.current = window.setTimeout(() => {
			setIsHoverTooltipVisible(true)
		}, 120)
	}

	function closeInfoTooltip() {
		if (tooltipTimerRef.current) {
			window.clearTimeout(tooltipTimerRef.current)
		}
		setIsHoverTooltipVisible(false)
	}

	return (
		<article
			className={`task-card${isDragging ? ' task-card--dragging' : ''}`}
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
		>
			<div className="task-card__header">
				<div className="task-card__header-main">
					<h3 className="task-card__title">{task.title}</h3>
				</div>
				<div className="task-card__actions">
					{hasDescription ? (
						<button
							type="button"
							className="task-card__toggle"
							onClick={() => {
								closeInfoTooltip()
								setIsExpanded((currentValue) => !currentValue)
							}}
							onMouseEnter={(event) => {
								openHoverTooltip(event.clientX, event.clientY, isExpanded ? 'Collapse Description' : 'Expand Description')
							}}
							onMouseMove={(event) => {
								setTooltipPosition({ x: event.clientX, y: event.clientY + 14 })
							}}
							onMouseLeave={closeInfoTooltip}
							onBlur={closeInfoTooltip}
							aria-expanded={isExpanded}
							aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
						>
							<span className={`task-card__toggle-arrow${isExpanded ? ' task-card__toggle-arrow--expanded' : ''}`}>
								▸
							</span>
						</button>
					) : null}
					<div className="task-card__menu" ref={menuRef}>
						<button
							type="button"
							className="task-card__toggle"
							onClick={() => {
								closeInfoTooltip()
								setIsMenuOpen((currentValue) => !currentValue)
							}}
							onMouseEnter={(event) => {
								openHoverTooltip(event.clientX, event.clientY, 'More Info')
							}}
							onMouseMove={(event) => {
								setTooltipPosition({ x: event.clientX, y: event.clientY + 14 })
							}}
							onMouseLeave={closeInfoTooltip}
							onBlur={closeInfoTooltip}
							aria-expanded={isMenuOpen}
							aria-label="More Info"
						>
							<span className="task-card__menu-dots">⋯</span>
						</button>
						{isMenuOpen ? (
							<div className="task-card__menu-list" role="menu">
								<button
									type="button"
									className="task-card__menu-item"
									onClick={() => {
										setIsMenuOpen(false)
										onOpenDetails()
									}}
								>
									Open Details
								</button>
								<button
									type="button"
									className="task-card__menu-item"
									onClick={() => {
										setIsMenuOpen(false)
										onEdit()
									}}
								>
									Edit Task
								</button>
								<button
									type="button"
									className="task-card__menu-item task-card__menu-item--danger"
									onClick={() => {
										setIsMenuOpen(false)
										setIsDeleteModalOpen(true)
									}}
								>
									Delete Task
								</button>
							</div>
						) : null}
						{isHoverTooltipVisible ? (
							<span
								className="task-card__hover-tooltip"
								style={{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }}
							>
								{hoverTooltipText}
							</span>
						) : null}
					</div>
				</div>
			</div>

			{hasDescription && isExpanded ? (
				<div className="task-card__content">
					<p className="task-card__description">{task.description}</p>
				</div>
			) : null}

			<div className="task-card__meta">
				<span className={`task-card__priority task-card__priority--${task.priorityFlow}`}>
					{task.priorityFlow}
				</span>
				{tags.map((tag) => (
					<span key={tag.id} className="task-card__meta-item task-card__meta-item--tag">
						{tag.name}
					</span>
				))}
				{formattedDueDate ? (
					<span
						className={`task-card__meta-item task-card__meta-item--due task-card__meta-item--due-${dueDateInfo.tone}`}
					>
						{dueDateInfo.isOverdue ? 'Overdue' : `Due ${formattedDueDate}`}
					</span>
				) : null}
				{assignees.length ? (
					<span className="task-card__assignees" aria-label={`Assigned to ${assignees.map((assignee) => assignee.name).join(', ')}`}>
						{assignees.slice(0, 3).map((assignee) => (
							<span key={assignee.id} className="task-card__assignee" title={assignee.name}>
								<Avatar name={assignee.name} src={assignee.avatarUrl} size={28} />
							</span>
						))}
					</span>
				) : null}
			</div>

			{isDeleteModalOpen ? (
				<div
					className="task-card__confirm-backdrop"
					onClick={() => {
						setIsDeleteModalOpen(false)
					}}
				>
					<div
						className="task-card__confirm-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby={`delete-task-title-${task.id}`}
						onClick={(event) => {
							event.stopPropagation()
						}}
					>
						<h4 id={`delete-task-title-${task.id}`} className="task-card__confirm-title">Delete Task?</h4>
						<p className="task-card__confirm-text">This action cannot be undone.</p>
						<div className="task-card__confirm-actions">
							<button
								type="button"
								className="task-card__confirm-cancel"
								onClick={() => {
									setIsDeleteModalOpen(false)
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								className="task-card__confirm-delete"
								onClick={handleConfirmDelete}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			) : null}
		</article>
	)
}