import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import { RateLimiterPrisma } from 'rate-limiter-flexible'
const axios = require('axios')

const MAX_REQUESTS_NUMBER_PER_CLIENT: number = 20
const weatherParams = "&current=is_day,precipitation,rain,showers,snowfall,weather_code&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant"

const rateLimiter = new RateLimiterPrisma({
  storeClient: prisma,
  points: MAX_REQUESTS_NUMBER_PER_CLIENT,
  duration: 3600
})

export default class WeatherController {
  public async index({ request, response }: HttpContextContract) {
    const remoteAddress = request.request.socket.remoteAddress || ''
    await rateLimiter.consume(remoteAddress, 1).then(async () => {
      try {
        // Extraire les paramètres lat et lon de la requête
        const { lat, lon } = request.qs()
  
        // Vérifier si les paramètres lat et lon sont fournis
        if (!lat || !lon) {
          return response.status(400).send({ error: 'Les paramètres lat et lon sont requis' })
        }
  
        // Construire l'URL de l'API externe avec les paramètres fournis
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}${weatherParams}`
  
        // Effectuer une requête GET à l'API externe
        const apiResponse = await axios.get(apiUrl)
  
        // Renvoyer les données reçues de l'API externe
        return response.status(apiResponse.status).send(apiResponse.data)
      } catch (error) {
        // Gérer les erreurs
        console.error('Erreur lors de la récupération des données météorologiques :', error)
        return response.status(500).send({ error: 'Une erreur s\'est produite lors de la récupération des données météorologiques' })
      }
    }).catch(() => {
      return response.status(429).send('Too Many Requests')
    })
  }
}
