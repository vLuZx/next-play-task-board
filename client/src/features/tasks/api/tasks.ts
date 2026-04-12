import { supabase } from '@/lib/supabase/client'

export async function getTasks() {
	const { data, error } = await supabase
		.from('tasks')
		.select('*')
		.order('created_at', { ascending: false })

	if (error) throw error
	return data
}

export async function createTask(input: {
	title: string
	description?: string | null
	assignee_id?: string | null
}) {
	const { data, error } = await supabase
		.from('tasks')
		.insert(input)
		.select()
		.single()

	if (error) throw error
	return data
}