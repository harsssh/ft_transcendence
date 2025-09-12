#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import { generateTypes } from './build'

const main = defineCommand({
  args: {
    load: {
      type: 'string',
      required: true,
      alias: 'l',
      description: 'glob pattern matching src files',
    },
    outDir: {
      type: 'string',
      required: true,
      alias: 'o',
      description: 'path where the declaration file will be generated',
    },
  },
  run: ({ args }) => generateTypes(args),
})

runMain(main)
