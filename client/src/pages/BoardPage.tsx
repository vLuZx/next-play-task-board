import { Board } from '../components/board/Board'
import { TaskDetailPanel } from '@/components/task-detail-panel/TaskDetailPanel'
import { TaskFormModal } from '@/components/task-form-modal/TaskFormModal'
import { useEffect, useRef, useState } from 'react'
import { FiAlertCircle, FiCheck, FiCheckCircle, FiChevronDown, FiChevronUp, FiFilter, FiPieChart, FiSearch, FiTarget } from 'react-icons/fi'
import { useTaskBoard } from '../features/tasks/hooks/useTaskBoard'
import { useTeamMembers } from '@/features/teams/hooks/useTeamMembers'
import { priorityFlows } from '@/types/task'

type BoardSortMode = 'priority' | 'dueDate'

function toggleSelection<T extends string>(values: T[], value: T) {
	if (values.includes(value)) {
		return values.filter((item) => item !== value)
	}

	return [...values, value]
}

type BoardPageProps = {
	boardViewMode: 'row' | 'column'
}

export function BoardPage({ boardViewMode }: BoardPageProps) {
	const {
		columns,
		filteredTasks,
		tags,
		userId,
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
	} = useTaskBoard()

	const { members } = useTeamMembers()
	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
	const [sortMode, setSortMode] = useState<BoardSortMode>('priority')
	const [openFilterKey, setOpenFilterKey] = useState<'priority' | 'assignee' | 'label' | null>(null)
	const filterMenuRef = useRef<HTMLDivElement | null>(null)
	const sortMenuRef = useRef<HTMLDivElement | null>(null)

	const activeFilterCount = Number(priorityFilter.length > 0) + Number(assigneeFilter.length > 0) + Number(labelFilter.length > 0)
	const unfinishedCount = Math.max(summary.total - summary.completed, 0)
	const unfinishedPercent = summary.total > 0 ? Math.round((unfinishedCount / summary.total) * 100) : 0

	useEffect(() => {
		if (!isFilterMenuOpen && !isSortMenuOpen) {
			return
		}

		const handlePointerDown = (event: PointerEvent) => {
			const targetNode = event.target as Node
			if (!filterMenuRef.current?.contains(targetNode)) {
				setIsFilterMenuOpen(false)
				setOpenFilterKey(null)
			}

			if (!sortMenuRef.current?.contains(targetNode)) {
				setIsSortMenuOpen(false)
			}
		}

		document.addEventListener('pointerdown', handlePointerDown)
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown)
		}
	}, [isFilterMenuOpen, isSortMenuOpen])

	function toggleFilterSection(section: 'priority' | 'assignee' | 'label') {
		setOpenFilterKey((current) => (current === section ? null : section))
	}

	const sortLabel = sortMode === 'dueDate' ? 'Due Date' : 'Priority'
	const boardPageClassName = `board-page${selectedTask ? ' board-page--with-detail' : ''}`

	useEffect(() => {
		document.title = 'NextPlay - Task Board'
	}, [])

	return (
		<main className={boardPageClassName}>
			<div className="board-page__left">
			<header className="board-page__header">
				<div className="board-page__heading">
					<h1 className="board-page__title">Task Board</h1>
				</div>
			</header>

			<section className="board-page__stats" aria-label="Board statistics">
				<article className="board-page__stat-card">
					<span className="board-page__stat-icon" aria-hidden="true"><FiTarget /></span>
					<div className="board-page__stat-content">
						<span className="board-page__stat-label">Total</span>
						<strong className="board-page__stat-value">{summary.total}</strong>
					</div>
				</article>
				<article className="board-page__stat-card">
					<span className="board-page__stat-icon" aria-hidden="true"><FiCheckCircle /></span>
					<div className="board-page__stat-content">
						<span className="board-page__stat-label">Completed</span>
						<strong className="board-page__stat-value">{summary.completed}</strong>
					</div>
				</article>
				<article className="board-page__stat-card">
					<span className="board-page__stat-icon" aria-hidden="true"><FiAlertCircle /></span>
					<div className="board-page__stat-content">
						<span className="board-page__stat-label">Overdue</span>
						<strong className="board-page__stat-value">{summary.overdue}</strong>
					</div>
				</article>
				<article className="board-page__stat-card">
					<span className="board-page__stat-icon" aria-hidden="true"><FiPieChart /></span>
					<div className="board-page__stat-content">
						<span className="board-page__stat-label">Unfinished</span>
						<strong className="board-page__stat-value">{unfinishedPercent}%</strong>
					</div>
				</article>
			</section>

			<section className="board-page__filters" aria-label="Search and filters">
				<div className="board-page__search-wrap">
					<FiSearch className="board-page__search-icon" aria-hidden="true" />
					<input
						type="search"
						className="board-page__search"
						placeholder="Search tasks"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
					/>
				</div>

				<div className="board-page__toolbar-controls">
					<div className="board-page__sort-menu" ref={sortMenuRef}>
						<button
							type="button"
							className="board-page__filter-trigger"
							onClick={() => {
								setIsSortMenuOpen((current) => !current)
								setIsFilterMenuOpen(false)
								setOpenFilterKey(null)
							}}
							aria-expanded={isSortMenuOpen}
						>
							<FiChevronUp aria-hidden="true" />
							<span>Sort: {sortLabel}</span>
						</button>

						{isSortMenuOpen ? (
							<div className="board-page__filter-popover board-page__sort-popover" role="menu" aria-label="Sort tasks">
								<button
									type="button"
									className={`board-page__filter-option${sortMode === 'priority' ? ' is-selected' : ''}`}
									onClick={() => {
										setSortMode('priority')
										setIsSortMenuOpen(false)
									}}
								>
									<span>Priority</span>
									{sortMode === 'priority' ? <FiCheck aria-hidden="true" /> : null}
								</button>
								<button
									type="button"
									className={`board-page__filter-option${sortMode === 'dueDate' ? ' is-selected' : ''}`}
									onClick={() => {
										setSortMode('dueDate')
										setIsSortMenuOpen(false)
									}}
								>
									<span>Due Date</span>
									{sortMode === 'dueDate' ? <FiCheck aria-hidden="true" /> : null}
								</button>
							</div>
						) : null}
					</div>

					<div className="board-page__filter-menu" ref={filterMenuRef}>
						<button
							type="button"
							className="board-page__filter-trigger"
							onClick={() => {
								setIsFilterMenuOpen((current) => !current)
								setIsSortMenuOpen(false)
								setOpenFilterKey(null)
							}}
							aria-expanded={isFilterMenuOpen}
						>
							<FiFilter aria-hidden="true" />
							<span>Add Filter</span>
							{activeFilterCount > 0 ? <span className="board-page__filter-count">{activeFilterCount}</span> : null}
						</button>

						{isFilterMenuOpen ? (
							<div className="board-page__filter-popover">
							<div className="board-page__filter-field">
								<button
									type="button"
									className="board-page__filter-select"
									onClick={() => toggleFilterSection('priority')}
									aria-expanded={openFilterKey === 'priority'}
								>
									<span className="board-page__filter-select-label">Priority</span>
									<span className="board-page__filter-select-value">
										{priorityFilter.length ? `${priorityFilter.length} selected` : 'All'}
									</span>
									<FiChevronDown className="board-page__filter-chevron" aria-hidden="true" />
								</button>
								{openFilterKey === 'priority' ? (
									<div className="board-page__filter-options" role="listbox" aria-multiselectable="true">
										{priorityFlows.map((priority) => {
											const isSelected = priorityFilter.includes(priority)
											return (
												<button
													type="button"
													key={priority}
													className={`board-page__filter-option${isSelected ? ' is-selected' : ''}`}
													onClick={() => setPriorityFilter((current) => toggleSelection(current, priority))}
												>
													<span>{priority[0].toUpperCase() + priority.slice(1)}</span>
													{isSelected ? <FiCheck aria-hidden="true" /> : null}
												</button>
											)
										})}
									</div>
								) : null}
							</div>
							<div className="board-page__filter-field">
								<button
									type="button"
									className="board-page__filter-select"
									onClick={() => toggleFilterSection('assignee')}
									aria-expanded={openFilterKey === 'assignee'}
								>
									<span className="board-page__filter-select-label">Assignee</span>
									<span className="board-page__filter-select-value">
										{assigneeFilter.length ? `${assigneeFilter.length} selected` : 'All'}
									</span>
									<FiChevronDown className="board-page__filter-chevron" aria-hidden="true" />
								</button>
								{openFilterKey === 'assignee' ? (
									<div className="board-page__filter-options" role="listbox" aria-multiselectable="true">
										{members.map((member) => {
											const isSelected = assigneeFilter.includes(member.id)
											return (
												<button
													type="button"
													key={member.id}
													className={`board-page__filter-option${isSelected ? ' is-selected' : ''}`}
													onClick={() => setAssigneeFilter((current) => toggleSelection(current, member.id))}
												>
													<span>{member.name}</span>
													{isSelected ? <FiCheck aria-hidden="true" /> : null}
												</button>
											)
										})}
									</div>
								) : null}
							</div>
							<div className="board-page__filter-field">
								<button
									type="button"
									className="board-page__filter-select"
									onClick={() => toggleFilterSection('label')}
									aria-expanded={openFilterKey === 'label'}
								>
									<span className="board-page__filter-select-label">Label</span>
									<span className="board-page__filter-select-value">
										{labelFilter.length ? `${labelFilter.length} selected` : 'All'}
									</span>
									<FiChevronDown className="board-page__filter-chevron" aria-hidden="true" />
								</button>
								{openFilterKey === 'label' ? (
									<div className="board-page__filter-options" role="listbox" aria-multiselectable="true">
										{tags.map((tag) => {
											const isSelected = labelFilter.includes(tag.id)
											return (
												<button
													type="button"
													key={tag.id}
													className={`board-page__filter-option${isSelected ? ' is-selected' : ''}`}
													onClick={() => setLabelFilter((current) => toggleSelection(current, tag.id))}
												>
													<span>{tag.name}</span>
													{isSelected ? <FiCheck aria-hidden="true" /> : null}
												</button>
											)
										})}
									</div>
								) : null}
							</div>
							{activeFilterCount > 0 ? (
								<button
									type="button"
									className="board-page__filter-reset"
									onClick={() => {
										setPriorityFilter([])
										setAssigneeFilter([])
										setLabelFilter([])
										setOpenFilterKey(null)
									}}
								>
									Clear filters
								</button>
							) : null}
							</div>
						) : null}
					</div>
				</div>
			</section>

			{statusMessage ? (
				<p className={`board-page__message${errorMessage ? ' board-page__message--error' : ''}`}>
					{statusMessage}
				</p>
			) : null}

			<TaskFormModal
				isOpen={isTaskModalOpen}
				mode={taskModalMode}
				formState={formState}
				isSubmitting={isSubmitting}
				isDisabled={!userId}
				members={members}
				tags={tags}
				onClose={closeTaskModal}
				onFieldChange={handleFieldChange}
				onPriorityChange={handlePriorityChange}
				onAssigneesChange={handleAssigneesChange}
				onTagSelectionChange={handleTagSelectionChange}
				onCreateTag={createNewTag}
				onDeleteTag={deleteExistingTag}
				onSubmit={submitTask}
			/>

			<Board
				columns={columns}
				tasks={filteredTasks}
				members={members}
				tags={tags}
				viewMode={boardViewMode}
				sortMode={sortMode}
				onMoveTask={handleMoveTask}
				onEditTask={openEditModal}
				onDeleteTask={requestDeleteTask}
				onCreateTask={openCreateModal}
				onOpenTaskDetail={openTaskDetail}
			/>

			{deletingTask ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-task-title">
					<div className="modal modal--confirm">
						<div className="modal__header">
							<div className="modal__title-wrap">
								<h2 id="delete-task-title" className="modal__title">Delete Task?</h2>
								<p className="modal__subtitle">
									This will permanently remove <strong>{deletingTask.title}</strong>. This action cannot be undone.
								</p>
							</div>
						</div>
						<div className="modal__confirm-actions">
							<button type="button" className="task-form__secondary" onClick={cancelDeleteTask}>
								Cancel
							</button>
							<button type="button" className="task-form__submit modal__confirm-delete" onClick={() => void confirmDeleteTask()}>
								Delete Task
							</button>
						</div>
					</div>
				</div>
			) : null}

			</div>

			{selectedTask ? (
				<TaskDetailPanel
					task={selectedTask}
					members={members}
					tags={tags}
					comments={taskComments}
					activity={taskActivity}
					isLoading={isDetailLoading}
					isCommentSubmitting={isCommentSubmitting}
					onClose={closeTaskDetail}
					onSubmitComment={addComment}
				/>
			) : null}
		</main>
	)
}