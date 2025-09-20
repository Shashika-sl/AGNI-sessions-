router.get("/code", async (req, res) => {
  let num = req.query.number;

  if (!num) {
    return res.status(400).json({ error: "❌ Please provide ?number=947XXXXXXXX" });
  }

  async function DanuwaPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let DanuwaPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!DanuwaPairWeb.authState.creds.registered) {
        num = num.replace(/[^0-9]/g, "");
        const code = await DanuwaPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          return res.json({ code }); // ✅ JSON format
        }
      }

      DanuwaPairWeb.ev.on("creds.update", saveCreds);
      DanuwaPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(DanuwaPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const sid = mega_url.replace("https://mega.nz/file/", "");
            await DanuwaPairWeb.sendMessage(user_jid, {
              text: `✅ Session Created\n🔗 ${sid}`,
            });

            console.log("✅ Session uploaded to Mega:", mega_url);
          } catch (e) {
            console.log("Error while sending session:", e.message);
          }
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output?.statusCode !== 401
        ) {
          await delay(10000);
          DanuwaPair();
        }
      });
    } catch (err) {
      console.log("Pair service error:", err.message);
      removeFile("./session");
      if (!res.headersSent) {
        return res.json({ code: "❌ Service Unavailable" });
      }
    }
  }

  return await DanuwaPair();
});
