"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientNamespace = exports.getAdminNamespace = exports.setClientNamespace = exports.setAdminNamespace = void 0;
let adminNamespace = null;
let clientNamespace = null;
const setAdminNamespace = (ns) => {
    adminNamespace = ns;
};
exports.setAdminNamespace = setAdminNamespace;
const setClientNamespace = (ns) => {
    clientNamespace = ns;
};
exports.setClientNamespace = setClientNamespace;
const getAdminNamespace = () => adminNamespace;
exports.getAdminNamespace = getAdminNamespace;
const getClientNamespace = () => clientNamespace;
exports.getClientNamespace = getClientNamespace;
