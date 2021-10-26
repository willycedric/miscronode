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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var dotenv = require("dotenv");
var typeorm_1 = require("typeorm");
var product_1 = require("./entity/product");
var amqp = require("amqplib/callback_api");
dotenv.config();
(0, typeorm_1.createConnection)()
    .then(function (db) {
    var productRepository = db.getRepository(product_1.Product);
    amqp.connect(process.env.AMQP_URL, function (err1, connection) {
        if (err1) {
            throw err1;
        }
        connection.createChannel(function (err2, channel) {
            if (err2)
                throw err2;
            channel.assertQueue('product_created', { durable: false });
            channel.assertQueue('product_updated', { durable: false });
            channel.assertQueue('product_deleted', { durable: false });
            var app = express();
            app.use(cors({
                origin: ['http://localhost:3000']
            }));
            app.use(express.json());
            channel.consume("product_created", function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var evtProduct, product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evtProduct = JSON.parse(msg.content.toString('utf-8'));
                            product = new product_1.Product();
                            product.admin_id = parseInt(evtProduct.id);
                            product.title = evtProduct.title;
                            product.likes = evtProduct.likes;
                            product.img = evtProduct.img;
                            return [4 /*yield*/, productRepository.save(product)];
                        case 1:
                            _a.sent();
                            console.log('product created');
                            return [2 /*return*/];
                    }
                });
            }); }, { noAck: true });
            channel.consume("product_updated", function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var evtProduct, product, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evtProduct = JSON.parse(msg.content.toString('utf-8'));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, productRepository.findOne({ admin_id: parseInt(evtProduct.id) })];
                        case 2:
                            product = _a.sent();
                            productRepository.merge(product, {
                                title: evtProduct.title,
                                img: evtProduct.img,
                                likes: evtProduct.likes
                            });
                            return [4 /*yield*/, productRepository.save(product)];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            err_1 = _a.sent();
                            console.log(err_1);
                            return [3 /*break*/, 5];
                        case 5:
                            console.log('product updated');
                            return [2 /*return*/];
                    }
                });
            }); }, { noAck: true });
            channel.consume("product_deleted", function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var admin_id, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            admin_id = parseInt(JSON.parse(msg.content.toString('utf-8')));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, productRepository.delete({ admin_id: admin_id })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            err_2 = _a.sent();
                            console.log(err_2);
                            return [3 /*break*/, 4];
                        case 4:
                            console.log('product delete');
                            return [2 /*return*/];
                    }
                });
            }); }, { noAck: true });
            app.get('/api/products', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var products, err_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, productRepository.find()];
                        case 1:
                            products = _a.sent();
                            return [2 /*return*/, res.status(200).send(products)];
                        case 2:
                            err_3 = _a.sent();
                            console.log(err_3);
                            return [2 /*return*/, res.status(500).send({})];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            var port = process.env.SERVER_PORT;
            app.listen(port, function () {
                console.log("Server is listening on port " + port);
            });
            process.on('beforeExit', function () {
                console.log('closing');
                connection.close();
            });
        });
    });
});
