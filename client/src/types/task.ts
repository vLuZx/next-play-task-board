export const boardStatuses = ['todo', 'in_progress', 'in_review', 'done'] as const
export const priorityFlows = ['low', 'normal', 'high'] as const

export type TaskStatus = (typeof boardStatuses)[number]
export type PriorityFlow = (typeof priorityFlows)[number]

export type BoardTask = {
	id: string
	title: string
	status: TaskStatus
	userId: string
	createdAt: string
	description?: string | null
	priorityFlow: PriorityFlow
	dueDate?: string | null
	assigneeId?: string | null
	assigneeIds: string[]
	tagIds: string[]
}

export type TaskComment = {
	id: string
	taskId: string
	message: string
	sentAt: string
	userId: string
}

export type TaskActivityEventType = 'status_change' | 'task_edited' | 'assignees_updated'

export type TaskActivity = {
	id: string
	taskId: string
	oldStatus: TaskStatus
	newStatus: TaskStatus
	timeChanged: string
	eventType: TaskActivityEventType
}

export type TaskTag = {
	id: string
	userId: string
	name: string
}

export type BoardColumnDefinition = {
	status: TaskStatus
	title: string
	description: string
}

export type CreateTaskInput = {
	title: string
	description?: string | null
	status: TaskStatus
	priorityFlow: PriorityFlow
	userId: string
	dueDate?: string | null
	assigneeIds?: string[]
	tagIds?: string[]
}

export type UpdateTaskInput = {
	title: string
	description?: string | null
	status: TaskStatus
	priorityFlow: PriorityFlow
	dueDate?: string | null
	assigneeIds?: string[]
	tagIds?: string[]
}