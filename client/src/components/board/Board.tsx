import './Board.css'
import { useState } from 'react'
import { BoardColumn } from '@/components/board-column/BoardColumn'
import type { BoardColumnDefinition, BoardTask, TaskStatus } from '@/types/task'

type BoardProps = {
	columns: BoardColumnDefinition[]
	tasks: BoardTask[]
	onMoveTask: (taskId: string, nextStatus: TaskStatus) => Promise<void> | void
	onEditTask: (task: BoardTask) => void
	onDeleteTask: (taskId: string) => void
}

type ActiveDragState = {
	taskId: string
	fromStatus: TaskStatus
}

export function Board({ columns, tasks, onMoveTask, onEditTask, onDeleteTask }: BoardProps) {
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

	return (
		<section className="board" aria-label="Kanban board">
			<div className="board__grid">
				{columns.map((column) => {
					const columnTasks = tasks.filter((task) => task.status === column.status)
					const isDropTarget = hoveredStatus === column.status && activeDrag?.fromStatus !== column.status

					return (
						<BoardColumn
							key={column.status}
							status={column.status}
							title={column.title}
							description={column.description}
							tasks={columnTasks}
							isDropTarget={isDropTarget}
							draggedTaskId={activeDrag?.taskId ?? null}
							onEditTask={onEditTask}
							onDeleteTask={onDeleteTask}
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