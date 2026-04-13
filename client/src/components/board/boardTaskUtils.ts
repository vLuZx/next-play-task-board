import type { BoardTask, TaskStatus } from '@/types/task'

export const priorityRank = {
	high: 0,
	normal: 1,
	low: 2,
} as const

function parseDateFromValue(value?: string | null) {
	if (!value) {
		return null
	}

	const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	const date = dateOnlyMatch
		? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
		: new Date(value)

	if (Number.isNaN(date.getTime())) {
		return null
	}

	return date
}

export function parseDueDate(value?: string | null) {
	const date = parseDateFromValue(value)
	if (!date) {
		return null
	}

	date.setHours(0, 0, 0, 0)
	return date
}

function formatDueDateLabel(value?: string | null) {
	const date = parseDateFromValue(value)
	if (!date) {
		return null
	}

	return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export function formatDueDate(value?: string | null) {
	return formatDueDateLabel(value) ?? 'No due date'
}

export function formatOptionalDueDate(value?: string | null) {
	return formatDueDateLabel(value)
}

export function getDueIndicatorInfo(
	value: string | null | undefined,
	status: TaskStatus,
): { tone: 'warning' | 'danger'; tooltip: string; ariaLabel: string } | null {
	const dueDate = parseDueDate(value)
	if (!dueDate) {
		return null
	}

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const msPerDay = 1000 * 60 * 60 * 24
	const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / msPerDay)

	if (daysUntilDue < 0) {
		if (status === 'done') {
			return null
		}

		return {
			tone: 'danger',
			tooltip: 'Overdue',
			ariaLabel: 'Overdue',
		}
	}

	if (daysUntilDue <= 7) {
		if (daysUntilDue === 0) {
			return {
				tone: 'warning',
				tooltip: 'Due today',
				ariaLabel: 'Due today',
			}
		}

		if (daysUntilDue === 1) {
			return {
				tone: 'warning',
				tooltip: 'Due in 1 day',
				ariaLabel: 'Due tomorrow',
			}
		}

		return {
			tone: 'warning',
			tooltip: `Due in ${daysUntilDue} days`,
			ariaLabel: `Due in ${daysUntilDue} days`,
		}
	}

	return null
}

export function getPriorityStrength(priority: BoardTask['priorityFlow']) {
	if (priority === 'low') return 1
	if (priority === 'normal') return 2
	return 3
}

export function getPriorityLabel(priority: BoardTask['priorityFlow']) {
	if (priority === 'low') return 'Low'
	if (priority === 'normal') return 'Normal'
	return 'High'
}

export function getTagColorClass(name: string): string {
	let h = 0
	for (let i = 0; i < name.length; i++) {
		h = (h * 31 + name.charCodeAt(i)) >>> 0
	}
	return `board-task-tag--c${h % 10}`
}
