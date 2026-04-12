import { useEffect, useRef, useState } from 'react'
import './TaskCard.css'
import type { BoardTask } from '@/types/task'

type TaskCardProps = {
	task: BoardTask
	isDragging: boolean
	onEdit: () => void
	onDelete: () => void
	onDragStart: () => void
	onDragEnd: () => void
}

function formatDueDate(dueDate?: string | null) {
	if (!dueDate) {
		return null
	}

	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
	}).format(new Date(dueDate))
}

export function TaskCard({ task, isDragging, onEdit, onDelete, onDragStart, onDragEnd }: TaskCardProps) {
	const formattedDueDate = formatDueDate(task.dueDate)
	const [isExpanded, setIsExpanded] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement | null>(null)
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

	return (
		<article
			className={`task-card${isDragging ? ' task-card--dragging' : ''}`}
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
		>
			<div className="task-card__header">
				<span className={`task-card__priority task-card__priority--${task.priorityFlow}`}>
					{task.priorityFlow}
				</span>
				<div className="task-card__actions">
					{hasDescription ? (
						<button
							type="button"
							className="task-card__toggle"
							onClick={() => {
								setIsExpanded((currentValue) => !currentValue)
							}}
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
								setIsMenuOpen((currentValue) => !currentValue)
							}}
							aria-expanded={isMenuOpen}
							aria-label="Task actions"
						>
							<span className="task-card__menu-dots">⋮</span>
						</button>
						{isMenuOpen ? (
							<div className="task-card__menu-list" role="menu">
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
										onDelete()
									}}
								>
									Delete Task
								</button>
							</div>
						) : null}
					</div>
				</div>
			</div>

			<div className="task-card__content">
				<h3 className="task-card__title">{task.title}</h3>
				{hasDescription && isExpanded ? (
					<p className="task-card__description">{task.description}</p>
				) : null}
			</div>

			<div className="task-card__meta">
				{formattedDueDate ? <span className="task-card__meta-item">Due {formattedDueDate}</span> : null}
				{task.assigneeId ? <span className="task-card__meta-item">Assignee {task.assigneeId}</span> : null}
			</div>
		</article>
	)
}