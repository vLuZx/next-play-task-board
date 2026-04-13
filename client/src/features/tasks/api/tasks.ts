import { supabase } from '@/lib/supabase/client'
import type {
	BoardTask,
	CreateTaskInput,
	PriorityFlow,
	TaskActivity,
	TaskActivityEventType,
	TaskComment,
	TaskStatus,
	TaskTag,
	UpdateTaskInput,
} from '@/types/task'

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

type TaskAssigneeRow = {
	task_id: string
	assignee_id: string
}

type TaskTagRow = {
	task_id: string
	tag_id: string
}

type CommentRow = {
	id: string
	sent_at: string
	message: string
	user_id: string
}

type TaskCommentLinkRow = {
	comment_id: string
}

type ActivityRow = {
	id: string
	task_id: string
	old_status: string
	new_status: string
	time_changed: string
	event_type?: string
}

type TagRow = {
	id: string
	user_id: string
	name: string
}

function isTaskStatus(value: string): value is TaskStatus {
	return value === 'todo' || value === 'in_progress' || value === 'in_review' || value === 'done'
}

function isPriorityFlow(value: string): value is PriorityFlow {
	return value === 'low' || value === 'normal' || value === 'high'
}

function isActivityEventType(value: string): value is TaskActivityEventType {
	return value === 'status_change' || value === 'task_edited' || value === 'assignees_updated'
}

function mapTask(row: TaskRow, assigneeIds: string[], tagIds: string[]): BoardTask {
	return {
		id: row.id,
		title: row.title,
		status: isTaskStatus(row.status) ? row.status : 'todo',
		userId: row.user_id,
		createdAt: row.created_at,
		description: row.description,
		priorityFlow: row.priority_flow && isPriorityFlow(row.priority_flow) ? row.priority_flow : 'normal',
		dueDate: row.due_date,
		assigneeId: assigneeIds[0] ?? row.assignee_id,
		assigneeIds,
		tagIds,
	}
}

function mapTaskTag(row: TagRow): TaskTag {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
	}
}

function mapTaskComment(row: CommentRow, taskId: string): TaskComment {
	return {
		id: row.id,
		taskId,
		message: row.message,
		sentAt: row.sent_at,
		userId: row.user_id,
	}
}

function mapTaskActivity(row: ActivityRow): TaskActivity {
	const oldStatus = isTaskStatus(row.old_status) ? row.old_status : 'todo'
	const newStatus = isTaskStatus(row.new_status) ? row.new_status : oldStatus
	let eventType: TaskActivityEventType = oldStatus !== newStatus ? 'status_change' : 'task_edited'

	if (typeof row.event_type === 'string' && isActivityEventType(row.event_type)) {
		eventType = row.event_type
	}

	return {
		id: row.id,
		taskId: row.task_id,
		oldStatus,
		newStatus,
		timeChanged: row.time_changed,
		eventType,
	}
}

async function getTaskRelations(taskIds: string[]) {
	if (!taskIds.length) {
		return {
			assigneesByTask: new Map<string, string[]>(),
			tagsByTask: new Map<string, string[]>(),
		}
	}

	const [assigneesResult, tagsResult] = await Promise.all([
		supabase.from('task_assignees').select('task_id, assignee_id').in('task_id', taskIds),
		supabase.from('task_tags').select('task_id, tag_id').in('task_id', taskIds),
	])

	if (assigneesResult.error) throw assigneesResult.error
	if (tagsResult.error) throw tagsResult.error

	const assigneesByTask = new Map<string, string[]>()
	const tagsByTask = new Map<string, string[]>()

	;(assigneesResult.data as TaskAssigneeRow[] | null)?.forEach((row) => {
		const current = assigneesByTask.get(row.task_id) ?? []
		current.push(row.assignee_id)
		assigneesByTask.set(row.task_id, current)
	})

	;(tagsResult.data as TaskTagRow[] | null)?.forEach((row) => {
		const current = tagsByTask.get(row.task_id) ?? []
		current.push(row.tag_id)
		tagsByTask.set(row.task_id, current)
	})

	return { assigneesByTask, tagsByTask }
}

async function syncTaskAssignees(taskId: string, assigneeIds: string[]) {
	const { error: deleteError } = await supabase.from('task_assignees').delete().eq('task_id', taskId)
	if (deleteError) throw deleteError

	if (!assigneeIds.length) return

	const payload = assigneeIds.map((assigneeId) => ({ task_id: taskId, assignee_id: assigneeId }))
	const { error: insertError } = await supabase.from('task_assignees').insert(payload)
	if (insertError) throw insertError
}

async function syncTaskTags(taskId: string, tagIds: string[]) {
	const { error: deleteError } = await supabase.from('task_tags').delete().eq('task_id', taskId)
	if (deleteError) throw deleteError

	if (!tagIds.length) return

	const payload = tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId }))
	const { error: insertError } = await supabase.from('task_tags').insert(payload)
	if (insertError) throw insertError
}

async function fetchTaskById(taskId: string) {
	const { data, error } = await supabase.from('tasks').select(taskSelect).eq('id', taskId).single()
	if (error) throw error

	const { assigneesByTask, tagsByTask } = await getTaskRelations([taskId])
	return mapTask(
		data as TaskRow,
		assigneesByTask.get(taskId) ?? [],
		tagsByTask.get(taskId) ?? [],
	)
}

