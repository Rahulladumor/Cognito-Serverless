//const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
const { callbackify } = require('util');
const { stat } = require('fs');
global.fetch = require('node-fetch');


AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
})

const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
const appClient = process.env.CLIENT_APP_ID
const poolId = process.env.POOL_ID


module.exports.createCognitoUser = async (event) => {
  const attr = JSON.parse(event.body);
  let params = {
    UserPoolId: poolId,
    Username: attr.username,
    MessageAction: "SUPPRESS",
    TemporaryPassword: attr.password,
    UserAttributes: [
      {
        Name: "email",
        Value: attr.email
      },
      {
        Name: "name",
        Value: attr.name
      },
      {
        Name: "email_verified",
        Value: "true"
      }
    ]
  };
  return await cognito
    .adminCreateUser(params)
    .promise()
    .then(data => {
      let params = {
        AuthFlow: "ADMIN_NO_SRP_AUTH",
        ClientId: appClient,
        UserPoolId: poolId,
        AuthParameters: {
          USERNAME: attr.username,
          PASSWORD: attr.password
        }
      };
      return cognito.adminInitiateAuth(params).promise();
    })
    .then(async data => {
      let challengeResponseData = {
        USERNAME: attr.username,
        NEW_PASSWORD: attr.password
      };
      let params = {
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: appClient,
        UserPoolId: poolId,
        ChallengeResponses: challengeResponseData,
        Session: data.Session
      };
      const result = await cognito.adminRespondToAuthChallenge(params).promise()
      return res(200,result)
    })
}


module.exports.Login = async (event) => {
  try {
    const attr = JSON.parse(event.body);

    let params = {
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      ClientId: appClient,
      UserPoolId: poolId,
      AuthParameters: {
        USERNAME: attr.username,
        PASSWORD: attr.password
      }
    };
    const result = await cognito.adminInitiateAuth(params).promise();
    return res(200,result)
  } catch (err) {
    return res(401,err)
  }
}

module.exports.LogOut = async (event) => {
  try {
    const token = event.headers.token.replace('Bearer ', '');
    console.log(token);
    await cognito.globalSignOut({
      AccessToken: token
    }).promise()
    return res(200,"Successfully Logout..!")
  } catch (err) {
    return res(401,err)
  }

}

module.exports.getUser = async (event) => {
  try {
    const token = event.headers.token.replace('Bearer ', '');
    let data = await cognito.getUser({
      AccessToken: token
    }).promise()
    console.log(data)
    return res(200,data)
  } catch (err) {
    return res(401,err)
  }
}

const res = function(statusCode,body) {
  return{
    statusCode:statusCode,
    body: JSON.stringify(body)
  }
}

module.exports.hello = async (event, context) => {
  try {

    const appClient = process.env.CLIENT_APP_ID
    const poolId = process.env.POOL_ID
    console.log(appClient)
    console.log(poolId)
    console.log('Event', event)
    console.log('event body without parsing', event.body)
    console.log('event body with parsing', JSON.parse(event.body))
    const abc = JSON.parse(event.body)
    return res(200,abc)
  } catch (error) {
    console.log(error)
    return error
  }

}
// exports.validate_token = function(req, res){
//   let validate = authService.Validate(req.body.token,function(err, result){
//       if(err)
//           res.send(err.message);
//       res.send(result);
//   })
// }