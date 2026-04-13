import { useState } from 'react'
import { getAvatarStyle } from '@/lib/utils/avatar'
import './Avatar.css'

type AvatarProps = {
	name: string
	src?: string | null
	size?: number
}

export function Avatar({ name, src, size = 48 }: AvatarProps) {
	const { initials, bg, fg } = getAvatarStyle(name)
	const [imgFailed, setImgFailed] = useState(false)

	if (src && !imgFailed) {
		return (
			<img
				src={src}
				alt={name}
				className="avatar avatar--img"
				style={{ width: size, height: size }}
				onError={() => {
					console.warn('[Avatar] failed to load image:', src)
					setImgFailed(true)
				}}
			/>
		)
	}

	return (
		<span
			className="avatar avatar--initials"
			style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}
			aria-label={name}
			role="img"
		>
			{initials}
		</span>
	)
}
