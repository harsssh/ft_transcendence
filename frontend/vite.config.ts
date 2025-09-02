/// <reference types="vitest" />

import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'
import { defineProject } from 'vitest/config'
import configShared from '../vitest.config'

export default mergeConfig(
  configShared,
  defineProject({
    plugins: [tailwindcss()],
  }),
)
