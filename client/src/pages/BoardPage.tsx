import { Board } from '@/components/board/Board'
import { TaskDetailPanel } from '@/components/task-detail-panel/TaskDetailPanel'
import { TaskFormModal } from '@/components/task-form-modal/TaskFormModal'
import { useTaskBoard } from '../features/tasks/hooks/useTaskBoard'
import { useTeamMembers } from '@/features/teams/hooks/useTeamMembers'
import { priorityFlows } from '@/types/task'

export function BoardPage() {
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
		handleDeleteTask,
		handleMoveTask,
		createNewTag,
		openTaskDetail,
		closeTaskDetail,
		addComment,
	} = useTaskBoard()

	const { members } = useTeamMembers()

	return (
		<main className="board-page">
			<header className="board-page__header">
				<div className="board-page__heading">
					<h1 className="board-page__title">Assessment Task Board</h1>
					<p className="board-page__subtitle">Track tasks, assignments, labels, comments, and activity in one place.</p>
				</div>
				<div className="board-page__summary" aria-label="Board summary">
					<span>Total: {summary.total}</span>
					<span>Completed: {summary.completed}</span>
					<span>Overdue: {summary.overdue}</span>
				</div>
			</header>

			<section className="board-page__filters" aria-label="Search and filters">
				<input
					type="search"
					className="board-page__search"
					placeholder="Search tasks by title"
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
				/>
				<select
					className="board-page__filter"
					value={priorityFilter}
					onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
				>
					<option value="all">All priorities</option>
					{priorityFlows.map((priority) => (
						<option key={priority} value={priority}>
							{priority[0].toUpperCase() + priority.slice(1)}
						</option>
					))}
				</select>
				<select
					className="board-page__filter"
					value={assigneeFilter}
					onChange={(event) => setAssigneeFilter(event.target.value)}
				>
					<option value="all">All assignees</option>
					{members.map((member) => (
						<option key={member.id} value={member.id}>
							{member.name}
						</option>
					))}
				</select>
				<select
					className="board-page__filter"
					value={labelFilter}
					onChange={(event) => setLabelFilter(event.target.value)}
				>
					<option value="all">All labels</option>
					{tags.map((tag) => (
						<option key={tag.id} value={tag.id}>
							{tag.name}
						</option>
					))}
				</select>
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
				onStatusChange={handleStatusChange}
				onPriorityChange={handlePriorityChange}
				onAssigneesChange={handleAssigneesChange}
				onTagSelectionChange={handleTagSelectionChange}
				onCreateTag={createNewTag}
				onSubmit={submitTask}
			/>

			<Board
				columns={columns}
				tasks={filteredTasks}
				members={members}
				tags={tags}
				onMoveTask={handleMoveTask}
				onCreateTask={openCreateModal}
				onEditTask={openEditModal}
				onDeleteTask={handleDeleteTask}
				onOpenTaskDetail={openTaskDetail}
			/>

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
		</main>
	)
}