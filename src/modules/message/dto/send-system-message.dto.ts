import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  ValidateBy,
  IsMongoId,
  ValidationArguments,
} from 'class-validator'

export enum SystemMessageType {
  SYSTEM = 'system',
  NOTIFICATION = 'notification',
  INTERACTION = 'interaction',
}

export enum InteractionType {
  LIKE = 'like',
  COMMENT = 'comment',
  REPLY = 'reply',
  FOLLOW = 'follow',
  MENTION = 'mention',
}

export class SendSystemMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  targetUser: string

  @IsEnum(SystemMessageType)
  @IsNotEmpty()
  type: SystemMessageType

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  content: string

  @IsEnum(InteractionType)
  @IsOptional()
  @ValidateBy({
    name: 'isValidInteractionType',
    validator: {
      validate: (value: any, args: any) => {
        const object = args.object as SendSystemMessageDto
        if (object.type === SystemMessageType.INTERACTION && !value) return false
        if (object.type !== SystemMessageType.INTERACTION && value) return false
        return true
      },
      defaultMessage: (args: ValidationArguments) => {
        const object = args.object as SendSystemMessageDto
        if (object.type === SystemMessageType.INTERACTION && !args.value)
          return 'interactionType is required when type is interaction'
        if (object.type !== SystemMessageType.INTERACTION && args.value)
          return 'interactionType is not allowed when type is not interaction'
        return 'interactionType is required when type is interaction'
      },
    },
  })
  interactionType?: InteractionType

  @IsMongoId()
  @IsOptional()
  @ValidateBy({
    name: 'isValidInteractUser',
    validator: {
      validate: (value: any, args: any) => {
        const object = args.object as SendSystemMessageDto
        if (object.type === SystemMessageType.INTERACTION && !value) return false
        if (object.type !== SystemMessageType.INTERACTION && value) return false
        return true
      },
      defaultMessage: (args: ValidationArguments) => {
        const object = args.object as SendSystemMessageDto
        if (object.type === SystemMessageType.INTERACTION && !args.value)
          return 'interactUser is required when type is interaction'
        if (object.type !== SystemMessageType.INTERACTION && args.value)
          return 'interactUser is not allowed when type is not interaction'
        return 'interactUser is required when type is interaction'
      },
    },
  })
  interactUser?: string

  @IsString()
  @IsOptional()
  link?: string

  @IsString()
  @IsOptional()
  linkText?: string
}
