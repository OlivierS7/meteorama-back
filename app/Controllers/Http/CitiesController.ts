import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Cache from '@ioc:Kaperskyguru/Adonis-Cache'
import { RateLimiterPrisma } from 'rate-limiter-flexible'

const MAX_REQUESTS_NUMBER_PER_CLIENT: number = 20

const rateLimiter = new RateLimiterPrisma({
  storeClient: prisma,
  points: MAX_REQUESTS_NUMBER_PER_CLIENT,
  duration: 60
})

export default class CitiesController {
  public async index({ request, response }: HttpContextContract) {
    const remoteAddress = request.request.socket.remoteAddress || ''

    await rateLimiter.consume(remoteAddress, 1).then(async () => {
      try {
        const cities = await Cache.remember('cities', 60, async function () {
          return await prisma.cities.findMany()
        })
        return response.status(200).json(cities)
      } catch (error) {
        return response.status(500).json(error)
      }
    })
    .catch(() => {
      return response.status(429).send('Too Many Requests')
    })
    
  }
}
