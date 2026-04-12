import { supabase } from '@/lib/supabase/client'
import type { BoardTask, CreateTaskInput, PriorityFlow, TaskStatus, UpdateTaskInput } from '@/types/task'

const taskSelect = 'id, title, status, user_id, created_at, description, priority_flow, due_date, assignee_id'

type TaskRow = {
	id: string
	title: string
	status: string
	user_id: string
	created_at: string
	description: string | null
	priority_flow: string | null
	due_date: string | null
	assignee_id: string | null
}

function isTaskStatus(value: string): value is TaskStatus {
	return value === 'todo' || value === 'in_progress' || value === 'in_review' || value === 'done'
}

function isPriorityFlow(value: string): value is PriorityFlow {
	return value === 'low' || value === 'normal' || value === 'high'
}

function mapTask(row: TaskRow): BoardTask {
	return {
		id: row.id,
		title: row.title,
		status: isTaskStatus(row.status) ? row.status : 'todo',
		userId: row.user_id,
		createdAt: row.created_at,
		description: row.description,
		priorityFlow: row.priority_flow && isPriorityFlow(row.priority_flow) ? row.priority_flow : 'normal',
		dueDate: row.due_date,
		assigneeId: row.assignee_id,
	}
}

export async function getTasks() {
	const { data, error } = await supabase
		.from('tasks')
		.select(taskSelect)
		.order('created_at', { ascending: false })

	if (error) throw error
	return (data ?? []).map((task) => mapTask(task as TaskRow))
}

export async function createTask(input: CreateTaskInput) {
	const { data, error } = await supabase
		.from('tasks')
		.insert({
			title: input.title,
			description: input.description ?? null,
			status: input.status,
			priority_flow: input.priorityFlow,
			user_id: input.userId,
			due_date: input.dueDate ?? null,
			assignee_id: input.assigneeId ?? null,
		})
		.select(taskSelect)
		.single()

	if (error) throw error
	return mapTask(data as TaskRow)
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
	const { data, error } = await supabase
		.from('tasks')
		.update({
			title: input.title,
			description: input.description ?? null,
			status: input.status,
			priority_flow: input.priorityFlow,
			due_date: input.dueDate ?? null,
			assignee_id: input.assigneeId ?? null,
		})
		.eq('id', taskId)
		.select(taskSelect)
		.single()

	if (error) throw error
	return mapTask(data as TaskRow)
}

export async function deleteTask(taskId: string) {
	const { error } = await supabase.from('tasks').delete().eq('id', taskId)

	if (error) throw error
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
	const { data, error } = await supabase
		.from('tasks')
		.update({ status })
		.eq('id', taskId)
		.select(taskSelect)
		.single()

	if (error) throw error
	return mapTask(data as TaskRow)
}