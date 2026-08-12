/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { DefaultEventsMap, Namespace } from "socket.io";

let adminNamespace: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null = null;
let clientNamespace: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null = null;

export const setAdminNamespace = (ns: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    adminNamespace = ns;
};

export const setClientNamespace = (ns: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    clientNamespace = ns;
};

export const getAdminNamespace = () => adminNamespace;

export const getClientNamespace = () => clientNamespace;
