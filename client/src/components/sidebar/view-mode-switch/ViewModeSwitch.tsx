import { FiColumns, FiList } from 'react-icons/fi'
import './ViewModeSwitch.css'

type BoardViewMode = 'row' | 'column'

type ViewModeSwitchProps = Readonly<{
	boardViewMode: BoardViewMode
	allowRowView: boolean
	onChangeBoardViewMode: (mode: BoardViewMode) => void
}>

export function ViewModeSwitch({ boardViewMode, allowRowView, onChangeBoardViewMode }: ViewModeSwitchProps) {
	return (
		<div
			role="group"
			aria-label="Board view mode"
			className={`view-mode-switch${allowRowView ? '' : ' view-mode-switch--single'}`}
		>
			{allowRowView ? (
				<button
					type="button"
					className={`view-mode-switch__button${boardViewMode === 'row' ? ' view-mode-switch__button--active' : ''}`}
					onClick={() => onChangeBoardViewMode('row')}
					aria-pressed={boardViewMode === 'row'}
					aria-label="Row view"
					title="Switch to row view"
				>
					<FiList aria-hidden="true" />
				</button>
			) : null}
			<button
				type="button"
				className={`view-mode-switch__button${boardViewMode === 'column' ? ' view-mode-switch__button--active' : ''}`}
				onClick={() => onChangeBoardViewMode('column')}
				aria-pressed={boardViewMode === 'column'}
				aria-label="Column view"
				title="Switch to column view"
			>
				<FiColumns aria-hidden="true" />
			</button>
		</div>
	)
}
