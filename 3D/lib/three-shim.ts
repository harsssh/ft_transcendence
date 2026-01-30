import * as THREE from 'three'

export * from 'three'

// Manually export backward-compatibility aliases
export const CylinderBufferGeometry = THREE.CylinderGeometry
export const BoxBufferGeometry = THREE.BoxGeometry
export const PlaneBufferGeometry = THREE.PlaneGeometry
export const SphereBufferGeometry = THREE.SphereGeometry
export const CircleBufferGeometry = THREE.CircleGeometry
export const RingBufferGeometry = THREE.RingGeometry
export const ConeBufferGeometry = THREE.ConeGeometry
export const TorusBufferGeometry = THREE.TorusGeometry
export const TorusKnotBufferGeometry = THREE.TorusKnotGeometry
export const BufferGeometry = THREE.BufferGeometry

// Default export if needed
export default THREE
