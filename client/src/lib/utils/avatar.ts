type AvatarStyle = {
	initials: string
	bg: string
	fg: string
}

const PASTEL_PALETTES: Array<{ bg: string; fg: string }> = [
	{ bg: '#e8d5ff', fg: '#6d28d9' }, // lavender
	{ bg: '#dbeafe', fg: '#1d4ed8' }, // sky
	{ bg: '#d1fae5', fg: '#065f46' }, // mint
	{ bg: '#fee2cc', fg: '#c2410c' }, // peach
	{ bg: '#fce7f3', fg: '#be185d' }, // rose
	{ bg: '#fef9c3', fg: '#854d0e' }, // lemon
	{ bg: '#e0f2fe', fg: '#0369a1' }, // cyan
]

/** Extracts up to 3 initials from a name (first letter of each word). */
export function getInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 3)
		.map((word) => word[0]?.toUpperCase() ?? '')
		.join('')
}

/** Deterministically picks a palette index from a string so the same name always gets the same color. */
function hashString(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) >>> 0
	}
	return hash
}

export function getAvatarStyle(name: string): AvatarStyle {
	const initials = getInitials(name)
	const palette = PASTEL_PALETTES[hashString(name) % PASTEL_PALETTES.length]
	return { initials, bg: palette.bg, fg: palette.fg }
}
