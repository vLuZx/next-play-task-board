import { supabase } from '@/lib/supabase/client'
import type { TeamMember, CreateTeamMemberInput } from '@/types/team'

const AVATAR_BUCKET = 'avatars'

type TeamMemberRow = {
	id: string
	user_id: string | null
	name: string
	avatar_url: string | null
}

function mapMember(row: TeamMemberRow): TeamMember {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		avatarUrl: row.avatar_url,
	}
}

const SUPABASE_STORAGE_PREFIX = `/storage/v1/object/public/${AVATAR_BUCKET}/`

/** Extracts the storage path from either a full URL or a bare path. */
function toStoragePath(value: string): string {
	const idx = value.indexOf(SUPABASE_STORAGE_PREFIX)
	return idx !== -1 ? value.slice(idx + SUPABASE_STORAGE_PREFIX.length) : value
}

export async function getTeamMembers(): Promise<TeamMember[]> {
	const { data, error } = await supabase
		.from('team_members')
		.select('id, user_id, name, avatar_url')
		.order('name', { ascending: true })

	if (error) {
		console.error('[teams] getTeamMembers error:', error)
		throw error
	}

	const rows = (data ?? []) as TeamMemberRow[]

	const members = await Promise.all(
		rows.map(async (row) => {
			const member = mapMember(row)
			if (row.avatar_url) {
				const path = toStoragePath(row.avatar_url)
				const { data: signed, error: signErr } = await supabase.storage
					.from(AVATAR_BUCKET)
					.createSignedUrl(path, 60 * 60)
				if (signErr) {
					console.warn('[teams] could not sign URL for', path, signErr)
					member.avatarUrl = null
				} else {
					member.avatarUrl = signed.signedUrl
				}
			}
			return member
		}),
	)

	return members
}

export async function uploadMemberAvatar(file: File): Promise<string> {
	const { data: { user }, error: authError } = await supabase.auth.getUser()
	if (authError) {
		console.error('[teams] auth.getUser error:', authError)
		throw authError
	}
	if (!user) throw new Error('You must be signed in to upload an avatar.')

	const ext = file.name.split('.').pop() ?? 'png'
	const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

	const { error: uploadError } = await supabase.storage
		.from(AVATAR_BUCKET)
		.upload(path, file)

	if (uploadError) {
		console.error('[teams] uploadMemberAvatar error:', uploadError)
		throw uploadError
	}

	// Store only the path — signed URLs are generated at read time
	return path
}

export async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
	const { data: { user }, error: authError } = await supabase.auth.getUser()
	if (authError) {
		console.error('[teams] auth.getUser error:', authError)
		throw authError
	}
	if (!user) throw new Error('You must be signed in to add a team member.')

	const { data, error } = await supabase
		.from('team_members')
		.insert({
			user_id: user.id,
			name: input.name,
			avatar_url: input.avatarUrl ?? null,
		})
		.select('id, user_id, name, avatar_url')
		.single()

	if (error) {
		console.error('[teams] createTeamMember error:', error)
		throw error
	}
	return mapMember(data as TeamMemberRow)
}

export async function updateTeamMember(id: string, updates: { name: string; avatarUrl?: string }): Promise<void> {
	const patch: Record<string, string | null> = { name: updates.name }
	if (updates.avatarUrl !== undefined) {
		patch.avatar_url = updates.avatarUrl
	}

	const { error } = await supabase
		.from('team_members')
		.update(patch)
		.eq('id', id)

	if (error) {
		console.error('[teams] updateTeamMember error:', error)
		throw error
	}
}

export async function deleteTeamMember(id: string): Promise<void> {
	const { error } = await supabase
		.from('team_members')
		.delete()
		.eq('id', id)

	if (error) {
		console.error('[teams] deleteTeamMember error:', error)
		throw error
	}
}
