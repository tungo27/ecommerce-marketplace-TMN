import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateOrderChatDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export class AddChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
}
