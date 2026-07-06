import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: {
      id: 'uuid-1234',
      name: 'John Doe',
      email: 'user@example.com',
      role: 'CUSTOMER',
    },
    description: 'User details',
  })
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
