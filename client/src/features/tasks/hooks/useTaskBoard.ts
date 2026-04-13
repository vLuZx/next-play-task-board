import { useEffect, useMemo, useState } from 'react'
import {
	createTag,
	createTask,
	createTaskComment,
	deleteTag,
	deleteTask,
	getTags,
	getTaskActivity,
	getTaskComments,
	getTasks,
	logTaskActivity,
	updateTask,
	updateTaskStatus,
} from '@/features/tasks/api/tasks'
import { getOrCreateCurrentUser } from '@/lib/supabase/auth'
import type {
	BoardColumnDefinition,
	BoardTask,
	TaskActivityEventType,
	PriorityFlow,
	TaskActivity,
	TaskStatus,
	TaskTag,
} from '@/types/task'

export const boardColumns: BoardColumnDefinition[] = [
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

export type TaskModalMode = 'create' | 'edit'

export type TaskFormState = {
	title: string
	description: string
	status: TaskStatus
	priorityFlow: PriorityFlow
	dueDate: string
	assigneeIds: string[]
	tagIds: string[]
}

type TaskBoardSummary = {
	total: number
	completed: number
	overdue: number
}

const initialFormState: TaskFormState = {
	title: '',
	description: '',
	status: 'todo',
	priorityFlow: 'normal',
	dueDate: '',
	assigneeIds: [],
	tagIds: [],
}

const priorityOrder: Record<PriorityFlow, number> = {
	high: 0,
	normal: 1,
	low: 2,
}

function sortColumnByPriority(tasks: BoardTask[], status: TaskStatus) {
	const columnIndexes: number[] = []

	tasks.forEach((task, index) => {
		if (task.status === status) {
			columnIndexes.push(index)
		}
	})

	const sortedColumnTasks = columnIndexes
		.map((index) => tasks[index])
		.sort((leftTask, rightTask) => {
			return priorityOrder[leftTask.priorityFlow] - priorityOrder[rightTask.priorityFlow]
		})

	const nextTasks = [...tasks]
	columnIndexes.forEach((columnIndex, indexInColumn) => {
		nextTasks[columnIndex] = sortedColumnTasks[indexInColumn]
	})

	return nextTasks
}

function toErrorMessage(error: unknown, fallbackMessage: string) {
	if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
		return error.message
	}

	return fallbackMessage
}

function parseDateOnly(dueDate: string) {
	const dateOnlyMatch = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (dateOnlyMatch) {
		const [, year, month, day] = dateOnlyMatch
		return new Date(Number(year), Number(month) - 1, Number(day))
	}

	return new Date(dueDate)
}

function isOverdue(dueDate?: string | null) {
	if (!dueDate) return false
	const due = parseDateOnly(dueDate)
	if (Number.isNaN(due.getTime())) return false

	const today = new Date()
	const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
	const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
	return dueUtc < todayUtc
}

function areStringArraysEqual(left: string[], right: string[]) {
	if (left.length !== right.length) return false
	const leftSorted = [...left].sort()
	const rightSorted = [...right].sort()
	return leftSorted.every((item, index) => item === rightSorted[index])
}

