import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './DatePickerField.css'

type DatePickerFieldProps = {
	label: string
	value: string
	onChange: (value: string) => void
}

function parseDateOnly(value: string): Date | null {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!match) return null
	const [, year, month, day] = match
	const parsed = new Date(Number(year), Number(month) - 1, Number(day))
	if (Number.isNaN(parsed.getTime())) return null
	return parsed
}

function toDateValue(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function isSameDay(left: Date, right: Date): boolean {
	return (
		left.getFullYear() === right.getFullYear() &&
		left.getMonth() === right.getMonth() &&
		left.getDate() === right.getDate()
	)
}

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [viewMonth, setViewMonth] = useState(() => {
		const selected = parseDateOnly(value)
		return selected ?? new Date()
	})
	const containerRef = useRef<HTMLDivElement | null>(null)

	const selectedDate = useMemo(() => parseDateOnly(value), [value])
	const today = useMemo(() => {
		const now = new Date()
		return new Date(now.getFullYear(), now.getMonth(), now.getDate())
	}, [])

	useEffect(() => {
		if (!isOpen) return
		function handleOutside(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOutside)
		return () => document.removeEventListener('mousedown', handleOutside)
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const selected = parseDateOnly(value)
		if (selected) setViewMonth(selected)
	}, [isOpen, value])

	const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
	const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
	const leadingBlanks = firstOfMonth.getDay()
	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(firstOfMonth)

	const cells: Array<{ date: Date | null; key: string }> = []
	for (let i = 0; i < leadingBlanks; i++) {
		cells.push({ date: null, key: `blank-${i}` })
	}
	for (let day = 1; day <= daysInMonth; day++) {
		cells.push({
			date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day),
			key: `day-${day}`,
		})
	}

	const displayValue = selectedDate
		? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate)
		: 'Select a date'

	return (
		<label className="task-form__field">
			<span className="task-form__label">{label}</span>
			<div className="task-date-picker" ref={containerRef}>
				<button
					type="button"
					className={`task-date-picker__trigger${isOpen ? ' task-date-picker__trigger--open' : ''}`}
					onClick={() => setIsOpen((current) => !current)}
					aria-haspopup="dialog"
					aria-expanded={isOpen}
				>
					<span className={`task-date-picker__value${selectedDate ? '' : ' task-date-picker__value--placeholder'}`}>
						{displayValue}
					</span>
					<FiCalendar aria-hidden="true" />
				</button>

				{isOpen ? (
					<div className="task-date-picker__popover" role="dialog" aria-label="Choose due date">
						<div className="task-date-picker__header">
							<button
								type="button"
								className="task-date-picker__nav"
								onClick={() => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
								aria-label="Previous month"
							>
								<FiChevronLeft aria-hidden="true" />
							</button>
							<strong>{monthLabel}</strong>
							<button
								type="button"
								className="task-date-picker__nav"
								onClick={() => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
								aria-label="Next month"
							>
								<FiChevronRight aria-hidden="true" />
							</button>
						</div>

						<div className="task-date-picker__weekdays">
							{weekdays.map((weekday) => (
								<span key={weekday}>{weekday}</span>
							))}
						</div>

						<div className="task-date-picker__grid">
							{cells.map((cell) => {
								if (!cell.date) {
									return <span key={cell.key} className="task-date-picker__empty" aria-hidden="true" />
								}

								const dayDate = cell.date

								const isSelected = selectedDate ? isSameDay(dayDate, selectedDate) : false
								const isToday = isSameDay(dayDate, today)

								return (
									<button
										type="button"
										key={cell.key}
										className={`task-date-picker__day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
										onClick={() => {
											onChange(toDateValue(dayDate))
											setIsOpen(false)
										}}
									>
										{dayDate.getDate()}
									</button>
								)
							})}
						</div>

						<div className="task-date-picker__footer">
							<button
								type="button"
								className="task-date-picker__action"
								onClick={() => {
									onChange(toDateValue(today))
									setViewMonth(today)
									setIsOpen(false)
								}}
							>
								Today
							</button>
							<button
								type="button"
								className="task-date-picker__action"
								onClick={() => {
									onChange('')
									setIsOpen(false)
								}}
							>
								Clear
							</button>
						</div>
					</div>
				) : null}
			</div>
		</label>
	)
}
