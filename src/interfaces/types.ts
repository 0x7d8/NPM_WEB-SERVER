enum HTTPtypes {
  /** HTTP Request Type */ options = 'OPTIONS',
  /** HTTP Request Type */ delete = 'DELETE',
  /** HTTP Request Type */ patch = 'PATCH',
  /** HTTP Request Type */ post = 'POST',
  /** HTTP Request Type */ put = 'PUT',
  /** HTTP Request Type */ get = 'GET',
  /** Internal Request Type */ static = 'STATIC'
}

export default HTTPtypes

export type types =
  'OPTIONS' |
  'DELETE' |
  'PATCH' |
  'POST' |
  'PUT' |
  'GET' |
  'STATIC'