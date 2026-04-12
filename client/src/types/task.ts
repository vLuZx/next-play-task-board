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
	assigneeId?: string | null
}

export type UpdateTaskInput = {
	title: string
	description?: string | null
	status: TaskStatus
	priorityFlow: PriorityFlow
	dueDate?: string | null
	assigneeId?: string | null
}