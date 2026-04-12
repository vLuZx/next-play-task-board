import './BoardColumn.css'
import { TaskCard } from '@/components/task-card/TaskCard'
import type { BoardTask, TaskStatus } from '@/types/task'

type BoardColumnProps = {
	status: TaskStatus
	title: string
	description: string
	tasks: BoardTask[]
	isDropTarget: boolean
	draggedTaskId: string | null
	onEditTask: (task: BoardTask) => void
	onDeleteTask: (taskId: string) => void
	onTaskDragStart: (taskId: string) => void
	onTaskDragEnd: () => void
	onColumnDragOver: () => void
	onColumnDragLeave: () => void
	onColumnDrop: () => void
}

export function BoardColumn({
	title,
	description,
	tasks,
	isDropTarget,
	draggedTaskId,
	onEditTask,
	onDeleteTask,
	onTaskDragStart,
	onTaskDragEnd,
	onColumnDragOver,
	onColumnDragLeave,
	onColumnDrop,
}: BoardColumnProps) {
	return (
		<section
			className={`board-column${isDropTarget ? ' board-column--drop-target' : ''}`}
			aria-label={title}
			onDragOver={(event) => {
				event.preventDefault()
				onColumnDragOver()
			}}
			onDragLeave={onColumnDragLeave}
			onDrop={(event) => {
				event.preventDefault()
				onColumnDrop()
			}}
		>
			<header className="board-column__header">
				<div className="board-column__heading">
					<h2 className="board-column__title">{title}</h2>
					<p className="board-column__description">{description}</p>
				</div>
				<span className="board-column__count" aria-label={`${tasks.length} tasks`}>
					{tasks.length}
				</span>
			</header>

			<div className="board-column__content">
				{tasks.length > 0 ? (
					<div className="board-column__list">
						{tasks.map((task) => (
						<TaskCard
							key={task.id}
							task={task}
							isDragging={draggedTaskId === task.id}
							onEdit={() => onEditTask(task)}
							onDelete={() => onDeleteTask(task.id)}
							onDragStart={() => onTaskDragStart(task.id)}
							onDragEnd={onTaskDragEnd}
						/>
						))}
					</div>
				) : (
					<div className="board-column__empty-state">
						<p className="board-column__empty-title">No tasks yet</p>
						<p className="board-column__empty-copy">
							This lane is empty in the mock layout and ready for persisted tasks later.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}