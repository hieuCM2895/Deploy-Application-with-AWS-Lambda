import { JwtHeader } from 'jsonwebtoken';

export interface Jwt {
  header: JwtHeader;
  payload: JwtPayload;
}

export interface JwtPayload {
  iss: string;
  sub: string;
  aud?: string;
  iat: number;
  exp: number;
  at_hash?: string;
  nonce?: string;
}