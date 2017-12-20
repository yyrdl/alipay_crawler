/**
 * Created by jason on 2017/12/20.
 */
const diskdb = require("diskdb");
const path = require("path");

const db = diskdb.connect(path.join(__dirname,"../db"),["session"]);

module.exports = db;

db.session.update("")
