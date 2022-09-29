require("dotenv").config();

async function main(event, context) {
  
  console.log(event);

  //event is an object, however, the body of the event is in JSON,
  //so we need to convert body into object, not the whole event
  const body = JSON.parse(event.body);

  if (body.type === "url_verification") {
    if (body.token === process.env.VERIFICATION_TOKEN) {
      return {
        statusCode: 200,
        body: body.challenge,
      };
    } else {
      return {
        statusCode: 400,
        body: "verification failed",
      };
    }
    
  }
}
module.exports = { main };

