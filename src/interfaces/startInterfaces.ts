import * as https from 'https'
import * as http from 'http'

export interface Success {
  /** Whether the Action was a Success */ success: true
  /** The Port on which the Server launched on */ port: number
  /** A Message explaining what happened */ message: string
  /** The Raw HTTP (or HTTPS) Server Object */ rawServer: http.Server | https.Server
}

export interface Error {
  /** Whether the Action was a Success */ success: false
  /** The Object containing the Servers Error */ error: Error
  /** A Message explaining what happened */ message: string
}