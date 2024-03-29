// TODO Check the tsd to find out what is actually [T] instead of T[]
import { parseXML } from './helpers/xml'
import { checkStatusCodes, checkTime } from './checks'
import * as url from 'url'
import { Signature } from './helpers/saml-types'

export namespace SAMLLoginResponse {
    export interface Root {
        $: {
            Destination: string
            ID: string
            InResponseTo: string
            IssueInstant: string
            Version: string
        }
        Issuer: { _: string }[]
        Status: { StatusCode: { $: { Value: string } }[] }[]
        Assertion: Assertion[]
    }

    export interface Assertion {
        $: {
            ID: string
            IssueInstant: string
            Version: string
            xmlns: string
        }
        Issuer: { _: string }[]
        Signature: Signature[]
        Subject: Subject[]
        Conditions: Conditions[]
        AuthnStatement: { $: { SessionIndex: string } }[]
        AttributeStatement: { Attribute: Attribute[] }[]
    }

    export interface Attribute {
        $: { Name: string }
        AttributeValue: [{ _: string }]
    }

    export interface Conditions {
        $: {
            NotBefore: string
            NotOnOrAfter: string
        }
        AudienceRestriction: { Audience: { _: string }[] }[]
    }

    export interface Subject {
        NameID: { _: string }[]
        SubjectConfirmation: {
            $: { Method: string }
            SubjectConfirmationData: {
                $: {
                    InResponseTo: string
                    NotOnOrAfter: string
                    Recipient: string
                }
            }
        }[]
    }
}

export interface LoginResponse {
    id: string
    inResponseTo: string
    issuer: string
    statusCodes: string[]
    assertions: {
        subject: string
        issuer: string
        sessionIndex: string
        notBefore: Date
        notOnOrAfter: Date
        audience: string
        attributes: { [key: string]: string }
    }[]
}

interface CheckOptions {
    issuer: string
    audience: string
    strictTimeCheck: boolean
}

export async function extract<T extends { [key: string]: string }>(
    response: string,
    attributeMapping: T,
    options: CheckOptions
): Promise<LoginResponse> {
    const jsonResponse = await parseXML<SAMLLoginResponse.Root>(response)

    const statusCodes = jsonResponse.Status[0].StatusCode.map(statusCode => statusCode.$.Value)

    // Check status codes
    if (!checkStatusCodes(statusCodes)) throw new Error('Invalid status code')

    const parsedResponse = {
        id: jsonResponse.$.ID,
        inResponseTo: jsonResponse.$.InResponseTo,
        issuer: jsonResponse.Issuer[0]._,
        statusCodes,
        assertions: jsonResponse.Assertion.map(assertion => ({
            issuer: assertion.Issuer[0]._,
            sessionIndex: assertion.AuthnStatement[0].$.SessionIndex,
            notBefore: new Date(assertion.Conditions[0].$.NotBefore),
            notOnOrAfter: new Date(assertion.Conditions[0].$.NotOnOrAfter),
            audience: assertion.Conditions[0].AudienceRestriction[0].Audience[0]._,
            subject: assertion.Subject[0].NameID[0]._,
            attributes: !assertion.AttributeStatement
                ? // Default to an empty object if there are no attributes
                  <LoginResponse['assertions'][0]['attributes']>{}
                : assertion.AttributeStatement[0].Attribute.reduce((accum, attribute: SAMLLoginResponse.Attribute) => {
                      const mappedName = attributeMapping[attribute.$.Name]

                      if (mappedName) accum[mappedName] = attribute.AttributeValue[0]._
                      else accum[attribute.$.Name] = attribute.AttributeValue[0]._

                      return accum
                  }, <LoginResponse['assertions'][0]['attributes']>{})
        }))
    }

    // Check the issuer
    if (parsedResponse.issuer !== options.issuer) throw new Error('Unknown issuer')

    // Prefix the sp id with spn: if it's not a url - this is what microsoft seems to do so let's duplicate for now
    // If this leads to issues then we can make the prefix a parameter
    const expectedAudience = url.parse(options.audience).hostname ? options.audience : 'spn:' + options.audience

    parsedResponse.assertions.forEach(assertion => {
        // Check the audience
        if (assertion.audience !== expectedAudience) throw new Error('Unexpected audience')

        // Check the time - dates are ISO according to spec
        const beforeDate = assertion.notBefore
        const afterDate = assertion.notOnOrAfter
        if (!checkTime(beforeDate, afterDate, options.strictTimeCheck)) throw new Error('Assertion expired')
    })

    return parsedResponse
}
