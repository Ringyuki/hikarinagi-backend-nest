import { SetMetadata } from '@nestjs/common'

export const DISABLE_NSFW_FILTER_KEY = 'disable_nsfw_filter'

export const DisableNSFWFilter = () => SetMetadata(DISABLE_NSFW_FILTER_KEY, true)
