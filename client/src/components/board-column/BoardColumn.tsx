import { useState } from 'react'
import './BoardColumn.css'
import { TaskCard } from '@/components/task-card/TaskCard'
import type { BoardTask, TaskStatus, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'

type BoardColumnProps = {
	status: TaskStatus
	title: string
	tasks: BoardTask[]
	members: TeamMember[]
	tags: TaskTag[]
	isDropTarget: boolean
	draggedTaskId: string | null
	contentMinHeight: number
	onEditTask: (task: BoardTask) => void
	onDeleteTask: (taskId: string) => void
	onOpenTaskDetail: (taskId: string) => void
	onCreateTask: (status: TaskStatus) => void
	onTaskDragStart: (taskId: string) => void
	onTaskDragEnd: () => void
	onColumnDragOver: () => void
	onColumnDragLeave: () => void
	onColumnDrop: () => void
}

export function BoardColumn({
	status,
	title,
	tasks,
	members,
	tags,
	isDropTarget,
	draggedTaskId,
	contentMinHeight,
	onEditTask,
	onDeleteTask,
	onOpenTaskDetail,
	onCreateTask,
	onTaskDragStart,
	onTaskDragEnd,
	onColumnDragOver,
	onColumnDragLeave,
	onColumnDrop,
}: BoardColumnProps) {
	const [isHovering, setIsHovering] = useState(false)
	const isTodoColumn = status === 'todo'
	const showCreateButton = isTodoColumn || isHovering
	return (
		<section
			className={`board-column${isDropTarget ? ' board-column--drop-target' : ''}`}
			aria-label={title}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
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
				</div>
				<span className="board-column__count" aria-label={`${tasks.length} tasks`}>
					{tasks.length}
				</span>
			</header>

			<div className="board-column__content" style={{ minHeight: `${contentMinHeight}px` }}>
				<div className="board-column__list">
					{tasks.map((task) => (
						
						<TaskCard
							key={task.id}
							task={task}
							assignees={members.filter((member) => task.assigneeIds.includes(member.id))}
							tags={tags.filter((tag) => task.tagIds.includes(tag.id))}
							isDragging={draggedTaskId === task.id}
							onEdit={() => onEditTask(task)}
							onDelete={() => onDeleteTask(task.id)}
							onOpenDetails={() => onOpenTaskDetail(task.id)}
							onDragStart={() => onTaskDragStart(task.id)}
							onDragEnd={onTaskDragEnd}
						/>
					))}
					{showCreateButton && (
						<button
							type="button"
							className="board-column__create"
							onClick={() => onCreateTask(status)}
						>
							+ Create
						</button>
					)}
				</div>
			</div>
		</section>
	)
}