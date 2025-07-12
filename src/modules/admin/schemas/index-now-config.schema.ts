import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type IndexNowConfigDocument = IndexNowConfig & Document

@Schema({ _id: false })
export class IndexNowGlobalStats {
  @Prop({
    type: Date,
    default: null,
  })
  lastRun: Date

  @Prop({
    type: Number,
    default: 0,
  })
  lastRunDuration: number

  @Prop({
    type: Boolean,
    default: false,
  })
  lastRunSuccess: boolean

  @Prop({
    type: String,
    default: '',
  })
  lastRunMessage: string

  @Prop({
    type: Number,
    default: 0,
  })
  totalUrlsProcessed: number

  @Prop({
    type: Number,
    default: 0,
  })
  totalSuccessful: number

  @Prop({
    type: Number,
    default: 0,
  })
  totalFailed: number
}

@Schema({ _id: false })
export class IndexNowDistributedLock {
  @Prop({
    type: Boolean,
    default: false,
  })
  isLocked: boolean

  @Prop({
    type: String,
    default: null,
  })
  lockedBy: string

  @Prop({
    type: Date,
    default: null,
  })
  lockedAt: Date

  @Prop({
    type: Number,
    default: 3600000,
  })
  lockTimeout: number
}

@Schema({ _id: false })
export class IndexNowQueueStatus {
  @Prop({
    type: Boolean,
    default: false,
  })
  isProcessing: boolean

  @Prop({
    type: Boolean,
    default: false,
  })
  isStopping: boolean

  @Prop({
    type: Number,
    default: 0,
  })
  total: number

  @Prop({
    type: Number,
    default: 0,
  })
  processed: number

  @Prop({
    type: Number,
    default: 0,
  })
  succeeded: number

  @Prop({
    type: Number,
    default: 0,
  })
  failed: number

  @Prop({
    type: Date,
    default: null,
  })
  startTime: Date

  @Prop({
    type: Date,
    default: null,
  })
  lastUpdateTime: Date

  @Prop({
    type: String,
    default: null,
  })
  processingInstance: string
}

@Schema({ _id: false })
export class IndexNowStandaloneProgress {
  @Prop({
    type: Number,
    default: 0,
  })
  currentBatch: number

  @Prop({
    type: Number,
    default: 0,
  })
  totalBatches: number

  @Prop({
    type: Number,
    default: 0,
  })
  processedUrls: number

  @Prop({
    type: Number,
    default: 0,
  })
  totalUrls: number

  @Prop({
    type: Number,
    default: 0,
  })
  percentage: number
}

@Schema({ _id: false })
export class IndexNowStandaloneResults {
  @Prop({
    type: Number,
    default: 0,
  })
  succeeded: number

  @Prop({
    type: Number,
    default: 0,
  })
  failed: number

  @Prop({
    type: Number,
    default: 0,
  })
  invalid: number
}

@Schema({ _id: false })
export class IndexNowStandaloneStatus {
  @Prop({
    type: Boolean,
    default: false,
  })
  isRunning: boolean

  @Prop({
    type: String,
    default: null,
  })
  processId: string

  @Prop({
    type: Date,
    default: null,
  })
  startTime: Date

  @Prop({
    type: String,
    default: null,
  })
  currentStep: string

  @Prop({ type: IndexNowStandaloneProgress })
  progress: IndexNowStandaloneProgress

  @Prop({ type: IndexNowStandaloneResults })
  results: IndexNowStandaloneResults

  @Prop({
    type: Date,
    default: null,
  })
  lastUpdate: Date

