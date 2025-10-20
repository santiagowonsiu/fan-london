import localtunnel from "localtunnel";

(async () => {
  const tunnel = await localtunnel({ port: 4000 });
  console.log("TUNNEL_URL=" + tunnel.url);
  tunnel.on("close", () => process.exit(0));
})();
