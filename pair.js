import express from 'express';
import fs from 'fs';
import { delay, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, useMultiFileAuthState, default as makeWASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import { upload } from './mega.js';

const router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function DanuwaPair() {
        const { state, saveCreds } = await useMultiFileAuthState(`/tmp/session`);

        try {
            let DanuwaPairWeb = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!DanuwaPairWeb.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await DanuwaPairWeb.requestPairingCode(num);
                if (!res.headersSent) {
                    return res.json({ code });
                }
            }

            DanuwaPairWeb.ev.on('creds.update', saveCreds);

            DanuwaPairWeb.ev.on("connection.update", async (s) => {
                const { connection } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        const auth_path = `/tmp/session/`;
                        const user_jid = jidNormalizedUser(DanuwaPairWeb.user.id);

                        function randomMegaId(length = 6, numberLength = 4) {
                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);
                        const sid = mega_url.replace('https://mega.nz/file/', '');

                        await DanuwaPairWeb.sendMessage(user_jid, { text: sid });

                    } catch (e) {
                        console.error("Upload failed:", e);
                    }

                    await delay(100);
                    removeFile('/tmp/session');
                }
            });

        } catch (err) {
            console.error("Pair error:", err);
            if (!res.headersSent) {
                return res.json({ code: "Service Unavailable" });
            }
            removeFile('/tmp/session');
        }
    }

    return await DanuwaPair();
});

process.on('uncaughtException', (err) => {
    console.error('Caught exception: ' + err);
});

export default router;
