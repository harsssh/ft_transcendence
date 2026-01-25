import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { defaultLightingConfig } from '../config/lighting'

// Native GLTF Loader wrapper (keeping this as fallback or custom loader if standard useGLTF has issues)
function Model({ url }: { url: string }) {
	const group = useRef<THREE.Group>(null)
	// Using standard loader for now to keep existing logic, but standardizing naming
	const { scene } = useGLTF(url)

	useEffect(() => {
		if (!group.current) return
		// Auto-centering and scaling logic is handled better by @react-three/drei <Center> or <Stage>,
		// but preserving manual logic for now as requested to fix specific issues.

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
}

export default function ThreeViewerCanvas({ modelUrl }: Props) {
	// Use proxy to avoid CORS
	const proxiedUrl = `/api/proxy/model?url=${encodeURIComponent(modelUrl)}`
	const { ambientLight, directionalLight, environment } = defaultLightingConfig

	return (
		<Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
			<ambientLight intensity={ambientLight.intensity} color={ambientLight.color} />
			<directionalLight
				position={directionalLight.position}
				intensity={directionalLight.intensity}
				color={directionalLight.color}
				castShadow={directionalLight.castShadow}
			/>

			{environment.enabled && (
				<Environment
					files={environment.hdri || undefined}
					preset={environment.hdri ? undefined : 'city'}
					background={environment.background}
					blur={environment.blur}
				/>
			)}

			<Suspense fallback={null}>
				<Model url={proxiedUrl} />
			</Suspense>
			<OrbitControls makeDefault />
		</Canvas>
	)
}
