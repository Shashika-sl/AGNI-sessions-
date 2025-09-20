import express from 'express';
import fs from 'fs';
import { exec } from 'child_process';
import pino from 'pino';
import {
    makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} from '@whiskeysockets/baileys';
import { upload } from './mega.js';

const router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    let num = req.query.number;

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
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await DanuwaPairWeb.requestPairingCode(num);
                if (!res.headersSent) {
                    return res.send({ code });
                }
            }

            DanuwaPairWeb.ev.on('creds.update', saveCreds);
            DanuwaPairWeb.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === "open") {
                    try {
                        await delay(10000);
                        const sessionDanuwa = fs.readFileSync('./session/creds.json');

                        const auth_path = './session/';
                        const user_jid = jidNormalizedUser(DanuwaPairWeb.user.id);

                        function randomMegaId(length = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                        const mega_url = await upload(
                            fs.createReadStream(auth_path + 'creds.json'),
                            `${randomMegaId()}.json`
                        );

                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const sid = string_session;

                        await DanuwaPairWeb.sendMessage(user_jid, { text: sid });

                    } catch (e) {
                        console.log("Error while sending session:", e.message);
                    }

                    await delay(100);
                    removeFile('./session');
                    process.exit(0);

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output?.statusCode !== 401) {
                    await delay(10000);
                    DanuwaPair();
                }
            });
        } catch (err) {
            console.log("Pair service error:", err.message);
            removeFile('./session');
            if (!res.headersSent) {
                return res.send({ code: "Service Unavailable" });
            }
        }
    }

    return await DanuwaPair();
});

process.on('uncaughtException', (err) => {
    console.log('Caught exception: ' + err.message);
});

export default router;
