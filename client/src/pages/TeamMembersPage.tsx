import { useState, useRef, useEffect } from 'react'
import { FiPlus, FiX, FiMoreVertical } from 'react-icons/fi'
import { useTeamMembers } from '@/features/teams/hooks/useTeamMembers'
import { Avatar } from '@/components/avatar/Avatar'
import type { TeamMember } from '@/types/team'
import './TeamMembersPage.css'

type ModalMode = 'create' | 'edit'

export function TeamMembersPage() {
	const { members, isLoading, error, isSubmitting, isDeleting, addMember, editMember, deleteMember } = useTeamMembers()

	// Modal
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<ModalMode>('create')
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
	const [name, setName] = useState('')
	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const [formError, setFormError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Kebab menu
	const [openMenuId, setOpenMenuId] = useState<string | null>(null)

	useEffect(() => {
		if (!openMenuId) return
		function handleOutside() { setOpenMenuId(null) }
		document.addEventListener('click', handleOutside)
		return () => document.removeEventListener('click', handleOutside)
	}, [openMenuId])

	function openCreateModal() {
		setModalMode('create')
		setEditingMember(null)
		setName('')
		setAvatarFile(null)
		setAvatarPreview(null)
		setFormError(null)
		setIsModalOpen(true)
	}

	function openEditModal(member: TeamMember) {
		setModalMode('edit')
		setEditingMember(member)
		setName(member.name)
		setAvatarFile(null)
		setAvatarPreview(member.avatarUrl ?? null)
		setFormError(null)
		setOpenMenuId(null)
		setIsModalOpen(true)
	}

	function closeModal() {
		setIsModalOpen(false)
	}

	function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0] ?? null
		setAvatarFile(file)
		if (file) {
			const reader = new FileReader()
			reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
			reader.readAsDataURL(file)
		} else {
			setAvatarPreview(null)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name.trim()) {
			setFormError('Name is required.')
			return
		}
		const ok = modalMode === 'edit' && editingMember
			? await editMember(editingMember.id, name.trim(), avatarFile)
			: await addMember(name.trim(), avatarFile)
		if (ok) closeModal()
	}

	async function handleDelete(id: string) {
		setOpenMenuId(null)
		await deleteMember(id)
	}

	return (
		<main className="team-page">
			<header className="team-page__header">
				<h1 className="team-page__title">Team Members</h1>
				<button type="button" className="team-page__add-btn" onClick={openCreateModal}>
					<FiPlus aria-hidden="true" />
					Add New Member
				</button>
			</header>

			{error && !isModalOpen && <p className="team-page__error">{error}</p>}

			{isLoading ? (
				<p className="team-page__loading">Loading…</p>
			) : members.length === 0 ? (
				<div className="team-page__empty">
					<p className="team-page__empty-text">No team members yet.</p>
				</div>
			) : (
				<div className="team-page__grid">
					{members.map((member) => (
						<div key={member.id} className="member-card">
							<button
								type="button"
								className="member-card__menu-btn"
								aria-label={`Options for ${member.name}`}
								onClick={(e) => {
									e.stopPropagation()
									setOpenMenuId((prev) => (prev === member.id ? null : member.id))
								}}
							>
								<FiMoreVertical aria-hidden="true" />
							</button>

							{openMenuId === member.id && (
								<div className="member-card__menu" role="menu">
									<button
										type="button"
										className="member-card__menu-item"
										role="menuitem"
										onClick={(e) => { e.stopPropagation(); openEditModal(member) }}
									>
										Edit
									</button>
									<button
										type="button"
										className="member-card__menu-item member-card__menu-item--danger"
										role="menuitem"
										disabled={isDeleting}
										onClick={(e) => { e.stopPropagation(); handleDelete(member.id) }}
									>
										Delete
									</button>
								</div>
							)}

							<Avatar name={member.name} src={member.avatarUrl} size={64} />
							<p className="member-card__name">{member.name}</p>
						</div>
					))}
				</div>
			)}

			{isModalOpen && (
				<div
					className="team-modal-overlay"
					role="dialog"
					aria-modal="true"
					aria-labelledby="member-modal-title"
					onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
				>
					<div className="team-modal">
						<div className="team-modal__header">
							<h2 className="team-modal__title" id="member-modal-title">
								{modalMode === 'edit' ? 'Edit Member' : 'Add New Member'}
							</h2>
							<button
								type="button"
								className="team-modal__close"
								onClick={closeModal}
								aria-label="Close"
							>
								<FiX aria-hidden="true" />
							</button>
						</div>

						<form className="team-modal__form" onSubmit={handleSubmit}>
							<label className="team-modal__field">
								<span className="team-modal__label">Name</span>
								<input
									type="text"
									className="team-modal__input"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Jane Smith"
									autoFocus
								/>
							</label>

							<div className="team-modal__field">
								<span className="team-modal__label">Avatar image</span>
								<div className="team-modal__avatar-row">
									{avatarPreview && (
										<img
											src={avatarPreview}
											alt="Preview"
											className="team-modal__avatar-preview"
										/>
									)}
									<button
										type="button"
										className="team-modal__file-btn"
										onClick={() => fileInputRef.current?.click()}
									>
										{avatarFile ? avatarFile.name : 'Choose image…'}
									</button>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="team-modal__file-input"
										onChange={handleAvatarChange}
									/>
								</div>
							</div>

							{(formError || (error && isModalOpen)) && (
								<p className="team-modal__error">{formError ?? error}</p>
							)}

							<div className="team-modal__actions">
								<button type="button" className="team-modal__cancel" onClick={closeModal}>
									Cancel
								</button>
								<button type="submit" className="team-modal__submit" disabled={isSubmitting}>
									{isSubmitting
										? modalMode === 'edit' ? 'Saving…' : 'Adding…'
										: modalMode === 'edit' ? 'Save Changes' : 'Add Member'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	)
}
