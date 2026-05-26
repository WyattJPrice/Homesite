import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  const prs = (await redis.get('prs')) ?? []
  res.setHeader('Cache-Control', 'no-store')
  res.json(prs)
}
