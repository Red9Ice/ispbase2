"use strict";
/**
 * @file: seed.ts
 * @description: Seed default admin user and permissions.
 * @dependencies: users, permissions repositories, bcryptjs
 * @created: 2026-01-27
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAuth = seedAuth;
const bcrypt = __importStar(require("bcryptjs"));
const permission_dto_1 = require("../permissions/dto/permission.dto");
const ADMIN_EMAIL = 'admin@imlight.local';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_DISPLAY = 'Administrator';
async function seedAuth(users, permissions) {
    const existing = await users.getByEmail(ADMIN_EMAIL);
    if (existing)
        return;
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = await users.add({
        email: ADMIN_EMAIL,
        passwordHash: hash,
        displayName: ADMIN_DISPLAY,
    });
    permissions.setForUser(admin.id, [...permission_dto_1.ALL_PERMISSIONS]);
}