export function useTaskBoard() {
	const [tasks, setTasks] = useState<BoardTask[]>([])
	const [tags, setTags] = useState<TaskTag[]>([])
	const [userId, setUserId] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
	const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>('create')
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
	const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [formState, setFormState] = useState<TaskFormState>(initialFormState)
	const [searchQuery, setSearchQuery] = useState('')
	const [priorityFilter, setPriorityFilter] = useState<PriorityFlow[]>([])
	const [assigneeFilter, setAssigneeFilter] = useState<string[]>([])
	const [labelFilter, setLabelFilter] = useState<string[]>([])
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
	const [commentsByTask, setCommentsByTask] = useState<Record<string, Awaited<ReturnType<typeof getTaskComments>>>>({})
	const [activityByTask, setActivityByTask] = useState<Record<string, TaskActivity[]>>({})
	const [isDetailLoading, setIsDetailLoading] = useState(false)
	const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)

	const statusMessage = isLoading ? 'Loading tasks...' : errorMessage

	useEffect(() => {
		let isMounted = true

		async function loadBoard() {
			setIsLoading(true)
			setErrorMessage(null)

			try {
				const currentUser = await getOrCreateCurrentUser()
				const [loadedTasks, loadedTags] = await Promise.all([getTasks(), getTags()])

				if (!isMounted) {
					return
				}

				setUserId(currentUser.id)
				setTasks(loadedTasks)
				setTags(loadedTags)
			} catch (error) {
				if (!isMounted) {
					return
				}

				setErrorMessage(toErrorMessage(error, 'Unable to load tasks.'))
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		void loadBoard()

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
				setIsTaskModalOpen(false)
			}
		}

		window.addEventListener('keydown', handleEscapeKey)

		return () => {
			window.removeEventListener('keydown', handleEscapeKey)
		}
	}, [isTaskModalOpen])

	const filteredTasks = useMemo(() => {
		const normalizedSearch = searchQuery.trim().toLowerCase()

		return tasks.filter((task) => {
			if (normalizedSearch && !task.title.toLowerCase().includes(normalizedSearch)) {
				return false
			}

			if (priorityFilter.length > 0 && !priorityFilter.includes(task.priorityFlow)) {
				return false
			}

			if (assigneeFilter.length > 0 && !assigneeFilter.some((id) => task.assigneeIds.includes(id))) {
				return false
			}

			if (labelFilter.length > 0 && !labelFilter.some((id) => task.tagIds.includes(id))) {
				return false
			}

			return true
		})
	}, [tasks, searchQuery, priorityFilter, assigneeFilter, labelFilter])

	const summary: TaskBoardSummary = useMemo(() => {
		const completed = tasks.filter((task) => task.status === 'done').length
		const overdue = tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate)).length

		return {
			total: tasks.length,
			completed,
			overdue,
		}
	}, [tasks])

	const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null
	const deletingTask = deletingTaskId ? tasks.find((task) => task.id === deletingTaskId) ?? null : null
	const taskComments = selectedTaskId ? commentsByTask[selectedTaskId] ?? [] : []
	const taskActivity = selectedTaskId ? activityByTask[selectedTaskId] ?? [] : []

	async function refreshTaskActivity(taskId: string) {
		try {
			const activity = await getTaskActivity(taskId)
			setActivityByTask((current) => ({ ...current, [taskId]: activity }))
		} catch {
			// Keep existing activity state if refresh fails; users still retain prior timeline view.
		}
	}

	async function logAndRefreshActivity(input: {
		taskId: string
		oldStatus: TaskStatus
		newStatus: TaskStatus
		eventType: TaskActivityEventType
	}) {
		await logTaskActivity(input)
		await refreshTaskActivity(input.taskId)
	}

	function handleFieldChange(field: 'title' | 'description' | 'dueDate', value: string) {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}))
	}

	function handleStatusChange(status: TaskStatus) {
		setFormState((currentState) => ({
			...currentState,
			status,
		}))
	}

	function handlePriorityChange(priorityFlow: PriorityFlow) {
		setFormState((currentState) => ({
			...currentState,
			priorityFlow,
		}))
	}

	function handleAssigneesChange(assigneeIds: string[]) {
		setFormState((currentState) => ({
			...currentState,
			assigneeIds,
		}))
	}

	function handleTagSelectionChange(tagIds: string[]) {
		setFormState((currentState) => ({
			...currentState,
			tagIds,
		}))
	}

	function openCreateModal(initialStatus: TaskStatus = 'todo') {
		setErrorMessage(null)
		setTaskModalMode('create')
		setEditingTaskId(null)
		setFormState({
			...initialFormState,
			status: initialStatus,
		})
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
			assigneeIds: [...task.assigneeIds],
			tagIds: [...task.tagIds],
		})
		setIsTaskModalOpen(true)
	}

	function closeTaskModal() {
		if (!isSubmitting) {
			setIsTaskModalOpen(false)
		}
	}

	async function submitTask() {
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
				assigneeIds: formState.assigneeIds,
				tagIds: formState.tagIds,
			}

			if (taskModalMode === 'edit' && editingTaskId) {
				const previousTask = tasks.find((task) => task.id === editingTaskId)
				const updatedTask = await updateTask(editingTaskId, taskInput)

				setTasks((currentTasks) => {
					const updatedTasks = currentTasks.map((task) =>
						task.id === editingTaskId ? updatedTask : task,
					)

					if (!previousTask || previousTask.priorityFlow === updatedTask.priorityFlow) {
						return updatedTasks
					}

					return sortColumnByPriority(updatedTasks, updatedTask.status)
				})

				if (previousTask && previousTask.status !== updatedTask.status) {
					await logAndRefreshActivity({
						taskId: updatedTask.id,
						oldStatus: previousTask.status,
						newStatus: updatedTask.status,
						eventType: 'status_change',
					})
				}

				if (previousTask) {
					const hasContentChanges =
						previousTask.title !== updatedTask.title ||
						(previousTask.description ?? '') !== (updatedTask.description ?? '') ||
						(previousTask.dueDate ?? '') !== (updatedTask.dueDate ?? '') ||
						previousTask.priorityFlow !== updatedTask.priorityFlow ||
						!areStringArraysEqual(previousTask.tagIds, updatedTask.tagIds)

					if (hasContentChanges) {
						await logAndRefreshActivity({
							taskId: updatedTask.id,
							oldStatus: updatedTask.status,
							newStatus: updatedTask.status,
							eventType: 'task_edited',
						})
					}

					if (!areStringArraysEqual(previousTask.assigneeIds, updatedTask.assigneeIds)) {
						await logAndRefreshActivity({
							taskId: updatedTask.id,
							oldStatus: updatedTask.status,
							newStatus: updatedTask.status,
							eventType: 'assignees_updated',
						})
					}
				}
			} else {
				const createdTask = await createTask({ ...taskInput, userId })
				setTasks((currentTasks) => [createdTask, ...currentTasks])
			}

			setFormState(initialFormState)
			setEditingTaskId(null)
			setIsTaskModalOpen(false)
		} catch (error) {
			setErrorMessage(toErrorMessage(error, `Unable to ${taskModalMode} the task.`))
		} finally {
			setIsSubmitting(false)
		}
	}

	function requestDeleteTask(taskId: string) {
		setDeletingTaskId(taskId)
	}

	function cancelDeleteTask() {
		if (!isSubmitting) {
			setDeletingTaskId(null)
		}
	}

	async function confirmDeleteTask() {
		if (!deletingTaskId) {
			return
		}

		const taskId = deletingTaskId
		const previousTasks = tasks
		setErrorMessage(null)
		setDeletingTaskId(null)
		setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))

		try {
			await deleteTask(taskId)
		} catch (error) {
			setTasks(previousTasks)
			setErrorMessage(toErrorMessage(error, 'Unable to delete the task.'))
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

			await logAndRefreshActivity({
				taskId,
				oldStatus: currentTask.status,
				newStatus: nextStatus,
				eventType: 'status_change',
			})
		} catch (error) {
			setTasks((currentTasks) =>
				currentTasks.map((task) => (task.id === taskId ? currentTask : task)),
			)
			setErrorMessage(toErrorMessage(error, 'Unable to update the task status.'))
		}
	}

	async function createNewTag(name: string) {
		if (!userId || !name.trim()) return null

		try {
			const createdTag = await createTag({
				name: name.trim(),
				userId,
			})
			setTags((currentTags) => [...currentTags, createdTag].sort((a, b) => a.name.localeCompare(b.name)))
			return createdTag
		} catch (error) {
			setErrorMessage(toErrorMessage(error, 'Unable to create tag.'))
			return null
		}
	}

	async function deleteExistingTag(tagId: string) {
		setErrorMessage(null)

		try {
			await deleteTag(tagId)
			setTags((currentTags) => currentTags.filter((tag) => tag.id !== tagId))
			setTasks((currentTasks) =>
				currentTasks.map((task) => ({
					...task,
					tagIds: task.tagIds.filter((id) => id !== tagId),
				})),
			)
			setFormState((currentState) => ({
				...currentState,
				tagIds: currentState.tagIds.filter((id) => id !== tagId),
			}))
		} catch (error) {
			setErrorMessage(toErrorMessage(error, 'Unable to delete tag.'))
		}
	}

	function closeTaskDetail() {
		setSelectedTaskId(null)
	}

	async function openTaskDetail(taskId: string) {
		setSelectedTaskId(taskId)

		setIsDetailLoading(true)
		setErrorMessage(null)
		try {
			const [comments, activity] = await Promise.all([getTaskComments(taskId), getTaskActivity(taskId)])
			setCommentsByTask((current) => ({ ...current, [taskId]: comments }))
			setActivityByTask((current) => ({ ...current, [taskId]: activity }))
		} catch (error) {
			setErrorMessage(toErrorMessage(error, 'Unable to load task details.'))
		} finally {
			setIsDetailLoading(false)
		}
	}

	async function addComment(message: string) {
		if (!selectedTaskId || !userId || !message.trim()) {
			return
		}

		setIsCommentSubmitting(true)
		setErrorMessage(null)

		try {
			const comment = await createTaskComment(selectedTaskId, message.trim(), userId)
			setCommentsByTask((current) => ({
				...current,
				[selectedTaskId]: [...(current[selectedTaskId] ?? []), comment],
			}))
		} catch (error) {
			setErrorMessage(toErrorMessage(error, 'Unable to post your comment.'))
		} finally {
			setIsCommentSubmitting(false)
		}
	}

	return {
		columns: boardColumns,
		tasks,
		filteredTasks,
		tags,
		userId,
		isLoading,
		isSubmitting,
		isDetailLoading,
		isCommentSubmitting,
		statusMessage,
		errorMessage,
		summary,
		searchQuery,
		priorityFilter,
		assigneeFilter,
		labelFilter,
		isTaskModalOpen,
		taskModalMode,
		formState,
		selectedTask,
		deletingTask,
		taskComments,
		taskActivity,
		handleFieldChange,
		handleStatusChange,
		handlePriorityChange,
		handleAssigneesChange,
		handleTagSelectionChange,
		setSearchQuery,
		setPriorityFilter,
		setAssigneeFilter,
		setLabelFilter,
		openCreateModal,
		openEditModal,
		closeTaskModal,
		submitTask,
		requestDeleteTask,
		cancelDeleteTask,
		confirmDeleteTask,
		handleMoveTask,
		createNewTag,
		deleteExistingTag,
		openTaskDetail,
		closeTaskDetail,
		addComment,
	}
}
