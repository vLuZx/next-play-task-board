import './PrioritySignal.css'
import type { PriorityFlow } from '@/types/task'

type PrioritySignalProps = {
	priority: PriorityFlow
	strength: number
}

export function PrioritySignal({ priority, strength }: PrioritySignalProps) {
	return (
		<span className={`priority-signal priority-signal--${priority}`} aria-hidden="true">
			<span className={`priority-signal__bar priority-signal__bar--1${strength >= 1 ? ' is-active' : ''}`} />
			<span className={`priority-signal__bar priority-signal__bar--2${strength >= 2 ? ' is-active' : ''}`} />
			<span className={`priority-signal__bar priority-signal__bar--3${strength >= 3 ? ' is-active' : ''}`} />
		</span>
	)
}
