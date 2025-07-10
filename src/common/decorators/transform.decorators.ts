import { Transform } from 'class-transformer'
import { applyDecorators } from '@nestjs/common'
import { IsOptional, IsArray, IsEnum, IsDate } from 'class-validator'

/**
 * 转换为数字
 * 支持字符串数字转换，无效值返回undefined
 */
export function ToNumber(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
}

/**
 * 转换为整数
 */
export function ToInt(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    const num = parseInt(value, 10)
    return isNaN(num) ? undefined : num
  })
}

/**
 * 转换为浮点数，指定小数位数
 */
export function ToFloat(decimals?: number): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    const num = parseFloat(value)
    if (isNaN(num)) return undefined
    return decimals !== undefined ? parseFloat(num.toFixed(decimals)) : num
  })
}

/**
 * 转换为布尔值
 * 'true', '1', 'yes', 'on' -> true
 * 'false', '0', 'no', 'off' -> false
 */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim()
      if (['true', '1', 'yes', 'on'].includes(lower)) return true
      if (['false', '0', 'no', 'off'].includes(lower)) return false
    }
    return Boolean(value)
  })
}

/**
 * 转换为字符串并去除首尾空格
 */
export function ToString(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined
    return String(value).trim()
  })
}

/**
 * 转换为大写字符串
 */
export function ToUpperCase(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    return String(value).toUpperCase().trim()
  })
}

/**
 * 转换为小写字符串
 */
export function ToLowerCase(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    return String(value).toLowerCase().trim()
  })
}

/**
 * 转换为日期对象
 * 支持时间戳、ISO字符串等
 */
export function ToDate(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    const date = new Date(value)
    return isNaN(date.getTime()) ? undefined : date
  })
}

/**
 * 转换为数组
 * 单个值转为单元素数组，过滤空值
 */
export function ToArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return []
    if (Array.isArray(value)) {
      return value.filter(item => item !== undefined && item !== null && item !== '')
    }
    return value !== '' ? [value] : []
  })
}

/**
 * 转换为数字数组
 * 过滤无效数字
 */
export function ToNumberArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return []

    let arr: any[]
    if (typeof value === 'string') {
      // 支持逗号分隔字符串
      arr = value.split(',').map(item => item.trim())
    } else if (Array.isArray(value)) {
      arr = value
    } else {
      arr = [value]
    }

    return arr.map(Number).filter(num => !isNaN(num))
  })
}

/**
 * 转换为整数数组
 */
export function ToIntArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return []

    let arr: any[]
    if (typeof value === 'string') {
      arr = value.split(',').map(item => item.trim())
    } else if (Array.isArray(value)) {
      arr = value
    } else {
      arr = [value]
    }

    return arr.map(item => parseInt(item, 10)).filter(num => !isNaN(num))
  })
}

/**
 * 转换为字符串数组
 * 去除空字符串和空白字符
 */
export function ToStringArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return []

    let arr: any[]
    if (typeof value === 'string') {
      // 支持逗号分隔字符串
      arr = value.split(',')
    } else if (Array.isArray(value)) {
      arr = value
    } else {
      arr = [value]
    }

    return arr.map(item => String(item).trim()).filter(str => str !== '')
  })
}

/**
 * 转换为布尔数组
 */
export function ToBooleanArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return []

    let arr: any[]
    if (Array.isArray(value)) {
      arr = value
    } else {
      arr = [value]
    }

    return arr.map(item => {
      if (typeof item === 'boolean') return item
      if (typeof item === 'string') {
        const lower = item.toLowerCase().trim()
        return ['true', '1', 'yes', 'on'].includes(lower)
      }
      return Boolean(item)
    })
  })
}

/**
 * 解析JSON字符串
 * 无效JSON返回默认值
 */
export function ParseJSON<T = any>(defaultValue: T = {} as T): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return defaultValue
    if (typeof value === 'object') return value

    try {
      return JSON.parse(value)
    } catch {
      return defaultValue
    }
  })
}

/**
 * 逗号分隔字符串转数组
 */
export function SplitString(separator: string = ','): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return []
    if (Array.isArray(value)) return value

    return String(value)
      .split(separator)
      .map(item => item.trim())
      .filter(item => item !== '')
  })
}

/**
 * 转换为指定范围内的数字
 */
export function ToNumberInRange(
  min: number,
  max: number,
  defaultValue?: number,
): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return defaultValue
    const num = Number(value)
    if (isNaN(num)) return defaultValue
    return Math.min(Math.max(num, min), max)
  })
}

/**
 * 转换枚举值
 */
export function ToEnum<T extends Record<string, string | number>>(
  enumObject: T,
  defaultValue?: T[keyof T],
): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return defaultValue

    const enumValues = Object.values(enumObject)
    if (enumValues.includes(value)) return value

    // 尝试大小写不敏感匹配
    const upperValue = String(value).toUpperCase()
    const matchedValue = enumValues.find(enumVal => String(enumVal).toUpperCase() === upperValue)

    return matchedValue || defaultValue
  })
}

/**
 * 排序字段参数
 */
export function SortField<T extends Record<string, string>>(
  allowedFields: T,
  defaultValue?: T[keyof T],
): PropertyDecorator {
  return applyDecorators(IsOptional(), IsEnum(allowedFields), ToEnum(allowedFields, defaultValue))
}

/**
 * 排序方向参数
 */
export function SortOrder(defaultValue: 'asc' | 'desc' = 'desc'): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsEnum(['asc', 'desc']),
    Transform(({ value }) => {
      if (value === undefined || value === null || value === '') return defaultValue
      const lower = String(value).toLowerCase()
      return ['asc', 'ascending'].includes(lower) ? 'asc' : 'desc'
    }),
  )
}

/**
 * 日期范围参数
 */
export function DateRange(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsArray(),
    IsDate({ each: true }),
    Transform(({ value }) => {
      if (value === undefined || value === null) return []

      let arr: any[]
      if (typeof value === 'string') {
        arr = value.split(',')
      } else if (Array.isArray(value)) {
        arr = value
      } else {
        arr = [value]
      }

      return arr.map(item => new Date(item)).filter(date => !isNaN(date.getTime()))
    }),
  )
}
