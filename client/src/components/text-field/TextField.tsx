type TextFieldProps = {
	label: string
	value: string
	onChange: (value: string) => void
	type?: 'text' | 'date'
	placeholder?: string
	required?: boolean
	autoFocus?: boolean
	rows?: number
	multiline?: boolean
	wide?: boolean
}

export function TextField({
	label,
	value,
	onChange,
	type = 'text',
	placeholder,
	required,
	autoFocus,
	rows = 4,
	multiline,
	wide,
}: TextFieldProps) {
	return (
		<label className={`task-form__field${wide ? ' task-form__field--wide' : ''}`}>
			<span className="task-form__label">{label}</span>
			{multiline ? (
				<textarea
					className="task-form__textarea"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					rows={rows}
				/>
			) : (
				<input
					type={type}
					className={`task-form__input${type === 'date' ? ' task-form__input--date' : ''}`}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					required={required}
					autoFocus={autoFocus}
				/>
			)}
		</label>
	)
}