require("dotenv").config();
const https = require("https");
const axios = require("axios");
const { WebClient, LogLevel } = require("@slack/web-api");

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

  if (
    !body.event.bot_id &&
    body.event.client_msg_id &&
    body.event.type === "message"
  ) {
    var text = `<@${body.event.user}> isn't AWS Lambda awesome?`;

    const url = "https://slack.com/api/chat.postMessage";
    const res = await axios.post(
      url,
      { channel: body.event.channel, text: text },
      {
        headers: {
          authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );
    console.log("RESULT: ", res.data);
  }
}
module.exports = { main };
