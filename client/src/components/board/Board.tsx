import './Board.css'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiChevronRight, FiMoreVertical } from 'react-icons/fi'
import { Avatar } from '@/components/avatar/Avatar'
import type { BoardColumnDefinition, BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'

function getTagColorClass(name: string): string {
	let h = 0
	for (let i = 0; i < name.length; i++) {
		h = (h * 31 + name.charCodeAt(i)) >>> 0
	}
	return `board-row__task-tag--c${h % 10}`
}

const priorityRank = {
	high: 0,
	normal: 1,
	low: 2,
} as const

type BoardSortMode = 'priority' | 'dueDate'

type BoardProps = {
	columns: BoardColumnDefinition[]
	tasks: BoardTask[]
	members: TeamMember[]
	tags: TaskTag[]
	viewMode: 'row' | 'column'
	sortMode: BoardSortMode
	onMoveTask: (taskId: string, nextStatus: TaskStatus) => Promise<void> | void
	onOpenTaskDetail: (taskId: string) => void
	onEditTask: (task: BoardTask) => void
	onDeleteTask: (taskId: string) => void
	onCreateTask: (status: TaskStatus) => void
}

type ActiveDragState = {
	taskId: string
	fromStatus: TaskStatus
}

const defaultCollapsed: Record<TaskStatus, boolean> = {
	todo: false,
	in_progress: false,
	in_review: false,
	done: false,
}

function formatDueDate(value?: string | null) {
	if (!value) {
		return 'No due date'
	}

	const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	const date = dateOnlyMatch
		? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
		: new Date(value)

	if (Number.isNaN(date.getTime())) {
		return 'No due date'
	}

	return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function formatOptionalDueDate(value?: string | null) {
	if (!value) {
		return null
	}

	const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	const date = dateOnlyMatch
		? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
		: new Date(value)

	if (Number.isNaN(date.getTime())) {
		return null
	}

	return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function parseDueDate(value?: string | null) {
	if (!value) {
		return null
	}

	const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	const date = dateOnlyMatch
		? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
		: new Date(value)

	if (Number.isNaN(date.getTime())) {
		return null
	}

	date.setHours(0, 0, 0, 0)
	return date
}

function getDueIndicatorInfo(
	value: string | null | undefined,
	status: TaskStatus,
): { tone: 'warning' | 'danger'; tooltip: string; ariaLabel: string } | null {
	const dueDate = parseDueDate(value)
	if (!dueDate) {
		return null
	}

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const msPerDay = 1000 * 60 * 60 * 24
	const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / msPerDay)

	if (daysUntilDue < 0) {
		if (status === 'done') {
			return null
		}

		return {
			tone: 'danger',
			tooltip: 'Overdue',
			ariaLabel: 'Overdue',
		}
	}

	if (daysUntilDue <= 7) {
		if (daysUntilDue === 0) {
			return {
				tone: 'warning',
				tooltip: 'Due today',
				ariaLabel: 'Due today',
			}
		}

		if (daysUntilDue === 1) {
			return {
				tone: 'warning',
				tooltip: 'Due in 1 day',
				ariaLabel: 'Due tomorrow',
			}
		}

		return {
			tone: 'warning',
			tooltip: `Due in ${daysUntilDue} days`,
			ariaLabel: `Due in ${daysUntilDue} days`,
		}
	}

	return null
}

function getPriorityStrength(priority: BoardTask['priorityFlow']) {
	if (priority === 'low') return 1
	if (priority === 'normal') return 2
	return 3
}

function getPriorityLabel(priority: BoardTask['priorityFlow']) {
	if (priority === 'low') return 'Low'
	if (priority === 'normal') return 'Normal'
	return 'High'
}

export function Board({ columns, tasks, members, tags, viewMode, sortMode, onMoveTask, onOpenTaskDetail, onEditTask, onDeleteTask, onCreateTask }: BoardProps) {
	const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
	const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null)
	const [collapsedByStatus, setCollapsedByStatus] = useState<Record<TaskStatus, boolean>>(defaultCollapsed)
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

		window.addEventListener('pointerdown', handlePointerDown)
		return () => {
			window.removeEventListener('pointerdown', handlePointerDown)
		}
	}, [openMenuTaskId])

	function handleDrop(nextStatus: TaskStatus) {
		if (!activeDrag || activeDrag.fromStatus === nextStatus) {
			setHoveredStatus(null)
			return
		}

		void onMoveTask(activeDrag.taskId, nextStatus)
		setActiveDrag(null)
		setHoveredStatus(null)
	}

	function getTasksForStatus(status: TaskStatus) {
		return tasks
			.filter((task) => task.status === status)
			.sort((leftTask, rightTask) => {
				const leftPriority = priorityRank[leftTask.priorityFlow]
				const rightPriority = priorityRank[rightTask.priorityFlow]
				const leftDue = parseDueDate(leftTask.dueDate)
				const rightDue = parseDueDate(rightTask.dueDate)

				if (sortMode === 'dueDate') {
					if (leftDue && rightDue) {
						const dueComparison = leftDue.getTime() - rightDue.getTime()
						if (dueComparison !== 0) {
							return dueComparison
						}
					}

					if (leftDue && !rightDue) return -1
					if (!leftDue && rightDue) return 1
					return leftPriority - rightPriority
				}

				if (leftPriority !== rightPriority) {
					return leftPriority - rightPriority
				}

				if (leftDue && rightDue) {
					return leftDue.getTime() - rightDue.getTime()
				}

				if (leftDue && !rightDue) return -1
				if (!leftDue && rightDue) return 1
				return 0
			})
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
		<section className="board" aria-label="Task board">
			{viewMode === 'column' ? (
				<div className="board__columns">
					{columns.map((column) => {
						const columnTasks = getTasksForStatus(column.status)
						const isDropTarget = hoveredStatus === column.status && activeDrag?.fromStatus !== column.status

						return (
							<section
								className={`board-column${isDropTarget ? ' board-column--drop-target' : ''}`}
								data-status={column.status}
								key={column.status}
							>
								<header className="board-column__header">
									<div className="board-column__title-wrap">
										<h2 className="board-column__title">{column.title}</h2>
										<span className="board-column__count">{columnTasks.length}</span>
									</div>
									<button
										type="button"
										className="board-row__create"
										onClick={() => onCreateTask(column.status)}
									>
										+ Create
									</button>
								</header>

								<div
									className="board-column__body"
									onDragOver={(event) => {
										event.preventDefault()
										if (activeDrag?.fromStatus === column.status) {
											setHoveredStatus(null)
											return
										}

										if (activeDrag) {
											setHoveredStatus(column.status)
										}
									}}
									onDragLeave={() => {
										if (hoveredStatus === column.status) {
											setHoveredStatus(null)
										}
									}}
									onDrop={(event) => {
										event.preventDefault()
										handleDrop(column.status)
									}}
								>
									{columnTasks.map((task) => {
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
												onDragStart={() => {
													setActiveDrag({ taskId: task.id, fromStatus: column.status })
												}}
												onDragEnd={() => {
													setActiveDrag(null)
													setHoveredStatus(null)
												}}
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
																	setExpandedDescriptionByTask((current) => ({
																		...current,
																		[task.id]: !(current[task.id] ?? false),
																	}))
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
												{hasDescription && isDescriptionExpanded ? (
													<p className="board-column__task-description">{task.description}</p>
												) : null}
												<div className="board-column__task-meta">
													<span className="board-row__task-assignees board-column__task-assignees">
														{taskAssignees.length && !shouldMoveAssigneesToDueSlot ? (
															<>
																{taskAssignees.slice(0, 3).map((member) => (
																	<span className="board-row__task-assignee" key={member.id} title={member.name}>
																		<Avatar name={member.name} src={member.avatarUrl} size={24} />
																	</span>
																))}
																{hiddenAssigneeCount > 0 ? <span className="board-row__task-assignee-more">+{hiddenAssigneeCount}</span> : null}
															</>
														) : null}
													</span>
													<div className="board-column__task-priority-attendees">
														<span className="board-row__task-priority">
															<span className={`priority-signal priority-signal--${task.priorityFlow}`} aria-hidden="true">
																<span className={`priority-signal__bar priority-signal__bar--1${priorityStrength >= 1 ? ' is-active' : ''}`} />
																<span className={`priority-signal__bar priority-signal__bar--2${priorityStrength >= 2 ? ' is-active' : ''}`} />
																<span className={`priority-signal__bar priority-signal__bar--3${priorityStrength >= 3 ? ' is-active' : ''}`} />
															</span>
															<span>{getPriorityLabel(task.priorityFlow)}</span>
														</span>
														{dueDateLabel ? (
															<span className={`board-column__task-due${dueIndicator ? ` board-column__task-due--${dueIndicator.tone}` : ''}`}>
																<span>Due {dueDateLabel}</span>
																{dueIndicator ? (
																	<span
																		className={`board-task-due-indicator board-task-due-indicator--${dueIndicator.tone} board-task-icon-button`}
																		data-tooltip={dueIndicator.tooltip}
																		aria-label={dueIndicator.ariaLabel}
																	>
																		!
																	</span>
																) : null}
															</span>
														) : null}
														{!dueDateLabel && shouldMoveAssigneesToDueSlot ? (
															<span className="board-row__task-assignees board-column__task-due-assignees">
																{taskAssignees.slice(0, 3).map((member) => (
																	<span className="board-row__task-assignee" key={member.id} title={member.name}>
																		<Avatar name={member.name} src={member.avatarUrl} size={24} />
																	</span>
																))}
																{hiddenAssigneeCount > 0 ? <span className="board-row__task-assignee-more">+{hiddenAssigneeCount}</span> : null}
															</span>
														) : null}
													</div>
												</div>
												{taskTags.length ? <div className="board-column__task-divider" aria-hidden="true" /> : null}
												{taskTags.length ? (
													<div className="board-column__task-foot">
														<span className="board-row__task-tags">
															{taskTags.map((tag) => (
																<span className={`board-row__task-tag ${getTagColorClass(tag.name)}`} key={tag.id}>{tag.name}</span>
															))}
														</span>
													</div>
												) : null}
											</article>
										)
									})}
									{!columnTasks.length ? <p className="board-row__empty">No tasks in this column yet.</p> : null}
								</div>
							</section>
						)
					})}
				</div>
			) : (
				<div className="board__rows">
				{columns.map((column) => {
					const rowTasks = getTasksForStatus(column.status)
					const isDropTarget = hoveredStatus === column.status && activeDrag?.fromStatus !== column.status
					const isCollapsed = collapsedByStatus[column.status]

					return (
						<section
							className={`board-row${isDropTarget ? ' board-row--drop-target' : ''}`}
							data-status={column.status}
							key={column.status}
						>
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
									<button
										type="button"
										className="board-row__create"
										onClick={() => onCreateTask(column.status)}
									>
										+ Create
									</button>
								</div>
							</header>

							{!isCollapsed ? (
								<div
									id={`board-row-${column.status}`}
									className="board-row__body"
									onDragOver={(event) => {
										event.preventDefault()
										if (activeDrag?.fromStatus === column.status) {
											setHoveredStatus(null)
											return
										}

										if (activeDrag) {
											setHoveredStatus(column.status)
										}
									}}
									onDragLeave={() => {
										if (hoveredStatus === column.status) {
											setHoveredStatus(null)
										}
									}}
									onDrop={(event) => {
										event.preventDefault()
										handleDrop(column.status)
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
											const dueDateLabel = formatOptionalDueDate(task.dueDate)
											const dueIndicator = getDueIndicatorInfo(task.dueDate, task.status)
											const shouldMoveAssigneesToDueSlot = !dueDateLabel && taskAssignees.length > 0

											return (
												<div
													key={task.id}
													className={`board-row__task${activeDrag?.taskId === task.id ? ' board-row__task--dragging' : ''}`}
													draggable
													onDragStart={() => {
														setActiveDrag({ taskId: task.id, fromStatus: column.status })
													}}
													onDragEnd={() => {
														setActiveDrag(null)
														setHoveredStatus(null)
													}}
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
															<>
																{taskAssignees.slice(0, 3).map((member) => (
																	<span className="board-row__task-assignee" key={member.id} title={member.name}>
																		<Avatar name={member.name} src={member.avatarUrl} size={24} />
																	</span>
																))}
																{hiddenAssigneeCount > 0 ? (
																	<span className="board-row__task-assignee-more">+{hiddenAssigneeCount}</span>
																) : null}
															</>
														) : (
															<span className="board-row__muted">{taskAssignees.length ? '' : 'Unassigned'}</span>
														)}
													</span>
													<span className={`board-row__task-due${dueIndicator ? ` board-row__task-due--${dueIndicator.tone}` : ''}`}>
														{shouldMoveAssigneesToDueSlot ? (
															<span className="board-row__task-assignees">
																{taskAssignees.slice(0, 3).map((member) => (
																	<span className="board-row__task-assignee" key={member.id} title={member.name}>
																		<Avatar name={member.name} src={member.avatarUrl} size={24} />
																	</span>
																))}
																{hiddenAssigneeCount > 0 ? <span className="board-row__task-assignee-more">+{hiddenAssigneeCount}</span> : null}
															</span>
															) : (
																<>
																	<span>{formatDueDate(task.dueDate)}</span>
																	{dueIndicator ? (
																		<span
																			className={`board-task-due-indicator board-task-due-indicator--${dueIndicator.tone} board-task-icon-button`}
																			data-tooltip={dueIndicator.tooltip}
																			aria-label={dueIndicator.ariaLabel}
																		>
																		!
																		</span>
																	) : null}
																</>
															)}
													</span>
													<span className="board-row__task-priority">
														<span className={`priority-signal priority-signal--${task.priorityFlow}`} aria-hidden="true">
															<span className={`priority-signal__bar priority-signal__bar--1${priorityStrength >= 1 ? ' is-active' : ''}`} />
															<span className={`priority-signal__bar priority-signal__bar--2${priorityStrength >= 2 ? ' is-active' : ''}`} />
															<span className={`priority-signal__bar priority-signal__bar--3${priorityStrength >= 3 ? ' is-active' : ''}`} />
														</span>
														<span>{getPriorityLabel(task.priorityFlow)}</span>
													</span>
													<span className="board-row__task-tags">
														{taskTags.map((tag) => (
															<span className={`board-row__task-tag ${getTagColorClass(tag.name)}`} key={tag.id}>{tag.name}</span>
														))}
													</span>
												{renderTaskActions(task)}
												</div>
											)
										})}
										{!rowTasks.length ? <p className="board-row__empty">No tasks in this row yet.</p> : null}
									</div>
								</div>
							) : null}
						</section>
					)
				})}
					</div>
				)}
		</section>
	)
}