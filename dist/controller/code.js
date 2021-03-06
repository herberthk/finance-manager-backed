"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCode = exports.createCode = void 0;
const Security_1 = __importDefault(require("../modals/Security"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const helpers_1 = require("../helpers/helpers");
exports.createCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.is('application/json')) {
        return res.json("Expects 'application/json'");
    }
    try {
        const { id } = (yield helpers_1.getMe(req));
        const { email } = req.body;
        if (!email) {
            return res.status(200).json({
                success: false,
                error: 'Action failed',
            });
        }
        const user = (yield Security_1.default.findOne({
            email,
            uid: id,
        }).lean());
        const newCode = helpers_1.generateCode(8);
        if (user) {
            yield Security_1.default.updateOne({ uid: id }, { code: newCode, email });
        }
        else {
            yield Security_1.default.create({ code: newCode, email, uid: id });
        }
        try {
            const transporter = yield nodemailer_1.default.createTransport({
                host: process.env.SMTP,
                port: 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
            yield transporter.sendMail({
                from: '"Finance manager 👻" <info@netbritz.com>',
                to: email,
                subject: `FINANCE MANAGER SECURITY CODE`,
                html: `<p><b>Hello ${email},</b> your security code to login into finance manager system is <b>${newCode}</b>. Note this code is valid for 24hrs</p>`,
            });
        }
        catch (error) {
            console.log(error);
        }
        return res.status(201).json({
            success: true,
            info: 'Security code sent',
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error,
        });
    }
});
exports.verifyCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.is('application/json')) {
        return res.json("Expects 'application/json'");
    }
    try {
        const { id } = (yield helpers_1.getMe(req));
        const { email, code } = req.body;
        if (!code) {
            return res.status(200).json({
                success: false,
                error: 'Activation code is required',
            });
        }
        if (!email) {
            return res.status(200).json({
                success: false,
                error: 'Action failed',
            });
        }
        const activationCode = yield Security_1.default.findOne({
            code,
            uid: id,
            email,
        });
        if (!activationCode) {
            return res.status(200).json({
                success: false,
                error: 'Activation code is invalid',
            });
        }
        yield Security_1.default.deleteOne({ uid: id });
        return res.status(201).json({
            success: true,
            info: 'Security code accepted',
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error,
        });
    }
});
