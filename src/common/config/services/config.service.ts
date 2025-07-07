import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConfigPath, ConfigPathValue } from '../types/config.types'

@Injectable()
export class HikariConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取配置值
   * @param path 配置路径
   * @returns 对应类型的配置值
   */
  get<T extends ConfigPath>(path: T): ConfigPathValue<T> {
    return this.configService.get<ConfigPathValue<T>>(path)
  }

  /**
   * 获取配置值，如果不存在则返回默认值
   * @param path 配置路径
   * @param defaultValue 默认值
   * @returns 配置值或默认值
   */
  getOrThrow<T extends ConfigPath>(path: T): ConfigPathValue<T> {
    const value = this.configService.get<ConfigPathValue<T>>(path)
    if (value === undefined || value === null) {
      throw new Error(`Configuration path "${path}" is required but not set`)
    }
    return value
  }

  /**
   * 获取配置值，如果不存在则返回默认值
   * @param path 配置路径
   * @param defaultValue 默认值
   * @returns 配置值或默认值
   */
  getWithDefault<T extends ConfigPath>(
    path: T,
    defaultValue: ConfigPathValue<T>,
  ): ConfigPathValue<T> {
    const value = this.configService.get<ConfigPathValue<T>>(path)
    return value !== undefined ? value : defaultValue
  }

  /**
   * 检查配置值是否存在
   * @param path 配置路径
   * @returns 是否存在
   */
  has<T extends ConfigPath>(path: T): boolean {
    const value = this.configService.get<ConfigPathValue<T>>(path)
    return value !== undefined && value !== null
  }
}