export async function getTasks() {
	const { data, error } = await supabase.from('tasks').select(taskSelect).order('created_at', { ascending: false })
	if (error) throw error

	const taskRows = (data ?? []) as TaskRow[]
	const taskIds = taskRows.map((row) => row.id)
	const { assigneesByTask, tagsByTask } = await getTaskRelations(taskIds)

	return taskRows.map((row) => mapTask(row, assigneesByTask.get(row.id) ?? [], tagsByTask.get(row.id) ?? []))
}

export async function createTask(input: CreateTaskInput) {
	const assigneeIds = input.assigneeIds ?? []
	const tagIds = input.tagIds ?? []

	const { data, error } = await supabase
		.from('tasks')
		.insert({
			title: input.title,
			description: input.description ?? null,
			status: input.status,
			priority_flow: input.priorityFlow,
			user_id: input.userId,
			due_date: input.dueDate ?? null,
			assignee_id: assigneeIds[0] ?? null,
		})
		.select(taskSelect)
		.single()

	if (error) throw error

	const createdTask = data as TaskRow
	await Promise.all([syncTaskAssignees(createdTask.id, assigneeIds), syncTaskTags(createdTask.id, tagIds)])

	return fetchTaskById(createdTask.id)
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
	const assigneeIds = input.assigneeIds ?? []
	const tagIds = input.tagIds ?? []

	const { error } = await supabase
		.from('tasks')
		.update({
			title: input.title,
			description: input.description ?? null,
			status: input.status,
			priority_flow: input.priorityFlow,
			due_date: input.dueDate ?? null,
			assignee_id: assigneeIds[0] ?? null,
		})
		.eq('id', taskId)

	if (error) throw error

	await Promise.all([syncTaskAssignees(taskId, assigneeIds), syncTaskTags(taskId, tagIds)])

	return fetchTaskById(taskId)
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

	const row = data as TaskRow
	const { assigneesByTask, tagsByTask } = await getTaskRelations([taskId])
	return mapTask(row, assigneesByTask.get(taskId) ?? [], tagsByTask.get(taskId) ?? [])
}

export async function getTaskComments(taskId: string) {
	const { data: links, error: linkError } = await supabase
		.from('task_comments')
		.select('comment_id')
		.eq('task_id', taskId)

	if (linkError) throw linkError

	const commentIds = ((links ?? []) as TaskCommentLinkRow[]).map((item) => item.comment_id)
	if (!commentIds.length) return [] as TaskComment[]

	const { data, error } = await supabase
		.from('comments')
		.select('id, sent_at, message, user_id')
		.in('id', commentIds)
		.order('sent_at', { ascending: true })

	if (error) throw error
	return ((data ?? []) as CommentRow[]).map((row) => mapTaskComment(row, taskId))
}

export async function createTaskComment(taskId: string, message: string, userId: string) {
	const { data: commentRow, error: commentError } = await supabase
		.from('comments')
		.insert({
			message,
			user_id: userId,
			sent_at: new Date().toISOString(),
		})
		.select('id, sent_at, message, user_id')
		.single()

	if (commentError) throw commentError

	const { error: linkError } = await supabase
		.from('task_comments')
		.insert({ task_id: taskId, comment_id: (commentRow as CommentRow).id })

	if (linkError) throw linkError

	return mapTaskComment(commentRow as CommentRow, taskId)
}

export async function getTaskActivity(taskId: string) {
	const { data, error } = await supabase
		.from('activity_log')
		.select('*')
		.eq('task_id', taskId)
		.order('time_changed', { ascending: false })

	if (error) throw error
	return ((data ?? []) as ActivityRow[]).map(mapTaskActivity)
}

export async function logTaskActivity(input: {
	taskId: string
	oldStatus: TaskStatus
	newStatus: TaskStatus
	eventType: TaskActivityEventType
}) {
	const baseInsert = {
		task_id: input.taskId,
		old_status: input.oldStatus,
		new_status: input.newStatus,
		time_changed: new Date().toISOString(),
	}

	const { error: extendedError } = await supabase.from('activity_log').insert({
		...baseInsert,
		event_type: input.eventType,
	})

	if (!extendedError) return

	const { error: fallbackError } = await supabase.from('activity_log').insert(baseInsert)
	if (fallbackError) throw fallbackError
}

export async function getTags() {
	const { data, error } = await supabase.from('tags').select('id, user_id, name').order('name', { ascending: true })
	if (error) throw error
	return ((data ?? []) as TagRow[]).map(mapTaskTag)
}

export async function createTag(input: { userId: string; name: string }) {
	const { data, error } = await supabase
		.from('tags')
		.insert({ user_id: input.userId, name: input.name })
		.select('id, user_id, name')
		.single()

	if (error) throw error
	return mapTaskTag(data as TagRow)
}

export async function deleteTag(tagId: string) {
	const { error: unlinkError } = await supabase.from('task_tags').delete().eq('tag_id', tagId)
	if (unlinkError) throw unlinkError

	const { error } = await supabase.from('tags').delete().eq('id', tagId)
	if (error) throw error
}
