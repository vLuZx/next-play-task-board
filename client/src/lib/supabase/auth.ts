import { supabase } from './client'

export async function signInAnonymously() {
	return await supabase.auth.signInAnonymously()
}

export async function signOut() {
	return await supabase.auth.signOut()
}

export async function getCurrentUser() {
	const { data, error } = await supabase.auth.getUser()
	if (error) {
        throw error
    }
	return data.user
}