"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const chai_1 = require("chai");
const service_provider_1 = require("../src/service-provider");
const querystring = require("querystring");
const helpers_1 = require("../src/helpers");
const testCert = fs.readFileSync(path.resolve('./spec/resources/cert.pem'), 'utf8');
const testKey = fs.readFileSync(path.resolve('./spec/resources/key.pem'), 'utf8');
function validateSchema(schema, xml) {
    return new Promise(resolve => {
        schema.validate(xml, (technicalErrors, validationErrors) => {
            chai_1.assert.isNull(technicalErrors, `Technical errors: ${technicalErrors}`);
            chai_1.assert.isNull(validationErrors, `Validation errors: ${validationErrors}`);
            resolve();
        });
    });
}
describe('SAMLProvider', function () {
    const options = {
        sp: {
            id: 'test-sp',
            assertionUrl: 'http://localhost:7000/sp/login',
            singleLogoutUrl: 'http://localhost:7000/sp/logout',
            signature: {
                algorithm: 'sha256',
                certificate: testCert,
                key: testKey
            }
        },
        idp: {
            id: 'test-idp',
            loginUrl: 'http://localhost:7000/idp/requestLogin',
            signature: {
                certificate: testCert,
                algorithm: 'sha256',
                allowedCertificates: []
            }
        },
        getUUID: () => 'test-uuid'
    };
    it('should generate valid metadata', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new service_provider_1.default(options);
            yield provider.init();
            const metadata = provider.getMetadata();
            yield validateSchema(yield provider.metadataShema, metadata);
        });
    });
    it('should generate a valid login request', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new service_provider_1.default(options);
            yield provider.init();
            const relayState = 'someState';
            const redirectURL = yield provider.buildLoginRequestRedirectURL(relayState);
            const parts = redirectURL.split('?');
            chai_1.assert.equal(parts[0], options.idp.loginUrl, 'Login url must be the one provided in the options');
            const { SAMLRequest, RelayState } = querystring.parse(parts[1]);
            chai_1.assert.equal(RelayState, relayState, 'Relay states do not match');
            chai_1.assert.isDefined(SAMLRequest, 'Query should have a SAMLRequest attribute');
            const request = helpers_1.fromBase64(SAMLRequest);
            yield validateSchema(yield provider.protocolSchema, request);
        });
    });
});
//# sourceMappingURL=service-provider.js.map