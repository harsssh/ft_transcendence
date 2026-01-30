// Import directly from the build file to avoid circular dependency with the alias in vite.config.ts
// @ts-expect-error
import * as THREE from '../../node_modules/three/build/three.module.js';

// Re-export everything from actual three
// @ts-expect-error
// @ts-expect-error
export * from '../../node_modules/three/build/three.module.js';

// Manually export backward-compatibility aliases
export const CylinderBufferGeometry = THREE.CylinderGeometry;
export const BoxBufferGeometry = THREE.BoxGeometry;
export const PlaneBufferGeometry = THREE.PlaneGeometry;
export const SphereBufferGeometry = THREE.SphereGeometry;
export const CircleBufferGeometry = THREE.CircleGeometry;
export const RingBufferGeometry = THREE.RingGeometry;
export const ConeBufferGeometry = THREE.ConeGeometry;
export const TorusBufferGeometry = THREE.TorusGeometry;
export const TorusKnotBufferGeometry = THREE.TorusKnotGeometry;
export const BufferGeometry = THREE.BufferGeometry;

// Default export if needed
export default THREE;
