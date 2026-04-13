import { useState, useEffect } from 'react'
import { getTeamMembers, createTeamMember, uploadMemberAvatar, updateTeamMember, deleteTeamMember } from '../api/teams'
import type { TeamMember } from '@/types/team'

export function useTeamMembers() {
	const [members, setMembers] = useState<TeamMember[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	useEffect(() => {
		loadMembers()
	}, [])

	async function loadMembers(silent = false) {
		if (!silent) setIsLoading(true)
		setError(null)
		try {
			const data = await getTeamMembers()
			setMembers(data)
		} catch (err) {
			console.error('[useTeamMembers] loadMembers error:', err)
			setError(err instanceof Error ? err.message : 'Failed to load members')
		} finally {
			if (!silent) setIsLoading(false)
		}
	}

	async function addMember(name: string, avatarFile: File | null): Promise<boolean> {
		setIsSubmitting(true)
		setError(null)
		try {
			let avatarUrl: string | null = null
			if (avatarFile) {
				avatarUrl = await uploadMemberAvatar(avatarFile)
			}
			await createTeamMember({ name, avatarUrl })
			await loadMembers(true)
			return true
		} catch (err) {
			console.error('[useTeamMembers] addMember error:', err)
			setError(err instanceof Error ? err.message : 'Failed to add member')
			return false
		} finally {
			setIsSubmitting(false)
		}
	}

	async function editMember(id: string, name: string, avatarFile: File | null, removeAvatar = false): Promise<boolean> {
		setIsSubmitting(true)
		setError(null)
		try {
			const updates: { name: string; avatarUrl?: string | null } = { name }
			if (avatarFile) {
				updates.avatarUrl = await uploadMemberAvatar(avatarFile)
			} else if (removeAvatar) {
				updates.avatarUrl = null
			}
			await updateTeamMember(id, updates)
			await loadMembers(true)
			return true
		} catch (err) {
			console.error('[useTeamMembers] editMember error:', err)
			setError(err instanceof Error ? err.message : 'Failed to update member')
			return false
		} finally {
			setIsSubmitting(false)
		}
	}

	async function deleteMember(id: string): Promise<void> {
		setIsDeleting(true)
		setError(null)
		try {
			await deleteTeamMember(id)
			setMembers((prev) => prev.filter((m) => m.id !== id))
		} catch (err) {
			console.error('[useTeamMembers] deleteMember error:', err)
			setError(err instanceof Error ? err.message : 'Failed to delete member')
		} finally {
			setIsDeleting(false)
		}
	}

	return { members, isLoading, error, isSubmitting, isDeleting, addMember, editMember, deleteMember }
}
