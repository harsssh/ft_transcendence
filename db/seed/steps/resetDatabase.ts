import { reset } from 'drizzle-seed'
import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { p, pc } from '../cli'
import { options } from '../options'

export async function resetDatabase() {
  const s = p.spinner()

  if (options.dryRun) {
    s.start('Resetting database...')
    s.stop(`${pc.yellow('○')} Database reset ${pc.dim('(skipped - dry run)')}`)
    return
  }

  s.start('Resetting database...')
  await reset(db, schema)
  s.stop(`${pc.green('✓')} Database reset complete`)
}
