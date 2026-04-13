import './Board.css'
import { useState } from 'react'
import { BoardColumn } from '../board-column/BoardColumn'
import { BoardRow } from '../board-row/BoardRow'
import { parseDueDate, priorityRank } from './boardTaskUtils'
import type { BoardColumnDefinition, BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'

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

export function Board({ columns, tasks, members, tags, viewMode, sortMode, onMoveTask, onOpenTaskDetail, onEditTask, onDeleteTask, onCreateTask }: BoardProps) {
	const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
	const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null)

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
					onOpenTaskDetail={onOpenTaskDetail}
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
					onOpenTaskDetail={onOpenTaskDetail}
					onEditTask={onEditTask}
					onDeleteTask={onDeleteTask}
					onCreateTask={onCreateTask}
				/>
			)}
		</section>
	)
}
