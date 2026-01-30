// Import HDRI assets from submodule

import night from '../assets/hdri/dikhololo_night_1k.hdr?url'
import warehouse from '../assets/hdri/empty_warehouse_01_1k.hdr?url'
import forest from '../assets/hdri/forest_slope_1k.hdr?url'
import dawn from '../assets/hdri/kiara_1_dawn_1k.hdr?url'
import apartment from '../assets/hdri/lebombo_1k.hdr?url'
import city from '../assets/hdri/potsdamer_platz_1k.hdr?url'
import park from '../assets/hdri/rooitou_park_1k.hdr?url'
import lobby from '../assets/hdri/st_fagans_interior_1k.hdr?url'
import studio from '../assets/hdri/studio_small_03_1k.hdr?url'
import sunset from '../assets/hdri/venice_sunset_1k.hdr?url'

export const HDRI_PRESETS = {
  city,
  sunset,
  dawn,
  night,
  warehouse,
  forest,
  studio,
  apartment,
  park,
  lobby,
} as const

export type HdriPresetKey = keyof typeof HDRI_PRESETS

export type LightingConfig = {
  ambientLight: {
    intensity: number
    color: string
  }
  directionalLight: {
    position: [number, number, number]
    intensity: number
    color: string
    castShadow: boolean
  }
  environment: {
    enabled: boolean
    // URL to the HDRI file
    hdri: string | null
    background: boolean
    blur: number
  }
}

export const defaultLightingConfig: LightingConfig = {
  ambientLight: {
    intensity: 0.8,
    color: '#ffffff',
  },
  directionalLight: {
    position: [5, 10, 5],
    intensity: 1.5,
    color: '#ffffff',
    castShadow: true,
  },
  environment: {
    enabled: true,
    hdri: city, // Default to City
    background: false,
    blur: 0.8,
  },
}
