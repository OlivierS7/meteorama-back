import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Cache from '@ioc:Kaperskyguru/Adonis-Cache'

export default class CitiesController {
  public async index({ response }: HttpContextContract) {
    try {
      const cities = await Cache.remember('cities', 1140, async function () {
        return await prisma.cities.findMany()
      })
      return response.status(200).json(cities)
    } catch (error) {
      return response.status(500).json(error)
    }   
  }
}
