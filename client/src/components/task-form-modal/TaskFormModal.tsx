import { type FormEvent, useState } from 'react'
import { FiPlus, FiX } from 'react-icons/fi'
import './TaskFormModal.css'
import { TextField } from '@/components/text-field/TextField'
import { DatePickerField } from '@/components/date-picker/DatePickerField'
import { MemberSelect } from '@/components/member-select/MemberSelect'
import { priorityFlows, type PriorityFlow, type TaskTag } from '@/types/task'
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
	onPriorityChange: (priority: PriorityFlow) => void
	onAssigneesChange: (assigneeIds: string[]) => void
	onTagSelectionChange: (tagIds: string[]) => void
	onCreateTag: (name: string) => Promise<TaskTag | null>
	onDeleteTag: (tagId: string) => Promise<void> | void
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
	onPriorityChange,
	onAssigneesChange,
	onTagSelectionChange,
	onCreateTag,
	onDeleteTag,
	onSubmit,
}: TaskFormModalProps) {
	const [newTagName, setNewTagName] = useState('')

	if (!isOpen) {
		return null
	}

	const modalTitle = mode === 'edit' ? 'Edit Task' : 'Create Task'
	const modalSubtitle = 'Asterisks (*) mark required fields.'
	const submitLabel = mode === 'edit' ? 'Save Changes' : 'Add Task'

	function toPriorityLabel(priority: PriorityFlow) {
		if (priority === 'low') return 'Low'
		if (priority === 'normal') return 'Normal'
		return 'High'
	}

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
							label="Title *"
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
							<span className="task-form__label">Tags</span>
							<div className="task-form__labels-box">
								<div className="task-form__tag-list" role="group" aria-label="Available tags">
									{tags.map((tag) => {
										const isSelected = formState.tagIds.includes(tag.id)
										return (
											<div
												key={tag.id}
												className={`task-form__tag-option${isSelected ? ' task-form__tag-option--active' : ''}`}
											>
												<button
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
												<button
													type="button"
													className="task-form__tag-delete"
													onClick={() => {
														void onDeleteTag(tag.id)
													}}
													aria-label={`Delete tag ${tag.name}`}
												>
													<FiX aria-hidden="true" />
												</button>
											</div>
										)
									})}
									{!tags.length ? <span className="task-form__selected-label-empty">No tags yet.</span> : null}
								</div>

								<div className="task-form__tag-create-row">
									<div className="task-form__tag-create-input-wrap">
										<input
											type="text"
											className="task-form__input task-form__input--compact task-form__tag-create-input"
											value={newTagName}
											onChange={(event) => setNewTagName(event.target.value)}
											placeholder="Create a new tag"
										/>
										<button
											type="button"
											className="task-form__tag-create-btn"
											onClick={() => {
												void handleCreateTag()
											}}
											disabled={!newTagName.trim()}
											aria-label="Add tag"
										>
											<FiPlus aria-hidden="true" />
										</button>
									</div>
								</div>
							</div>
						</div>

						<div className="task-form__row">
							<label className="task-form__field">
								<span className="task-form__label">Priority</span>
								<div className="task-form__priority-options" role="radiogroup" aria-label="Priority">
									{priorityFlows.map((priority) => {
										const isActive = formState.priorityFlow === priority
										return (
											<button
												type="button"
												key={priority}
												className={`task-form__priority-option${isActive ? ' task-form__priority-option--active' : ''}`}
												onClick={() => onPriorityChange(priority)}
												role="radio"
												aria-checked={isActive}
											>
												<h1>{toPriorityLabel(priority)}</h1>
											</button>
										)
									})}
								</div>
							</label>

							<DatePickerField
								label="Due Date"
								value={formState.dueDate}
								onChange={(value) => onFieldChange('dueDate', value)}
							/>
						</div>
					</div>

					<div className="task-form__meta-fields task-form__meta-fields--modal">
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