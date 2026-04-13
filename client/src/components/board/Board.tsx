import './Board.css'
import { useState } from 'react'
import { BoardColumn } from '@/components/board-column/BoardColumn'
import type { BoardColumnDefinition, BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'

const priorityRank = {
	high: 0,
	normal: 1,
	low: 2,
} as const

type BoardProps = {
	columns: BoardColumnDefinition[]
	tasks: BoardTask[]
	members: TeamMember[]
	tags: TaskTag[]
	onMoveTask: (taskId: string, nextStatus: TaskStatus) => Promise<void> | void
	onEditTask: (task: BoardTask) => void
	onDeleteTask: (taskId: string) => void
	onOpenTaskDetail: (taskId: string) => void
	onCreateTask: (status: TaskStatus) => void
}

type ActiveDragState = {
	taskId: string
	fromStatus: TaskStatus
}

export function Board({ columns, tasks, members, tags, onMoveTask, onEditTask, onDeleteTask, onOpenTaskDetail, onCreateTask }: BoardProps) {
	const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
	const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null)
	const tasksByColumn = columns.map((column) => {
		return tasks
			.filter((task) => task.status === column.status)
			.sort((leftTask, rightTask) => {
				return priorityRank[leftTask.priorityFlow] - priorityRank[rightTask.priorityFlow]
			})
	})
	const maxTaskCount = tasksByColumn.reduce((largestCount, currentTasks) => {
		return Math.max(largestCount, currentTasks.length)
	}, 0)
	const columnTargetCount = Math.max(maxTaskCount, 1)
	const cardHeight = 150
	const cardGap = 14
	const contentMinHeight = columnTargetCount * cardHeight + (columnTargetCount - 1) * cardGap

	function handleDrop(nextStatus: TaskStatus) {
		if (!activeDrag || activeDrag.fromStatus === nextStatus) {
			setHoveredStatus(null)
			return
		}

		void onMoveTask(activeDrag.taskId, nextStatus)
		setActiveDrag(null)
		setHoveredStatus(null)
	}

	return (
		<section className="board" aria-label="Kanban board">
			<div className="board__grid">
				{columns.map((column, index) => {
					const columnTasks = tasksByColumn[index]
					const isDropTarget = hoveredStatus === column.status && activeDrag?.fromStatus !== column.status

					return (
						<BoardColumn
							key={column.status}
							status={column.status}
							title={column.title}
							tasks={columnTasks}
							members={members}
							tags={tags}
							isDropTarget={isDropTarget}
							draggedTaskId={activeDrag?.taskId ?? null}
							contentMinHeight={contentMinHeight}
							onEditTask={onEditTask}
							onDeleteTask={onDeleteTask}
							onOpenTaskDetail={onOpenTaskDetail}
							onCreateTask={onCreateTask}
							onTaskDragStart={(taskId) => {
								setActiveDrag({ taskId, fromStatus: column.status })
							}}
							onTaskDragEnd={() => {
								setActiveDrag(null)
								setHoveredStatus(null)
							}}
							onColumnDragOver={() => {
								if (activeDrag?.fromStatus === column.status) {
									setHoveredStatus(null)
									return
								}

								if (activeDrag) {
									setHoveredStatus(column.status)
								}
							}}
							onColumnDragLeave={() => {
								if (hoveredStatus === column.status) {
									setHoveredStatus(null)
								}
							}}
							onColumnDrop={() => {
								handleDrop(column.status)
							}}
						/>
					)
				})}
			</div>
		</section>
	)
}