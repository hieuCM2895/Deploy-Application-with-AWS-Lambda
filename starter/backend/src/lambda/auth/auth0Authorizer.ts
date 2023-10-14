import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.js'
import { JwtPayload } from '../../auth/JwtPayload'
import { Jwt } from './jwt.js';
import Axios from 'axios'


const logger = createLogger('auth')
let cachedCertificate

const jwksUrl = 'https://dev-dnt8xiz2bvdurua5.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ] 
      }   
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt = decode(token, { complete: true }) as Jwt
  logger.info(`jwt after decoding: ${jwt}`)

  const keyId = jwt.header.kid

  if(!keyId) {
    throw new Error('Unable to process verify token');
  }
  logger.info(`keyId: ${jwt}`)

  const pemCertificate = await getCertificateByKeyId(keyId)

  return verify(token, pemCertificate, { algorithms: ['RS256'] }) as JwtPayload
}

async function getCertificateByKeyId(keyId: string): Promise<string> {
  if (cachedCertificate) return cachedCertificate

  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys

  if (!keys || !keys.length) throw new Error('No JWKS keys found')

  const signingKeys = keys.filter(
    (key) =>
      key.use === 'sig' &&
      key.kty === 'RSA' &&
      key.alg === 'RS256' &&
      key.n &&
      key.e &&
      key.kid === keyId &&
      key.x5c &&
      key.x5c.length
  )

  if (!signingKeys.length) throw new Error('No JWKS signing keys found')

  const matchedKey = signingKeys[0]
  const publicCertificate = matchedKey.x5c[0] // public key

  cachedCertificate = getPemFromCertificate(publicCertificate)
  logger.info('pemCertificate:', cachedCertificate)

  return cachedCertificate
}

function getPemFromCertificate(cert: string): string {
  if (!cert) {
    throw new Error('Certificate is null or undefined');
  }

  let pemCert = cert.match(/.{1,64}/g)?.join('\n');

  if (!pemCert) {
    throw new Error('Unable to process certificate');
  }

  return `-----BEGIN CERTIFICATE-----\n${pemCert}\n-----END CERTIFICATE-----\n`;
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
