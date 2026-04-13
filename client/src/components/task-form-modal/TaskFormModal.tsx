import { type FormEvent, useState } from 'react'
import { TextField } from '@/components/text-field/TextField'
import { MemberSelect } from '@/components/member-select/MemberSelect'
import { boardStatuses, priorityFlows, type PriorityFlow, type TaskStatus, type TaskTag } from '@/types/task'
import type { TeamMember } from '@/types/team'
import type { TaskFormState, TaskModalMode } from '../../features/tasks/hooks/useTaskBoard'

type TaskFormModalProps = {
	isOpen: boolean
	mode: TaskModalMode
	formState: TaskFormState
	isSubmitting: boolean
	isDisabled: boolean
	members: TeamMember[]
	tags: TaskTag[]
	onClose: () => void
	onFieldChange: (field: 'title' | 'description' | 'dueDate', value: string) => void
	onStatusChange: (status: TaskStatus) => void
	onPriorityChange: (priority: PriorityFlow) => void
	onAssigneesChange: (assigneeIds: string[]) => void
	onTagSelectionChange: (tagIds: string[]) => void
	onCreateTag: (name: string) => Promise<TaskTag | null>
	onSubmit: () => Promise<void>
}

export function TaskFormModal({
	isOpen,
	mode,
	formState,
	isSubmitting,
	isDisabled,
	members,
	tags,
	onClose,
	onFieldChange,
	onStatusChange,
	onPriorityChange,
	onAssigneesChange,
	onTagSelectionChange,
	onCreateTag,
	onSubmit,
}: TaskFormModalProps) {
	const [newTagName, setNewTagName] = useState('')

	if (!isOpen) {
		return null
	}

	const modalTitle = mode === 'edit' ? 'Edit Task' : 'Create Task'
	const modalSubtitle =
		mode === 'edit'
			? 'Update the task details and keep the board current.'
			: 'Add a new task directly into one of the board columns.'
	const submitLabel = mode === 'edit' ? 'Save Changes' : 'Add Task'

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		await onSubmit()
	}

	async function handleCreateTag() {
		const createdTag = await onCreateTag(newTagName)
		if (!createdTag) return

		onTagSelectionChange([...formState.tagIds, createdTag.id])
		setNewTagName('')
	}

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className="modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="task-form-modal-title"
				onClick={(event) => {
					event.stopPropagation()
				}}
			>
				<div className="modal__header">
					<div>
						<h2 id="task-form-modal-title" className="modal__title">
							{modalTitle}
						</h2>
						<p className="modal__subtitle">{modalSubtitle}</p>
					</div>
					<button
						type="button"
						className="modal__close"
						onClick={onClose}
						aria-label="Close task dialog"
					>
						×
					</button>
				</div>

				<form className="task-form task-form--modal" onSubmit={handleSubmit}>
					<div className="task-form__main-fields task-form__main-fields--modal">
						<TextField
							label="Title"
							value={formState.title}
							onChange={(value) => onFieldChange('title', value)}
							placeholder="Add a task title"
							required
							autoFocus
						/>

						<TextField
							label="Description"
							value={formState.description}
							onChange={(value) => onFieldChange('description', value)}
							placeholder="Optional details"
							multiline
							wide
						/>

						<label className="task-form__field">
							<span className="task-form__label">Assigned Team Members</span>
							<MemberSelect
								members={members}
								value={formState.assigneeIds}
								onChange={onAssigneesChange}
							/>
						</label>

						<div className="task-form__field task-form__field--wide">
							<span className="task-form__label">Labels</span>
							<div className="task-form__tag-list" role="group" aria-label="Task labels">
								{tags.map((tag) => {
									const isSelected = formState.tagIds.includes(tag.id)
									return (
										<button
											key={tag.id}
											type="button"
											className={`task-form__tag-chip${isSelected ? ' task-form__tag-chip--active' : ''}`}
											onClick={() => {
												if (isSelected) {
													onTagSelectionChange(formState.tagIds.filter((id) => id !== tag.id))
													return
												}

												onTagSelectionChange([...formState.tagIds, tag.id])
											}}
										>
											{tag.name}
										</button>
									)
								})}
							</div>
							<div className="task-form__tag-create-row">
								<input
									type="text"
									className="task-form__input"
									value={newTagName}
									onChange={(event) => setNewTagName(event.target.value)}
									placeholder="Create label"
								/>
								<button
									type="button"
									className="task-form__secondary"
									onClick={() => {
										void handleCreateTag()
									}}
									disabled={!newTagName.trim()}
								>
									Add Label
								</button>
							</div>
						</div>

						<TextField
							label="Due Date"
							type="date"
							value={formState.dueDate}
							onChange={(value) => onFieldChange('dueDate', value)}
						/>
					</div>

					<div className="task-form__meta-fields task-form__meta-fields--modal">
						<label className="task-form__field">
							<span className="task-form__label">Status</span>
							<select
								className="task-form__select"
								value={formState.status}
								onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
							>
								{boardStatuses.map((status) => (
									<option key={status} value={status}>
										{status.replace('_', ' ')}
									</option>
								))}
							</select>
						</label>

						<label className="task-form__field">
							<span className="task-form__label">Priority</span>
							<select
								className="task-form__select"
								value={formState.priorityFlow}
								onChange={(event) => onPriorityChange(event.target.value as PriorityFlow)}
							>
								{priorityFlows.map((priority) => (
									<option key={priority} value={priority}>
										{priority.charAt(0).toUpperCase() + priority.slice(1)}
									</option>
								))}
							</select>
						</label>

						<div className="task-form__actions">
							<button type="button" className="task-form__secondary" onClick={onClose}>
								Cancel
							</button>
							<button type="submit" className="task-form__submit" disabled={isSubmitting || isDisabled}>
								{isSubmitting ? 'Saving...' : submitLabel}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}