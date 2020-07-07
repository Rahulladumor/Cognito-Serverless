let res = function(statusCode,body) {
  return{
    statusCode:statusCode,
    body: JSON.stringify(body)
  }
}

console.log(res(200, 'hello'))