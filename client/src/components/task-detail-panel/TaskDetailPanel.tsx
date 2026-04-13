import { useMemo, useState } from 'react'
import { Avatar } from '@/components/avatar/Avatar'
import type { BoardTask, TaskActivity, TaskComment, TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'
import './TaskDetailPanel.css'

type TaskDetailPanelProps = {
	task: BoardTask | null
	members: TeamMember[]
	tags: TaskTag[]
	comments: TaskComment[]
	activity: TaskActivity[]
	isLoading: boolean
	isCommentSubmitting: boolean
	onClose: () => void
	onSubmitComment: (message: string) => Promise<void>
}

function formatTimestamp(value: string) {
	const parsedDate = new Date(value)
	if (Number.isNaN(parsedDate.getTime())) {
		return value
	}

	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(parsedDate)
}

function formatTimeAgo(value: string) {
	const parsedDate = new Date(value)
	if (Number.isNaN(parsedDate.getTime())) {
		return ''
	}

	const diffMs = Date.now() - parsedDate.getTime()
	const diffMinutes = Math.floor(diffMs / (1000 * 60))
	if (diffMinutes < 1) return 'just now'
	if (diffMinutes < 60) return `${diffMinutes}m ago`

	const diffHours = Math.floor(diffMinutes / 60)
	if (diffHours < 24) return `${diffHours}h ago`

	const diffDays = Math.floor(diffHours / 24)
	return `${diffDays}d ago`
}

function toStatusLabel(status: string) {
	return status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toActivityMessage(entry: TaskActivity) {
	if (entry.eventType === 'status_change' && entry.oldStatus !== entry.newStatus) {
		return `Moved from ${toStatusLabel(entry.oldStatus)} to ${toStatusLabel(entry.newStatus)}`
	}

	if (entry.eventType === 'assignees_updated') {
		return 'Updated assignees'
	}

	return 'Task details updated'
}

export function TaskDetailPanel({
	task,
	members,
	tags,
	comments,
	activity,
	isLoading,
	isCommentSubmitting,
	onClose,
	onSubmitComment,
}: TaskDetailPanelProps) {
	const [draftComment, setDraftComment] = useState('')

	const assignees = useMemo(() => {
		if (!task) return []
		return members.filter((member) => task.assigneeIds.includes(member.id))
	}, [task, members])

	const taskTags = useMemo(() => {
		if (!task) return []
		return tags.filter((tag) => task.tagIds.includes(tag.id))
	}, [task, tags])

	if (!task) {
		return null
	}

	return (
		<div className="task-detail__backdrop" onClick={onClose}>
			<aside
				className="task-detail"
				role="dialog"
				aria-modal="true"
				aria-labelledby={`task-detail-title-${task.id}`}
				onClick={(event) => event.stopPropagation()}
			>
				<header className="task-detail__header">
					<div>
						<h2 id={`task-detail-title-${task.id}`} className="task-detail__title">{task.title}</h2>
						<p className="task-detail__subtitle">{task.description || 'No description yet.'}</p>
					</div>
					<button type="button" className="task-detail__close" onClick={onClose} aria-label="Close task details">×</button>
				</header>

				<div className="task-detail__meta">
					<div className="task-detail__meta-block">
						<span className="task-detail__meta-label">Assignees</span>
						<div className="task-detail__assignees">
							{assignees.length
								? assignees.map((member) => (
									<span key={member.id} className="task-detail__assignee">
										<Avatar name={member.name} src={member.avatarUrl} size={24} />
										<span>{member.name}</span>
									</span>
								))
								: <span className="task-detail__meta-empty">Unassigned</span>}
						</div>
					</div>
					<div className="task-detail__meta-block">
						<span className="task-detail__meta-label">Labels</span>
						<div className="task-detail__tags">
							{taskTags.length
								? taskTags.map((tag) => (
									<span key={tag.id} className="task-detail__tag">{tag.name}</span>
								))
								: <span className="task-detail__meta-empty">No labels</span>}
						</div>
					</div>
				</div>

				<div className="task-detail__columns">
					<section className="task-detail__section">
						<h3 className="task-detail__section-title">Comments</h3>
						{isLoading ? <p className="task-detail__loading">Loading…</p> : null}
						<div className="task-detail__feed">
							{comments.map((comment) => (
								<article key={comment.id} className="task-detail__feed-item">
									<p className="task-detail__feed-text">{comment.message}</p>
									<span className="task-detail__feed-time">{formatTimestamp(comment.sentAt)}</span>
								</article>
							))}
							{!comments.length && !isLoading ? <p className="task-detail__meta-empty">No comments yet.</p> : null}
						</div>
						<form
							className="task-detail__comment-form"
							onSubmit={(event) => {
								event.preventDefault()
								void onSubmitComment(draftComment).then(() => setDraftComment(''))
							}}
						>
							<textarea
								className="task-detail__comment-input"
								value={draftComment}
								onChange={(event) => setDraftComment(event.target.value)}
								placeholder="Write a comment"
								rows={3}
							/>
							<button type="submit" className="task-detail__comment-submit" disabled={!draftComment.trim() || isCommentSubmitting}>
								{isCommentSubmitting ? 'Posting…' : 'Post Comment'}
							</button>
						</form>
					</section>

					<section className="task-detail__section">
						<h3 className="task-detail__section-title">Activity</h3>
						{isLoading ? <p className="task-detail__loading">Loading…</p> : null}
						<ul className="task-detail__timeline">
							{activity.map((entry) => (
								<li key={entry.id} className="task-detail__timeline-item">
									<p>{toActivityMessage(entry)}</p>
									<span>{formatTimeAgo(entry.timeChanged)}</span>
								</li>
							))}
							{!activity.length && !isLoading ? <li className="task-detail__meta-empty">No activity yet.</li> : null}
						</ul>
					</section>
				</div>
			</aside>
		</div>
	)
}
