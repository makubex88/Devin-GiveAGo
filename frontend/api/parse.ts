import { handleParseRequest } from '../src/parser/handleParseRequest.js'

export function POST(request: Request): Promise<Response> {
  return handleParseRequest(request)
}
