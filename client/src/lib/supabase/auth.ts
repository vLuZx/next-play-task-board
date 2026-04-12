import { supabase } from './client'

export async function signInAnonymously() {
	return await supabase.auth.signInAnonymously()
}

export async function signOut() {
	return await supabase.auth.signOut()
}

export async function getCurrentUser() {
	const { data, error } = await supabase.auth.getSession()

	if (error) {
		throw error
	}

	return data.session?.user ?? null
}

export async function getOrCreateCurrentUser() {
	const existingUser = await getCurrentUser()

	if (existingUser) {
		return existingUser
	}

	const { data, error } = await signInAnonymously()

	if (error) {
		throw error
	}

	if (!data.user) {
		throw new Error('Unable to establish an authenticated user session.')
	}

	return data.user
}