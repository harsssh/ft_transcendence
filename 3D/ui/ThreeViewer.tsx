import { Box, Button, Loader, Text } from '@mantine/core'
import { Suspense, useState, lazy, useEffect } from 'react'

const ThreeViewerCanvas = lazy(() => import('./ThreeViewerCanvas'))

type Props = {
	status: 'queued' | 'generating' | 'ready' | 'failed'
	modelUrl: string | null
}

export function ThreeViewer({ status, modelUrl }: Props) {
	const [key, setKey] = useState(0)
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	if (status === 'queued') {
		return (
			<Box w={300} h={200} bg="#222" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
				<Loader size="sm" type="dots" />
				<Text size="sm" ml="xs" c="dimmed">Queued...</Text>
			</Box>
		)
	}

	if (status === 'generating') {
		return (
			<Box w={300} h={200} bg="#222" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
				<Loader size="md" variant="bars" />
				<Text size="sm" ml="xs" c="blue">Generating 3D Mesh...</Text>
			</Box>
		)
	}

	if (status === 'failed') {
		return (
			<Box w={300} h={100} bg="#311" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
				<Text size="sm" c="red">Generation Failed</Text>
			</Box>
		)
	}

	if (status === 'ready' && modelUrl) {
		return (
			<Box w={300} h={300} pos="relative" style={{ border: '1px solid #444', borderRadius: 8, overflow: 'hidden', background: '#111' }}>
				<Button
					size="xs"
					variant="subtle"
					compact
					onClick={() => setKey(k => k + 1)}
					style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, color: 'white', background: 'rgba(0,0,0,0.5)' }}
				>
					Reset
				</Button>
				<Text
					size="xs"
					c="yellow"
					style={{ position: 'absolute', bottom: 4, left: 4, zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}
				>
					⚠️ Preview expires in 3 days
				</Text>
				{isMounted && (
					<Suspense fallback={<Box w="100%" h="100%" bg="#000" />}>
						<ThreeViewerCanvas key={key} modelUrl={modelUrl} />
					</Suspense>
				)}
			</Box>
		)
	}

	return null
}
