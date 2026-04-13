import './Board.css'
import { useRef, useState } from 'react'
import { BoardColumn } from '../board-column/BoardColumn'
import { BoardRow } from '../board-row/BoardRow'
import { parseDueDate, priorityRank } from './boardTaskUtils'
import type { BoardColumnDefinition, BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'

const TOUCH_DRAG_DELAY_MS = 220
const TOUCH_DRAG_CANCEL_DISTANCE_PX = 10

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

type TouchPoint = {
	clientX: number
	clientY: number
}

type PendingTouchDragState = {
	taskId: string
	fromStatus: TaskStatus
	startPoint: TouchPoint
	hasStarted: boolean
	timerId: number | null
}

export function Board({ columns, tasks, members, tags, viewMode, sortMode, onMoveTask, onOpenTaskDetail, onEditTask, onDeleteTask, onCreateTask }: BoardProps) {
	const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
	const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null)
	const pendingTouchDragRef = useRef<PendingTouchDragState | null>(null)
	const suppressedTaskOpenRef = useRef<{ taskId: string | null; expiresAt: number }>({ taskId: null, expiresAt: 0 })

	function clearPendingTouchDrag() {
		const pendingTouchDrag = pendingTouchDragRef.current
		if (pendingTouchDrag?.timerId) {
			globalThis.clearTimeout(pendingTouchDrag.timerId)
		}

		pendingTouchDragRef.current = null
	}

	function findDropStatusAtPoint(point: TouchPoint) {
		const dropTarget = globalThis.document
			.elementFromPoint(point.clientX, point.clientY)
			?.closest<HTMLElement>('[data-drop-status]')

		const nextStatus = dropTarget?.dataset.dropStatus as TaskStatus | undefined
		return nextStatus ?? null
	}

	function beginTouchDrag(taskId: string, fromStatus: TaskStatus, point: TouchPoint) {
		clearPendingTouchDrag()

		const timerId = globalThis.setTimeout(() => {
			setActiveDrag({ taskId, fromStatus })
			pendingTouchDragRef.current = pendingTouchDragRef.current
				? { ...pendingTouchDragRef.current, hasStarted: true, timerId: null }
				: null
		}, TOUCH_DRAG_DELAY_MS)

		pendingTouchDragRef.current = {
			taskId,
			fromStatus,
			startPoint: point,
			hasStarted: false,
			timerId,
		}
	}

	function moveTouchDrag(point: TouchPoint) {
		const pendingTouchDrag = pendingTouchDragRef.current
		if (!pendingTouchDrag) {
			return false
		}

		if (!pendingTouchDrag.hasStarted) {
			const deltaX = point.clientX - pendingTouchDrag.startPoint.clientX
			const deltaY = point.clientY - pendingTouchDrag.startPoint.clientY
			const travelDistance = Math.hypot(deltaX, deltaY)

			if (travelDistance > TOUCH_DRAG_CANCEL_DISTANCE_PX) {
				clearPendingTouchDrag()
			}

			return false
		}

		const nextStatus = findDropStatusAtPoint(point)
		if (!nextStatus || nextStatus === pendingTouchDrag.fromStatus) {
			setHoveredStatus(null)
			return true
		}

		setHoveredStatus(nextStatus)
		return true
	}

	function finishTouchDrag(point: TouchPoint) {
		const pendingTouchDrag = pendingTouchDragRef.current
		if (!pendingTouchDrag) {
			return false
		}

		clearPendingTouchDrag()

		if (!pendingTouchDrag.hasStarted) {
			setActiveDrag(null)
			setHoveredStatus(null)
			return false
		}

		const nextStatus = findDropStatusAtPoint(point)
		if (nextStatus && nextStatus !== pendingTouchDrag.fromStatus) {
			void onMoveTask(pendingTouchDrag.taskId, nextStatus)
		}

		suppressedTaskOpenRef.current = {
			taskId: pendingTouchDrag.taskId,
			expiresAt: Date.now() + 400,
		}
		setActiveDrag(null)
		setHoveredStatus(null)
		return true
	}

	function cancelTouchDrag() {
		clearPendingTouchDrag()
		setActiveDrag(null)
		setHoveredStatus(null)
	}

	function shouldSuppressTaskOpen(taskId: string) {
		const { taskId: suppressedTaskId, expiresAt } = suppressedTaskOpenRef.current
		if (suppressedTaskId === taskId && Date.now() < expiresAt) {
			suppressedTaskOpenRef.current = { taskId: null, expiresAt: 0 }
			return true
		}

		return false
	}

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

	function handleTaskDragStart(taskId: string, fromStatus: TaskStatus) {
		setActiveDrag({ taskId, fromStatus })
	}

	function handleTaskDragEnd() {
		setActiveDrag(null)
		setHoveredStatus(null)
	}

	function handleTaskPress(taskId: string) {
		if (shouldSuppressTaskOpen(taskId)) {
			return
		}

		onOpenTaskDetail(taskId)
	}

	return (
		<section className="board" aria-label="Task board">
			{viewMode === 'column' ? (
				<BoardColumn
					columns={columns}
					members={members}
					tags={tags}
					activeDrag={activeDrag}
					hoveredStatus={hoveredStatus}
					getTasksForStatus={getTasksForStatus}
					onSetHoveredStatus={setHoveredStatus}
					onDrop={handleDrop}
					onDragStart={handleTaskDragStart}
					onDragEnd={handleTaskDragEnd}
					onTouchDragStart={beginTouchDrag}
					onTouchDragMove={moveTouchDrag}
					onTouchDragEnd={finishTouchDrag}
					onTouchDragCancel={cancelTouchDrag}
					onOpenTaskDetail={handleTaskPress}
					onEditTask={onEditTask}
					onDeleteTask={onDeleteTask}
					onCreateTask={onCreateTask}
				/>
			) : (
				<BoardRow
					columns={columns}
					members={members}
					tags={tags}
					activeDrag={activeDrag}
					hoveredStatus={hoveredStatus}
					getTasksForStatus={getTasksForStatus}
					onSetHoveredStatus={setHoveredStatus}
					onDrop={handleDrop}
					onDragStart={handleTaskDragStart}
					onDragEnd={handleTaskDragEnd}
					onTouchDragStart={beginTouchDrag}
					onTouchDragMove={moveTouchDrag}
					onTouchDragEnd={finishTouchDrag}
					onTouchDragCancel={cancelTouchDrag}
					onOpenTaskDetail={handleTaskPress}
					onEditTask={onEditTask}
					onDeleteTask={onDeleteTask}
					onCreateTask={onCreateTask}
				/>
			)}
		</section>
	)
}
