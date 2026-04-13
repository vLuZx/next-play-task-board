import './BoardRow.css'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiChevronRight, FiMoreVertical } from 'react-icons/fi'
import { Avatar } from '@/components/avatar/Avatar'
import { PrioritySignal } from '@/components/priority-signal/PrioritySignal'
import type { BoardColumnDefinition, BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'
import { formatDueDate, getDueIndicatorInfo, getPriorityLabel, getPriorityStrength, getTagColorClass } from '@/components/board/boardTaskUtils'

type ActiveDragState = {
	taskId: string
	fromStatus: TaskStatus
}

type TouchPoint = {
	clientX: number
	clientY: number
}

const defaultCollapsed: Record<TaskStatus, boolean> = {
	todo: false,
	in_progress: false,
	in_review: false,
	done: false,
}

type BoardRowProps = {
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

export function BoardRow({
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
}: Readonly<BoardRowProps>) {
	const [collapsedByStatus, setCollapsedByStatus] = useState<Record<TaskStatus, boolean>>(defaultCollapsed)
	const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null)
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

	function renderTaskActions(task: BoardTask) {
		return (
			<div className="board-row__task-actions" ref={openMenuTaskId === task.id ? menuRef : null}>
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
		<div className="board__rows">
			{columns.map((column) => {
				const rowTasks = getTasksForStatus(column.status)
				const isDropTarget = hoveredStatus === column.status && activeDrag?.fromStatus !== column.status
				const isCollapsed = collapsedByStatus[column.status]

				return (
					<section className={`board-row${isDropTarget ? ' board-row--drop-target' : ''}`} data-status={column.status} key={column.status}>
						<header className="board-row__header">
							<button
								type="button"
								className="board-row__collapse"
								onClick={() => {
									setCollapsedByStatus((current) => ({
										...current,
										[column.status]: !current[column.status],
									}))
								}}
								aria-expanded={!isCollapsed}
								aria-controls={`board-row-${column.status}`}
							>
								{isCollapsed ? <FiChevronRight aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
								<span>{column.title}</span>
								<span className="board-row__count">{rowTasks.length}</span>
							</button>
							<div className="board-row__header-actions">
								<button type="button" className="board-row__create" onClick={() => onCreateTask(column.status)}>
									+ Create
								</button>
							</div>
						</header>

						{isCollapsed ? null : (
							<div
								id={`board-row-${column.status}`}
								className="board-row__body"
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
								<div className="board-row__table-header">
									<span>Task Name</span>
									<span>Description</span>
									<span>Assigned To</span>
									<span>Due Date</span>
									<span>Priority</span>
									<span>Tags</span>
									<span aria-hidden="true" />
								</div>

								<div className="board-row__table-body">
									{rowTasks.map((task) => {
										const taskAssignees = members.filter((member) => task.assigneeIds.includes(member.id))
										const taskTags = tags.filter((tag) => task.tagIds.includes(tag.id))
										const priorityStrength = getPriorityStrength(task.priorityFlow)
										const hiddenAssigneeCount = Math.max(taskAssignees.length - 3, 0)
										const dueIndicator = getDueIndicatorInfo(task.dueDate, task.status)
										const dueDateLabel = formatDueDate(task.dueDate)
										const shouldMoveAssigneesToDueSlot = dueDateLabel === 'No due date' && taskAssignees.length > 0

										return (
											<div
												key={task.id}
												className={`board-row__task${activeDrag?.taskId === task.id ? ' board-row__task--dragging' : ''}`}
												draggable
												onDragStart={() => onDragStart(task.id, column.status)}
												onDragEnd={onDragEnd}
												onTouchStart={(event) => {
													const touch = event.touches[0]
													if (!touch) {
														return
													}

													onTouchDragStart(task.id, column.status, { clientX: touch.clientX, clientY: touch.clientY })
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
												<span className="board-row__task-title">
													<span className="board-row__task-drag-handle" aria-hidden="true">
														<span className="board-row__task-drag-dot" />
														<span className="board-row__task-drag-dot" />
														<span className="board-row__task-drag-dot" />
														<span className="board-row__task-drag-dot" />
														<span className="board-row__task-drag-dot" />
														<span className="board-row__task-drag-dot" />
													</span>
													<span className="board-row__task-title-text">{task.title}</span>
												</span>
												<span className="board-row__task-description">{task.description?.trim() ?? ''}</span>
												<span className="board-row__task-assignees">
													{taskAssignees.length && !shouldMoveAssigneesToDueSlot ? (
														renderAssigneeStack(taskAssignees, hiddenAssigneeCount)
													) : (
														<span className="board-row__muted">{taskAssignees.length ? '' : 'Unassigned'}</span>
													)}
												</span>
												<span className="board-row__task-due">
													{shouldMoveAssigneesToDueSlot ? (
														<span className="board-row__task-assignees">{renderAssigneeStack(taskAssignees, hiddenAssigneeCount)}</span>
													) : (
														<>
															<span>{dueDateLabel}</span>
															{renderDueIndicator(dueIndicator)}
														</>
													)}
												</span>
												<span className="board-row__task-priority">
													<PrioritySignal priority={task.priorityFlow} strength={priorityStrength} />
													<span>{getPriorityLabel(task.priorityFlow)}</span>
												</span>
												<span className="board-task-tags">
													{taskTags.map((tag) => (
														<span className={`board-task-tag ${getTagColorClass(tag.name)}`} key={tag.id}>
															{tag.name}
														</span>
													))}
												</span>
												{renderTaskActions(task)}
											</div>
										)
									})}
									{rowTasks.length === 0 ? <p className="board-row__empty">No tasks in this row yet.</p> : null}
								</div>
							</div>
						)}
					</section>
				)
			})}
		</div>
	)
}
