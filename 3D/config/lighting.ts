import hdriUrl from '../assets/hdri/HDRI_interior003.hdr?url'

export type LightingConfig = {
	ambientLight: {
		intensity: number;
		color: string;
	};
	directionalLight: {
		position: [number, number, number];
		intensity: number;
		color: string;
		castShadow: boolean;
	};
	environment: {
		enabled: boolean;
		// URL to the HDRI file
		hdri: string | null;
		background: boolean;
		blur: number;
	};
};

export const defaultLightingConfig: LightingConfig = {
	ambientLight: {
		intensity: 0.8, // Reduced to prevent washout
		color: '#ffffff',
	},
	directionalLight: {
		position: [5, 10, 5],
		intensity: 1.5, // Reduced to prevent washout
		color: '#ffffff',
		castShadow: true,
	},
	environment: {
		enabled: true,
		hdri: hdriUrl, // Use imported local asset
		background: false, // Don't show the HDRI image as background by default
		blur: 0.8,
	},
};
