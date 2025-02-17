"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractNewsCrawler = void 0;
class AbstractNewsCrawler {
    constructor(uri) {
        if (this.constructor === AbstractNewsCrawler) {
            throw new Error("Abstract class cannot be instantiated");
        }
        this.uri = uri;
    }
}
exports.AbstractNewsCrawler = AbstractNewsCrawler;
