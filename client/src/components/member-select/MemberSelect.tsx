import { useState, useRef, useEffect } from 'react'
import { FiCheck, FiChevronDown, FiUser } from 'react-icons/fi'
import { Avatar } from '@/components/avatar/Avatar'
import type { TeamMember } from '@/types/team'
import './MemberSelect.css'

type MemberSelectProps = {
	members: TeamMember[]
	value: string[]
	onChange: (ids: string[]) => void
}

export function MemberSelect({ members, value, onChange }: MemberSelectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const selectedMembers = members.filter((m) => value.includes(m.id))

	useEffect(() => {
		if (!isOpen) return
		function handleOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOutside)
		return () => document.removeEventListener('mousedown', handleOutside)
	}, [isOpen])

	function toggleMember(id: string) {
		if (value.includes(id)) {
			onChange(value.filter((memberId) => memberId !== id))
			return
		}

		onChange([...value, id])
	}

	return (
		<div className="member-select" ref={containerRef}>
			<button
				type="button"
				className={`member-select__trigger${isOpen ? ' member-select__trigger--open' : ''}`}
				onClick={() => setIsOpen((prev) => !prev)}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
			>
				{selectedMembers.length ? (
					<>
						<div className="member-select__avatars">
							{selectedMembers.slice(0, 3).map((member) => (
								<Avatar key={member.id} name={member.name} src={member.avatarUrl} size={22} />
							))}
						</div>
						<span className="member-select__name">
							{selectedMembers.length === 1
								? selectedMembers[0].name
								: `${selectedMembers.length} members selected`}
						</span>
					</>
				) : (
					<>
						<span className="member-select__unassigned-icon">
							<FiUser aria-hidden="true" />
						</span>
						<span className="member-select__name member-select__name--placeholder">
							— Unassigned —
						</span>
					</>
				)}
				<FiChevronDown
					className={`member-select__chevron${isOpen ? ' member-select__chevron--open' : ''}`}
					aria-hidden="true"
				/>
			</button>

			{isOpen && (
				<ul
					className="member-select__list"
					role="listbox"
					aria-label="Assigned team members"
					aria-multiselectable="true"
					onMouseDown={(event) => event.stopPropagation()}
				>
					<li
						className={`member-select__option${!value.length ? ' member-select__option--selected' : ''}`}
						role="option"
						aria-selected={!value.length}
						onClick={() => {
							onChange([])
						}}
					>
						<span className="member-select__unassigned-icon">
							<FiUser aria-hidden="true" />
						</span>
						<span className="member-select__option-name">— Unassigned —</span>
						{!value.length ? <FiCheck className="member-select__check" aria-hidden="true" /> : null}
					</li>

					{members.map((m) => (
						<li
							key={m.id}
							className={`member-select__option${value.includes(m.id) ? ' member-select__option--selected' : ''}`}
							role="option"
							aria-selected={value.includes(m.id)}
							onClick={() => toggleMember(m.id)}
						>
							<Avatar name={m.name} src={m.avatarUrl} size={28} />
							<span className="member-select__option-name">{m.name}</span>
							{value.includes(m.id) ? <FiCheck className="member-select__check" aria-hidden="true" /> : null}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
