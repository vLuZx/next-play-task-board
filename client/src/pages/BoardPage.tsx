import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Board } from '@/components/board/Board'
import { createTask, deleteTask, getTasks, updateTask, updateTaskStatus } from '@/features/tasks/api/tasks'
import { getOrCreateCurrentUser } from '@/lib/supabase/auth'
import { priorityFlows, type BoardColumnDefinition, type BoardTask, type PriorityFlow, type TaskStatus } from '@/types/task'

const columns: BoardColumnDefinition[] = [
	{
		status: 'todo',
		title: 'To Do',
		description: 'Tasks queued up and ready to start.',
	},
	{
		status: 'in_progress',
		title: 'In Progress',
		description: 'Active work currently being tackled.',
	},
	{
		status: 'in_review',
		title: 'In Review',
		description: 'Work awaiting validation or feedback.',
	},
	{
		status: 'done',
		title: 'Done',
		description: 'Completed tasks ready to archive later.',
	},
]

const initialFormState: {
	title: string
	description: string
	status: TaskStatus
	priorityFlow: PriorityFlow
	dueDate: string
	assigneeId: string
} = {
	title: '',
	description: '',
	status: 'todo',
	priorityFlow: 'normal',
	dueDate: '',
	assigneeId: '',
}

type TaskModalMode = 'create' | 'edit'

type BoardPageProps = {
	theme: 'light' | 'dark'
	onToggleTheme: () => void
}

