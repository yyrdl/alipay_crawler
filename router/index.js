/**
 * Created by jason on 2017/12/20.
 */
const express = require("express");

const router = express.Router();

const controller = require("../controller");

const service = require("../service");

router.get("/qr_init",controller.wrap(service.init));

router.get("/qr_status",controller.wrap(service.processStatus));

router.get("/query",controller.wrap(service.query));


module.exports = router;