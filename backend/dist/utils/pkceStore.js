"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PKCEStore = void 0;
const pkceStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of pkceStore.entries()) {
        if (now - value.createdAt > 10 * 60 * 1000) {
            pkceStore.delete(key);
        }
    }
}, 10 * 60 * 1000);
exports.PKCEStore = {
    set(state, data) {
        pkceStore.set(state, {
            ...data,
            createdAt: Date.now(),
        });
    },
    get(state) {
        return pkceStore.get(state);
    },
    delete(state) {
        return pkceStore.delete(state);
    },
};
//# sourceMappingURL=pkceStore.js.map