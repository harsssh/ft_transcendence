/// <reference types="vitest" />

import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'
import configShared from '../vitest.config'
import { defineProject } from 'vitest/config'

export default mergeConfig(
  configShared,
  defineProject({
    plugins: [tailwindcss()],
  }),
)
