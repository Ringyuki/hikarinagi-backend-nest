import authConfig from './auth.config'
import databaseConfig from './database.config'
import appConfig from './app.config'

export default [authConfig, databaseConfig, appConfig]

export * from './config.types'
export * from './config.service'
