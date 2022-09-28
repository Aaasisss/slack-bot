async function main(event) {
  console.log(JSON.stringify(event));
  return {
    body: "this api works",
    statusCode: 200,
  };
}

module.exports = { main };
