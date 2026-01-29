// ============================================================================
// Seed Options - コマンドライン引数を解析
// ============================================================================

export interface SeedOptions {
  dryRun: boolean
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2)

  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
  }
}

export const options = parseArgs()
