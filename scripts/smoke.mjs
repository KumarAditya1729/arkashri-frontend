const baseUrl = (process.env.SMOKE_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

const publicRoutes = [
  { path: '/sign-in', mustContain: ['Arkashri', 'AI Audit OS', 'Sign In to Workspace'] },
  { path: '/register', mustContain: ['Arkashri', 'Create your account'] },
  { path: '/terms', mustContain: ['Arkashri'] },
  { path: '/privacy', mustContain: ['Arkashri'] },
]

const forbiddenText = [
  'Bandhan Vatika',
  'Banquet Hall',
  'Premium Event Space',
  'For Your Special Moments',
]

async function checkRoute(route) {
  const url = `${baseUrl}${route.path}`
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ArkashriSmoke/1.0' },
  })
  const body = await response.text()
  const failures = []

  if (!response.ok) failures.push(`HTTP ${response.status}`)
  for (const text of route.mustContain) {
    if (!body.includes(text)) failures.push(`missing "${text}"`)
  }
  for (const text of forbiddenText) {
    if (body.includes(text)) failures.push(`forbidden legacy text "${text}"`)
  }

  return { path: route.path, url, ok: failures.length === 0, failures }
}

async function main() {
  const results = []
  for (const route of publicRoutes) {
    results.push(await checkRoute(route))
  }

  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL'
    console.log(`${status} ${result.path}${result.failures.length ? `: ${result.failures.join(', ')}` : ''}`)
  }

  const failed = results.filter(result => !result.ok)
  if (failed.length > 0) {
    console.error(`Smoke failed for ${failed.length} route(s) against ${baseUrl}`)
    process.exit(1)
  }

  console.log(`Smoke passed for ${results.length} public route(s) against ${baseUrl}`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
