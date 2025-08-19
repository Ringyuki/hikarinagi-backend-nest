import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as natural from 'natural'
import * as kuromoji from 'kuromoji'
import * as path from 'path'
import { Languages } from '../../types/Languages.types'

@Injectable()
export class TokenizationService implements OnModuleInit {
  private readonly logger = new Logger(TokenizationService.name)
  private naturalTokenizer: natural.WordTokenizer | null = null
  private kuromojiTokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null

  tokenizeText = (text: string): string[] => {
    const removePunctuation = (text: string) => {
      return text.replace(/\p{P}/gu, ' ')
    }
    const separated = this.separateLanguages(removePunctuation(text))

    const allTokens: string[] = []

    if (separated.chinese) {
      const chineseTokens = this.segmentChinese(separated.chinese)
      allTokens.push(...chineseTokens)
    }

    if (separated.english) {
      const englishTokens = this.segmentEnglish(separated.english)
      allTokens.push(...englishTokens)
    }

    if (separated.japanese) {
      const japaneseTokens = this.segmentJapanese(separated.japanese)
      allTokens.push(...japaneseTokens)
    }

    return allTokens
  }

  private separateLanguages = (
    text: string,
  ): { chinese: string; english: string; japanese: string } => {
    let chineseText = ''
    let englishText = ''
    let japaneseText = ''

    let currentLanguage: Languages | null = null
    let buffer = ''

    const hasKana = this.hasJapaneseKana(text)

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const detectedLang = this.detectLanguage(char, text)

      // 如果是汉字且文本中包含假名，则认为是日文
      let actualLang: Languages | null = null
      if (/[\u4e00-\u9fa5]/.test(char) && hasKana) {
        actualLang = Languages.Japanese
      } else {
        actualLang = detectedLang
      }

      // 跳过空格和标点符号的语言切换
      if (actualLang === null) {
        buffer += char
        continue
      }

      if (currentLanguage !== actualLang) {
        if (buffer) {
          if (currentLanguage === Languages.Chinese) {
            chineseText += buffer + ' '
          } else if (currentLanguage === Languages.English) {
            englishText += buffer + ' '
          } else if (currentLanguage === Languages.Japanese) {
            japaneseText += buffer + ' '
          }
        }

        currentLanguage = actualLang
        buffer = char
      } else {
        buffer += char
      }
    }

    // 处理最后的buffer
    if (buffer) {
      if (currentLanguage === Languages.Chinese) chineseText += buffer
      else if (currentLanguage === Languages.English) englishText += buffer
      else if (currentLanguage === Languages.Japanese) japaneseText += buffer
    }

    return {
      chinese: chineseText.trim(),
      english: englishText.trim(),
      japanese: japaneseText.trim(),
    }
  }

  private hasJapaneseKana = (text: string) => {
    return /[\u3040-\u309f\u30a0-\u30ff]/.test(text)
  }

  private detectLanguage(char: string, context: string = ''): Languages | null {
    if (/[a-zA-Z0-9]/.test(char)) {
      return Languages.English
    }

    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(char)) {
      return Languages.Japanese
    }

    if (/[\u4e00-\u9fa5]/.test(char)) {
      // 如果上下文中有日文假名，则这个汉字也认为是日文
      if (this.hasJapaneseKana(context)) {
        return Languages.Japanese
      }
      // 否则认为是中文
      return Languages.Chinese
    }

    return null
  }

  private segmentChinese(text: string): string[] {
    const characters = text.match(/[\u4e00-\u9fa5]/g) || []
    const result = []
    const twoCharTokens = []
    const threeCharTokens = []
    const fourCharTokens = []

    // 2字分组
    for (let i = 0; i < characters.length - 1; i++) {
      twoCharTokens.push(characters[i] + characters[i + 1])
    }

    // 3字分组
    for (let i = 0; i < characters.length - 2; i++) {
      threeCharTokens.push(characters[i] + characters[i + 1] + characters[i + 2])
    }

    // 4字分组
    for (let i = 0; i < characters.length - 3; i++) {
      fourCharTokens.push(characters[i] + characters[i + 1] + characters[i + 2] + characters[i + 3])
    }

    result.push(...twoCharTokens.slice(0, 2))
    result.push(...threeCharTokens.slice(0, 2))
    result.push(...fourCharTokens.slice(0, 2))

    return result.slice(0, 6)
  }

  private segmentEnglish(text: string): string[] {
    const stopwords = natural.stopwords
    const tokens = this.naturalTokenizer.tokenize(text)
    return tokens.filter(word => !stopwords.includes(word.toLowerCase()))
  }

  private segmentJapanese(text: string): string[] {
    const tokens = this.kuromojiTokenizer.tokenize(text)
    return tokens.map(token => token.surface_form).filter(token => token.trim().length > 0)
  }

  async onModuleInit() {
    await this.initTokenizer()
    this.logger.log('TokenizationService initialized')
  }

  private async initTokenizer() {
    try {
      this.kuromojiTokenizer = await this.initKuromoji()
      this.logger.log('kuromoji initialized')
      this.naturalTokenizer = new natural.WordTokenizer()
      this.logger.log('natural initialized')
    } catch (error) {
      this.logger.error('Failed to initialize tokenizer', error.message)
      throw error
    }
  }

  private async initKuromoji(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
    return new Promise((resolve, reject) => {
      const dicPath = path.join(process.cwd(), 'node_modules/kuromoji/dict')
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) {
          reject(err)
          return
        }
        resolve(tokenizer)
      })
    })
  }
}
