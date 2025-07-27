import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { HikariConfigService } from '../config/services/config.service'
import { exec } from 'child_process'
import { promisify } from 'util'

interface VersionInfo {
  version: string
  commitHash: string
  commitCount: number
  generatedAt: Date
}

@Injectable()
export class VersionService implements OnModuleInit {
  private readonly logger = new Logger(VersionService.name)
  private cachedVersionInfo: VersionInfo | null = null
  private initPromise: Promise<void> | null = null
  private readonly execAsync = promisify(exec)

  constructor(private readonly configService: HikariConfigService) {}

  async onModuleInit() {
    this.initPromise = this.initializeVersion()
    this.initPromise.catch(error => {
      this.logger.error('Failed to initialize version in background', error)
    })
  }

  /**
   * 获取版本号
   */
  getVersion(): string {
    if (this.cachedVersionInfo) {
      return this.cachedVersionInfo.version
    }
    return this.getFallbackVersion()
  }

  /**
   * 获取详细版本信息
   */
  async getVersionInfo(): Promise<VersionInfo> {
    if (this.initPromise) {
      await this.initPromise
      this.initPromise = null
    }

    if (!this.cachedVersionInfo) {
      await this.initializeVersion()
    }

    return this.cachedVersionInfo!
  }

  /**
   * 异步初始化版本信息
   */
  private async initializeVersion(): Promise<void> {
    try {
      const [commitHash, commitCount] = await Promise.all([
        this.getCommitHashAsync(),
        this.getCommitCountAsync(),
      ])

      const version = this.buildVersionString(commitCount, commitHash)

      this.cachedVersionInfo = {
        version,
        commitHash,
        commitCount,
        generatedAt: new Date(),
      }

      this.logger.log(`Version initialized: ${version}`)
    } catch (error) {
      this.logger.error('Failed to initialize version', error)
      this.cachedVersionInfo = {
        version: this.getFallbackVersion(),
        commitHash: 'unknown',
        commitCount: 0,
        generatedAt: new Date(),
      }
    }
  }

  /**
   * 异步获取Git commit hash
   */
  private async getCommitHashAsync(): Promise<string> {
    try {
      const { stdout } = await this.execAsync('git rev-parse --short HEAD', {
        timeout: 3000,
      })
      return stdout.trim()
    } catch (error) {
      this.logger.debug('Failed to get commit hash:', error.message)
      return 'unknown'
    }
  }

  /**
   * 异步获取Git commit 次数
   */
  private async getCommitCountAsync(): Promise<number> {
    try {
      const { stdout } = await this.execAsync('git rev-list --count HEAD', {
        timeout: 3000,
      })
      return parseInt(stdout.trim(), 10) || 0
    } catch (error) {
      this.logger.debug('Failed to get commit count:', error.message)
      return 0
    }
  }

  /**
   * 构建版本字符串
   */
  private buildVersionString(commitCount: number, commitHash: string): string {
    const major = this.configService.getWithDefault('version.major', 2)
    const minor = this.configService.getWithDefault('version.minor', 0)
    const suffix = this.configService.getWithDefault('version.suffix', 'alpha')

    return `${major}.${minor}.${commitCount}-${suffix}.${commitHash}`
  }

  /**
   * 获取备用版本号
   */
  private getFallbackVersion(): string {
    const major = this.configService.getWithDefault('version.major', 2)
    const minor = this.configService.getWithDefault('version.minor', 0)
    const suffix = this.configService.getWithDefault('version.suffix', 'alpha')
    const env = process.env.NODE_ENV || 'development'

    return `${major}.${minor}.0-${suffix}.${env}`
  }
}