  @Prop({
    type: String,
    default: '',
  })
  message: string
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class IndexNowConfig {
  @Prop({
    type: Boolean,
    default: false,
    required: true,
  })
  enabled: boolean

  @Prop({
    type: String,
    required: false,
  })
  apiKey: string

  @Prop({
    type: String,
    default: 'https://www.hikarinagi.org',
    required: true,
  })
  baseUrl: string

  @Prop({
    type: String,
    required: false,
  })
  keyLocation: string

  @Prop({
    type: Number,
    default: 100,
    min: 1,
    max: 10000,
  })
  batchSize: number

  @Prop({
    type: Number,
    default: 500,
    min: 1,
    max: 10000,
  })
  queueBatchSize: number

  @Prop({
    type: Number,
    default: 30000,
    min: 1000,
    max: 300000,
  })
  queueBatchDelay: number

  @Prop({
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  })
  maxRetries: number

  @Prop({
    type: Number,
    default: 5000,
    min: 1000,
    max: 60000,
  })
  retryDelay: number

  @Prop({
    type: String,
    default: '0 2 * * *',
    required: true,
  })
  schedule: string

  @Prop({
    type: Boolean,
    default: true,
  })
  autoEnabled: boolean

  @Prop({
    type: Date,
    default: null,
  })
  lastRunTime: Date

  @Prop({
    type: String,
    enum: ['success', 'failed', 'running', 'pending', 'stopped'],
    default: 'pending',
  })
  lastRunStatus: string

  @Prop({
    type: Object,
    default: null,
  })
  lastRunResult: any

  @Prop({ type: IndexNowGlobalStats })
  globalStats: IndexNowGlobalStats

  @Prop({ type: IndexNowDistributedLock })
  distributedLock: IndexNowDistributedLock

  @Prop({ type: IndexNowQueueStatus })
  queueStatus: IndexNowQueueStatus

  @Prop({ type: IndexNowStandaloneStatus })
  standaloneStatus: IndexNowStandaloneStatus
}

export const IndexNowConfigSchema = SchemaFactory.createForClass(IndexNowConfig)

// 静态方法
IndexNowConfigSchema.methods.getSingleton = async function () {
  let config = await this.model('IndexNowConfig').findOne()
  if (!config) {
    config = await this.model('IndexNowConfig').create({})
  }
  return config
}

IndexNowConfigSchema.methods.updateSingleton = async function (updates: IndexNowConfig) {
  let config = await this.model('IndexNowConfig').findOne()
  if (!config) {
    config = await this.create(updates)
  } else {
    Object.assign(config, updates)
    await config.save()
  }
  return config
}

IndexNowConfigSchema.methods.acquireLock = async function (lockBy, timeout = 3600000) {
  const config = await this.getSingleton()
  const now = new Date()

  if (
    config.distributedLock.isLocked &&
    config.distributedLock.lockedAt &&
    now.getTime() - config.distributedLock.lockedAt.getTime() < config.distributedLock.lockTimeout
  ) {
    if (config.distributedLock.lockedBy === lockBy) {
      config.distributedLock.lockedAt = now
      await config.save()
      return true
    }
    return false
  }

  config.distributedLock.isLocked = true
  config.distributedLock.lockedBy = lockBy
  config.distributedLock.lockedAt = now
  config.distributedLock.lockTimeout = timeout
  await config.save()
  return true
}

IndexNowConfigSchema.methods.releaseLock = async function (lockBy) {
  const config = await this.getSingleton()

  if (config.distributedLock.lockedBy === lockBy) {
    config.distributedLock.isLocked = false
    config.distributedLock.lockedBy = null
    config.distributedLock.lockedAt = null
    await config.save()
    return true
  }
  return false
}

IndexNowConfigSchema.methods.isLocked = async function () {
  const config = await this.getSingleton()
  const now = new Date()

  if (
    config.distributedLock.isLocked &&
    config.distributedLock.lockedAt &&
    now.getTime() - config.distributedLock.lockedAt.getTime() >= config.distributedLock.lockTimeout
  ) {
    config.distributedLock.isLocked = false
    config.distributedLock.lockedBy = null
    config.distributedLock.lockedAt = null
    await config.save()
    return false
  }

  return config.distributedLock.isLocked
}

IndexNowConfigSchema.methods.updateQueueStatus = async function (status: IndexNowQueueStatus) {
  const config = await this.getSingleton()
  Object.assign(config.queueStatus, status)
  config.queueStatus.lastUpdateTime = new Date()
  await config.save()
  return config.queueStatus
}

IndexNowConfigSchema.methods.getQueueStatus = async function () {
  const config = await this.getSingleton()
  return config.queueStatus
}
