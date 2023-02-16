enum HTTPtypes {
  /** HTTP Request Type */ options = 'OPTIONS',
  /** HTTP Request Type */ delete = 'DELETE',
  /** HTTP Request Type */ patch = 'PATCH',
  /** HTTP Request Type */ post = 'POST',
  /** HTTP Request Type */ head = 'HEAD',
  /** HTTP Request Type */ put = 'PUT',
  /** HTTP Request Type */ get = 'GET',
  /** Internal Request Type */ static = 'STATIC',
  /** Internal Request Type */ staticdir = 'STATICDIR'
}

export default HTTPtypes

export type Types =
  | 'OPTIONS'
  | 'DELETE'
  | 'PATCH'
  | 'POST'
  | 'HEAD'
  | 'PUT'
  | 'GET'
  | 'STATIC'
  | 'STATICDIR'