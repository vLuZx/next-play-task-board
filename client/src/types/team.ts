export type TeamMember = {
	id: string
	userId: string | null
	name: string
	avatarUrl: string | null
}

export type CreateTeamMemberInput = {
	userId?: string | null
	name: string
	avatarUrl?: string | null
}
