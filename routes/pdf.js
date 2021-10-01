const express = require("express");
const pdf = require('html-pdf');
const router = express.Router();

router.post("/", (req, res) => {
    if (!req?.body?.html) {
        return res.status(406).send();
    }

    pdf.create(req.body.html).toStream((err, pdfStream) => {
        if (err) {
            console.err(err);
            return res.sendStatus(500);
        } else {
            pdfStream.on("end", () => {
                return res.end();
            });

            pdfStream.pipe(res);
        }
    });
});

module.exports = router;
