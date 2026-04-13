import './BoardColumn.css'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiMoreVertical } from 'react-icons/fi'
import { Avatar } from '@/components/avatar/Avatar'
import { PrioritySignal } from '@/components/priority-signal/PrioritySignal'
import type { BoardColumnDefinition, BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'
import { formatOptionalDueDate, getDueIndicatorInfo, getPriorityLabel, getPriorityStrength, getTagColorClass } from '@/components/board/boardTaskUtils'

type ActiveDragState = {
	taskId: string
	fromStatus: TaskStatus
}

type TouchPoint = {
	clientX: number
	clientY: number
}

type BoardColumnProps = {
	columns: BoardColumnDefinition[]
	members: TeamMember[]
	tags: TaskTag[]
	activeDrag: ActiveDragState | null
	hoveredStatus: TaskStatus | null
	getTasksForStatus: (status: TaskStatus) => BoardTask[]
	onSetHoveredStatus: (status: TaskStatus | null) => void
	onDrop: (status: TaskStatus) => void
	onDragStart: (taskId: string, fromStatus: TaskStatus) => void
	onDragEnd: () => void
	onTouchDragStart: (taskId: string, fromStatus: TaskStatus, point: TouchPoint) => void
	onTouchDragMove: (point: TouchPoint) => boolean
	onTouchDragEnd: (point: TouchPoint) => boolean
	onTouchDragCancel: () => void
	onOpenTaskDetail: (taskId: string) => void
	onEditTask: (task: BoardTask) => void
	onDeleteTask: (taskId: string) => void
	onCreateTask: (status: TaskStatus) => void
}

function renderAssigneeStack(taskAssignees: TeamMember[], hiddenAssigneeCount: number) {
	return (
		<>
			{taskAssignees.slice(0, 3).map((member) => (
				<span className="board-row__task-assignee" key={member.id} title={member.name}>
					<Avatar name={member.name} src={member.avatarUrl} size={24} />
				</span>
			))}
			{hiddenAssigneeCount > 0 ? <span className="board-row__task-assignee-more">+{hiddenAssigneeCount}</span> : null}
		</>
	)
}

function renderDueIndicator(indicator: { tone: 'warning' | 'danger'; tooltip: string; ariaLabel: string } | null) {
	if (!indicator) {
		return null
	}

	return (
		<span
			className={`board-task-due-indicator board-task-due-indicator--${indicator.tone} board-task-icon-button`}
			data-tooltip={indicator.tooltip}
			aria-label={indicator.ariaLabel}
		>
			!
		</span>
	)
}

export function BoardColumn({
	columns,
	members,
	tags,
	activeDrag,
	hoveredStatus,
	getTasksForStatus,
	onSetHoveredStatus,
	onDrop,
	onDragStart,
	onDragEnd,
	onTouchDragStart,
	onTouchDragMove,
	onTouchDragEnd,
	onTouchDragCancel,
	onOpenTaskDetail,
	onEditTask,
	onDeleteTask,
	onCreateTask,
}: Readonly<BoardColumnProps>) {
	const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null)
	const [expandedDescriptionByTask, setExpandedDescriptionByTask] = useState<Record<string, boolean>>({})
	const menuRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!openMenuTaskId) {
			return
		}

		function handlePointerDown(event: PointerEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpenMenuTaskId(null)
			}
		}

		globalThis.addEventListener('pointerdown', handlePointerDown)
		return () => {
			globalThis.removeEventListener('pointerdown', handlePointerDown)
		}
	}, [openMenuTaskId])

	function toggleTaskDescription(taskId: string) {
		setExpandedDescriptionByTask((current) => ({
			...current,
			[taskId]: !(current[taskId] ?? false),
		}))
	}

	function renderColumnTask(task: BoardTask, status: TaskStatus) {
		const taskAssignees = members.filter((member) => task.assigneeIds.includes(member.id))
		const taskTags = tags.filter((tag) => task.tagIds.includes(tag.id))
		const hiddenAssigneeCount = Math.max(taskAssignees.length - 3, 0)
		const priorityStrength = getPriorityStrength(task.priorityFlow)
		const hasDescription = Boolean(task.description?.trim())
		const dueDateLabel = formatOptionalDueDate(task.dueDate)
		const dueIndicator = getDueIndicatorInfo(task.dueDate, task.status)
		const shouldMoveAssigneesToDueSlot = !dueDateLabel && taskAssignees.length > 0
		const isDescriptionExpanded = expandedDescriptionByTask[task.id] ?? false

		return (
			<article
				key={task.id}
				className={`board-column__task${activeDrag?.taskId === task.id ? ' board-column__task--dragging' : ''}`}
				draggable
				onDragStart={() => onDragStart(task.id, status)}
				onDragEnd={onDragEnd}
				onTouchStart={(event) => {
					const touch = event.touches[0]
					if (!touch) {
						return
					}

					onTouchDragStart(task.id, status, { clientX: touch.clientX, clientY: touch.clientY })
				}}
				onTouchMove={(event) => {
					const touch = event.touches[0]
					if (!touch) {
						return
					}

					const isDraggingByTouch = onTouchDragMove({ clientX: touch.clientX, clientY: touch.clientY })
					if (isDraggingByTouch) {
						event.preventDefault()
					}
				}}
				onTouchEnd={(event) => {
					const touch = event.changedTouches[0]
					if (!touch) {
						return
					}

					const isDraggingByTouch = onTouchDragEnd({ clientX: touch.clientX, clientY: touch.clientY })
					if (isDraggingByTouch) {
						event.preventDefault()
					}
				}}
				onTouchCancel={onTouchDragCancel}
				onClick={() => onOpenTaskDetail(task.id)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault()
						onOpenTaskDetail(task.id)
					}
				}}
				tabIndex={0}
				role="button"
			>
				<div className="board-column__task-head">
					<h3 className="board-column__task-title">{task.title}</h3>
					<div className="board-column__task-action-group">
						{hasDescription ? (
							<button
								type="button"
								className={`board-column__description-toggle board-task-icon-button${isDescriptionExpanded ? ' is-expanded' : ''}`}
								onClick={(event) => {
									event.stopPropagation()
									toggleTaskDescription(task.id)
								}}
								data-tooltip={isDescriptionExpanded ? 'Collapse Description' : 'Expand Description'}
								aria-label={isDescriptionExpanded ? 'Collapse description' : 'Expand description'}
							>
								<FiChevronDown aria-hidden="true" />
							</button>
						) : null}
						{renderTaskActions(task, 'board-column__task-actions')}
					</div>
				</div>
				{hasDescription && isDescriptionExpanded ? <p className="board-column__task-description">{task.description}</p> : null}
				<div className="board-column__task-meta">
					<span className="board-row__task-assignees board-column__task-assignees">
						{taskAssignees.length && !shouldMoveAssigneesToDueSlot ? renderAssigneeStack(taskAssignees, hiddenAssigneeCount) : null}
					</span>
					<div className="board-column__task-priority-attendees">
						<span className="board-row__task-priority">
							<PrioritySignal priority={task.priorityFlow} strength={priorityStrength} />
							<span>{getPriorityLabel(task.priorityFlow)}</span>
						</span>
						{dueDateLabel ? (
							<span className="board-column__task-due">
								<span>Due {dueDateLabel}</span>
								{renderDueIndicator(dueIndicator)}
							</span>
						) : null}
						{!dueDateLabel && shouldMoveAssigneesToDueSlot ? (
							<span className="board-row__task-assignees board-column__task-due-assignees">
								{renderAssigneeStack(taskAssignees, hiddenAssigneeCount)}
							</span>
						) : null}
					</div>
				</div>
				{taskTags.length ? <div className="board-column__task-divider" aria-hidden="true" /> : null}
				{taskTags.length ? (
					<div className="board-column__task-foot">
						<span className="board-task-tags">
							{taskTags.map((tag) => (
								<span className={`board-task-tag ${getTagColorClass(tag.name)}`} key={tag.id}>
									{tag.name}
								</span>
							))}
						</span>
					</div>
				) : null}
			</article>
		)
	}

	function renderTaskActions(task: BoardTask, menuClassName?: string) {
		return (
			<div className={menuClassName ?? 'board-row__task-actions'} ref={openMenuTaskId === task.id ? menuRef : null}>
				<button
					type="button"
					className="board-row__task-menu-trigger board-task-icon-button"
					onClick={(event) => {
						event.stopPropagation()
						setOpenMenuTaskId((current) => (current === task.id ? null : task.id))
					}}
					data-tooltip="More Info"
					aria-label="Task actions"
					aria-expanded={openMenuTaskId === task.id}
				>
					<FiMoreVertical aria-hidden="true" />
				</button>
				{openMenuTaskId === task.id ? (
					<div className="board-row__task-menu" role="menu">
						<button
							type="button"
							className="board-row__task-menu-item"
							onClick={(event) => {
								event.stopPropagation()
								setOpenMenuTaskId(null)
								onEditTask(task)
							}}
						>
							Edit Task
						</button>
						<button
							type="button"
							className="board-row__task-menu-item board-row__task-menu-item--danger"
							onClick={(event) => {
								event.stopPropagation()
								setOpenMenuTaskId(null)
								onDeleteTask(task.id)
							}}
						>
							Delete Task
						</button>
					</div>
				) : null}
			</div>
		)
	}

	return (
		<div className="board__columns">
			{columns.map((column) => {
				const columnTasks = getTasksForStatus(column.status)
				const isDropTarget = hoveredStatus === column.status && activeDrag?.fromStatus !== column.status

				return (
					<section className={`board-column${isDropTarget ? ' board-column--drop-target' : ''}`} data-status={column.status} key={column.status}>
						<header className="board-column__header">
							<div className="board-column__title-wrap">
								<h2 className="board-column__title">{column.title}</h2>
								<span className="board-column__count">{columnTasks.length}</span>
							</div>
							<button type="button" className="board-row__create" onClick={() => onCreateTask(column.status)}>
								+ Create
							</button>
						</header>

						<div
							className="board-column__body"
							data-drop-status={column.status}
							onDragOver={(event) => {
								event.preventDefault()
								if (activeDrag?.fromStatus === column.status) {
									onSetHoveredStatus(null)
									return
								}

								if (activeDrag) {
									onSetHoveredStatus(column.status)
								}
							}}
							onDragLeave={() => {
								if (hoveredStatus === column.status) {
									onSetHoveredStatus(null)
								}
							}}
							onDrop={(event) => {
								event.preventDefault()
								onDrop(column.status)
							}}
						>
							{columnTasks.map((task) => renderColumnTask(task, column.status))}
							{columnTasks.length === 0 ? <p className="board-row__empty">No tasks in this column yet.</p> : null}
						</div>
					</section>
				)
			})}
		</div>
	)
}