export function BoardPage({ theme, onToggleTheme }: BoardPageProps) {
	const [tasks, setTasks] = useState<BoardTask[]>([])
	const [userId, setUserId] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
	const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>('create')
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [formState, setFormState] = useState(initialFormState)
	const statusMessage = isLoading ? 'Loading tasks...' : errorMessage
	const modalTitle = taskModalMode === 'edit' ? 'Edit Task' : 'Create Task'
	const modalSubtitle =
		taskModalMode === 'edit'
			? 'Update the task details and keep the board current.'
			: 'Add a new task directly into one of the board columns.'
	const submitLabel = taskModalMode === 'edit' ? 'Save Changes' : 'Add Task'

	useEffect(() => {
		let isMounted = true

		async function loadBoard() {
			setIsLoading(true)
			setErrorMessage(null)

			try {
				const currentUser = await getOrCreateCurrentUser()
				const loadedTasks = await getTasks()

				if (!isMounted) {
					return
				}

				setUserId(currentUser.id)
				setTasks(loadedTasks)
			} catch (error) {
				if (!isMounted) {
					return
				}

				setErrorMessage(error instanceof Error ? error.message : 'Unable to load tasks.')
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		loadBoard()

		return () => {
			isMounted = false
		}
	}, [])

	useEffect(() => {
		if (!isTaskModalOpen) {
			return
		}

		function handleEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				closeTaskModal()
			}
		}

		window.addEventListener('keydown', handleEscapeKey)

		return () => {
			window.removeEventListener('keydown', handleEscapeKey)
		}
	}, [isTaskModalOpen, isSubmitting])

	function getErrorMessage(error: unknown, fallbackMessage: string) {
		if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
			return error.message
		}

		return fallbackMessage
	}

	function handleFieldChange(
		field: 'title' | 'description' | 'status' | 'priorityFlow' | 'dueDate' | 'assigneeId',
		value: string,
	) {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}))
	}

	function openCreateModal() {
		setErrorMessage(null)
		setTaskModalMode('create')
		setEditingTaskId(null)
		setFormState(initialFormState)
		setIsTaskModalOpen(true)
	}

	function openEditModal(task: BoardTask) {
		setErrorMessage(null)
		setTaskModalMode('edit')
		setEditingTaskId(task.id)
		setFormState({
			title: task.title,
			description: task.description ?? '',
			status: task.status,
			priorityFlow: task.priorityFlow,
			dueDate: task.dueDate ?? '',
			assigneeId: task.assigneeId ?? '',
		})
		setIsTaskModalOpen(true)
	}

	function closeTaskModal() {
		if (!isSubmitting) {
			setIsTaskModalOpen(false)
		}
	}

	async function handleSubmitTask(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		const title = formState.title.trim()

		if (!title || !userId) {
			return
		}

		setIsSubmitting(true)
		setErrorMessage(null)

		try {
			const taskInput = {
				title,
				description: formState.description.trim() || null,
				status: formState.status,
				priorityFlow: formState.priorityFlow,
				dueDate: formState.dueDate || null,
				assigneeId: formState.assigneeId.trim() || null,
			}

			if (taskModalMode === 'edit' && editingTaskId) {
				const updatedTask = await updateTask(editingTaskId, taskInput)

				setTasks((currentTasks) =>
					currentTasks.map((task) => (task.id === editingTaskId ? updatedTask : task)),
				)
			} else {
				const createdTask = await createTask({
					...taskInput,
					userId,
				})

				setTasks((currentTasks) => [createdTask, ...currentTasks])
			}

			setFormState(initialFormState)
			setEditingTaskId(null)
			setIsTaskModalOpen(false)
		} catch (error) {
			setErrorMessage(getErrorMessage(error, `Unable to ${taskModalMode} the task.`))
		} finally {
			setIsSubmitting(false)
		}
	}

	async function handleDeleteTask(taskId: string) {
		if (!window.confirm('Delete this task?')) {
			return
		}

		const previousTasks = tasks
		setErrorMessage(null)
		setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))

		try {
			await deleteTask(taskId)
		} catch (error) {
			setTasks(previousTasks)
			setErrorMessage(getErrorMessage(error, 'Unable to delete the task.'))
		}
	}

	async function handleMoveTask(taskId: string, nextStatus: TaskStatus) {
		const currentTask = tasks.find((task) => task.id === taskId)

		if (!currentTask || currentTask.status === nextStatus) {
			return
		}

		setErrorMessage(null)
		setTasks((currentTasks) =>
			currentTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
		)

		try {
			const updatedTask = await updateTaskStatus(taskId, nextStatus)

			setTasks((currentTasks) =>
				currentTasks.map((task) => (task.id === taskId ? updatedTask : task)),
			)
		} catch (error) {
			setTasks((currentTasks) =>
				currentTasks.map((task) => (task.id === taskId ? currentTask : task)),
			)
			setErrorMessage(getErrorMessage(error, 'Unable to update the task status.'))
		}
	}

	return (
		<main className="board-page">
			<header className="board-page__header">
				<div className="board-page__heading">
					<p className="board-page__eyebrow">Supabase Kanban Board</p>
					<h1 className="board-page__title">Assessment Task Board</h1>
					<p className="board-page__subtitle">
						A static board shell for the required default workflow: To Do, In Progress, In Review,
						and Done.
					</p>
				</div>
				<div className="board-page__actions">
					<button
						type="button"
						className="theme-toggle"
						onClick={onToggleTheme}
						aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					>
						<span className="theme-toggle__label">Theme</span>
						<span className="theme-toggle__value">{theme === 'light' ? 'Light' : 'Dark'}</span>
					</button>
					<button
						type="button"
						className="board-page__action"
						onClick={openCreateModal}
						disabled={!userId || isLoading}
					>
						New Task
					</button>
				</div>
			</header>

			<section className="board-page__meta" aria-label="Board status">
				<div className="board-page__meta-copy">
					<p className="board-page__meta-title">Tasks</p>
					<p className="board-page__meta-subtitle">
						Create a task, then drag it across the required workflow columns.
					</p>
				</div>
				{statusMessage ? (
					<p className={`board-page__message${errorMessage ? ' board-page__message--error' : ''}`}>
						{statusMessage}
					</p>
				) : null}
			</section>

			{isTaskModalOpen ? (
				<div
					className="modal-backdrop"
					onClick={closeTaskModal}
				>
					<div
						className="modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="create-task-title"
						onClick={(event) => {
							event.stopPropagation()
						}}
					>
						<div className="modal__header">
							<div>
								<h2 id="create-task-title" className="modal__title">{modalTitle}</h2>
								<p className="modal__subtitle">{modalSubtitle}</p>
							</div>
							<button
								type="button"
								className="modal__close"
								onClick={closeTaskModal}
								aria-label="Close create task dialog"
							>
								×
							</button>
						</div>

						<form className="task-form task-form--modal" onSubmit={handleSubmitTask}>
							<div className="task-form__main-fields task-form__main-fields--modal">
								<label className="task-form__field">
									<span className="task-form__label">Title</span>
									<input
										type="text"
										className="task-form__input"
										value={formState.title}
										onChange={(event) => handleFieldChange('title', event.target.value)}
										placeholder="Add a task title"
										required
										autoFocus
									/>
								</label>

								<label className="task-form__field task-form__field--wide">
									<span className="task-form__label">Description</span>
									<textarea
										className="task-form__textarea"
										value={formState.description}
										onChange={(event) => handleFieldChange('description', event.target.value)}
										placeholder="Optional details"
										rows={4}
									/>
								</label>

								<label className="task-form__field">
									<span className="task-form__label">Due Date</span>
									<input
										type="date"
										className="task-form__input"
										value={formState.dueDate}
										onChange={(event) => handleFieldChange('dueDate', event.target.value)}
									/>
								</label>

								<label className="task-form__field">
									<span className="task-form__label">Assignee</span>
									<input
										type="text"
										className="task-form__input"
										value={formState.assigneeId}
										onChange={(event) => handleFieldChange('assigneeId', event.target.value)}
										placeholder="Optional assignee id"
									/>
								</label>
							</div>

							<div className="task-form__meta-fields task-form__meta-fields--modal">
								<label className="task-form__field">
									<span className="task-form__label">Status</span>
									<select
										className="task-form__select"
										value={formState.status}
										onChange={(event) => handleFieldChange('status', event.target.value)}
									>
										{columns.map((column) => (
											<option key={column.status} value={column.status}>
												{column.title}
											</option>
										))}
									</select>
								</label>

								<label className="task-form__field">
									<span className="task-form__label">Priority</span>
									<select
										className="task-form__select"
										value={formState.priorityFlow}
										onChange={(event) => handleFieldChange('priorityFlow', event.target.value)}
									>
										{priorityFlows.map((priority) => (
											<option key={priority} value={priority}>
												{priority.charAt(0).toUpperCase() + priority.slice(1)}
											</option>
										))}
									</select>
								</label>

								<div className="task-form__actions">
									<button
										type="button"
										className="task-form__secondary"
										onClick={closeTaskModal}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="task-form__submit"
										disabled={isSubmitting || !userId}
									>
										{isSubmitting ? 'Saving...' : submitLabel}
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			) : null}

			<Board
				columns={columns}
				tasks={tasks}
				onMoveTask={handleMoveTask}
				onEditTask={openEditModal}
				onDeleteTask={handleDeleteTask}
			/>
		</main>
	)
}