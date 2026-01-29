import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { Suspense, useEffect, useRef, Component, type ReactNode } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { defaultLightingConfig, HDRI_PRESETS, type HdriPresetKey } from '../config/lighting'

// Error Boundary for catching Loader errors
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
	state = { hasError: false }
	static getDerivedStateFromError() {
		return { hasError: true }
	}
	override componentDidCatch(error: any) {
		console.error('ThreeViewer Error:', error)
	}
	override render() {
		if (this.state.hasError) return this.props.fallback
		return this.props.children
	}
}

function ErrorFallback() {
	return (
		<group>
			<Text color="red" position={[0, 0, 0]} fontSize={0.5}>
				Failed to load model
			</Text>
			<Text color="white" position={[0, -0.6, 0]} fontSize={0.2}>
				(Check URL or Proxy settings)
			</Text>
		</group>
	)
}

// Native GLTF Loader wrapper (keeping this as fallback or custom loader if standard useGLTF has issues)
function Model({ url }: { url: string }) {
	const group = useRef<THREE.Group>(null)
	// Using standard loader for now to keep existing logic, but standardizing naming
	const { scene } = useGLTF(url)

	useEffect(() => {
		if (!group.current) return

		console.log('[ThreeViewer] Scene loaded:', scene)
		scene.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				const mesh = child as THREE.Mesh
				mesh.castShadow = true
				mesh.receiveShadow = true

				console.log('[ThreeViewer] Mesh found:', mesh.name)
				const material = mesh.material as THREE.MeshStandardMaterial
				if (material) {
					console.log('[ThreeViewer] Material:', material.name, {
						type: material.type,
						map: material.map ? 'Present' : 'Missing',
						emissiveMap: material.emissiveMap ? 'Present' : 'Missing',
						color: material.color?.getHexString(),
						metalness: material.metalness,
						roughness: material.roughness,
						vertexColors: material.vertexColors
					})
				}
			}
		})

		const box = new THREE.Box3().setFromObject(scene)
		const size = box.getSize(new THREE.Vector3())
		const center = box.getCenter(new THREE.Vector3())

		scene.position.sub(center) // Center the model

		const maxDim = Math.max(size.x, size.y, size.z)
		if (maxDim > 0) {
			const scale = 3.5 / maxDim // Increased scale slightly
			scene.scale.setScalar(scale)
		}
	}, [scene])

	return <primitive object={scene} ref={group} />
}


type Props = {
	modelUrl: string
	channelId?: number | undefined
	messageId?: number | undefined
	bgMode?: 'dark' | 'light' | 'hdri'
	hdriPreset?: string
}

export default function ThreeViewerCanvas({ modelUrl, bgMode = 'dark', hdriPreset = 'city' }: Props) {
	// Use proxy to avoid CORS
	const proxiedUrl = `/api/proxy/model?url=${encodeURIComponent(modelUrl)}`
	const { ambientLight, directionalLight, environment } = defaultLightingConfig

	// Determine background color based on mode
	const bgColor = bgMode === 'light' ? '#dddddd' : '#111111'
	const showHdriBackground = bgMode === 'hdri'

	// Resolve HDRI file from preset name
	const hdriFile = HDRI_PRESETS[hdriPreset as HdriPresetKey] || environment.hdri

	return (
		<>
			<Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ outputColorSpace: THREE.SRGBColorSpace }}>
				{/* Background Color (Validation: Only render if NOT in HDRI mode) */}
				{!showHdriBackground && <color attach="background" args={[bgColor]} />}

				<ambientLight intensity={ambientLight.intensity} color={ambientLight.color} />
				<directionalLight
					position={directionalLight.position}
					intensity={directionalLight.intensity}
					color={directionalLight.color}
					castShadow={directionalLight.castShadow}
				/>

				{/* Environment Component Handling: explicitly pass files or handle unmounted if missing */}
				{hdriFile ? (
					<Environment
						files={hdriFile}
						background={showHdriBackground}
						blur={showHdriBackground ? 0 : environment.blur}
					/>
				) : (
					<Environment
						preset="city" // Fallback preset if no file
						background={showHdriBackground}
						blur={showHdriBackground ? 0 : environment.blur}
					/>
				)}

				<ErrorBoundary fallback={<ErrorFallback />}>
					<Suspense fallback={null}>
						<Model url={proxiedUrl} />
					</Suspense>
				</ErrorBoundary>
				<OrbitControls makeDefault />
			</Canvas>
		</>
	)
}
