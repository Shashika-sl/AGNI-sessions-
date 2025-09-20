import express from "express";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";

const router = express.Router();

router.post("/pair", async (req, res) => {
  try {
    let num = req.body.num;

    // 🛠 Number format fix
    if (!num.startsWith("+")) {
      num = "+" + num.replace(/[^0-9]/g, "");
    }

    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const sock = makeWASocket({ auth: state });

    const code = await sock.requestPairingCode(num);
    await saveCreds();

    return res.json({ status: true, code });
  } catch (err) {
    console.error("Pair Error:", err);
    return res.json({ status: false, error: err.message });
  }
});

export default router;
