// TODO Check the tsd to find out what is actually [T] instead of T[]
import { parseXML } from './helpers/xml'
import { checkStatusCodes, checkTime } from './checks'
import * as url from 'url'
import { Signature } from './helpers/saml-types'

export namespace SAMLLoginResponse {
    export type Root = {
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

    export type Assertion = {
        $: {
            ID: string
            IssueInstant: string
            Version: string
            xmlns: string
        }
        Issuer: string[]
        Signature: Signature[]
        Subject: Subject[]
        Conditions: Conditions[]
        AttributeStatement: { Attribute: Attribute }[]
    }

    export type Attribute = {
        $: { Name: string }
        AttributeValue: [string]
    }

    export type Conditions = {
        $: {
            NotBefore: string
            NotOnOrAfter: string
        }
        AudienceRestriction: { Audience: string[] }[]
    }

    export type Subject = {
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

type LoginResponse<T> = {
    id: string
    inResponseTo: string
    issuer: string
    statusCodes: string[]
    assertions: {
        issuer: string
        sessionIndex: string
        notBefore: Date
        notOnOrAfter: Date
        audience: string
        attributes: { [key: string]: string } & { [key in keyof T]: string }
    }[]
}

export async function extract<T extends { [key: string]: string }>(
    response: string,
    attributeMapping: T
): Promise<LoginResponse<T>> {
    const jsonResponse = await parseXML<SAMLLoginResponse.Root>(response)

    const parsedResponse = {
        id: jsonResponse.$.ID,
        inResponseTo: jsonResponse.$.InResponseTo,
        issuer: jsonResponse.Issuer[0]._,
        statusCodes: jsonResponse.Status[0].StatusCode.map(statusCode => statusCode.$.Value),
        assertions: jsonResponse.Assertion.map((assertion: any) => ({
            issuer: assertion.Issuer[0],
            sessionIndex: assertion.AuthnStatement[0].$.SessionIndex,
            notBefore: new Date(assertion.Conditions[0].$.NotBefore),
            notOnOrAfter: new Date(assertion.Conditions[0].$.NotOnOrAfter),
            audience: assertion.Conditions[0].AudienceRestriction[0].Audience[0],
            attributes: assertion.AttributeStatement[0].Attribute.reduce(
                (accum: { [key: string]: string }, attribute: SAMLLoginResponse.Attribute) => {
                    const mappedName = attributeMapping[attribute.$.Name]

                    if (mappedName) accum[mappedName] = attribute.AttributeValue[0]
                    else accum[attribute.$.Name] = attribute.AttributeValue[0]

                    return accum
                },
                {}
            )
        }))
    }

    return parsedResponse
}

type CheckOptions = {
    issuer: string
    audience: string
    strictTimeCheck: boolean
}

export function checkResponse<T>(response: LoginResponse<T>, options: CheckOptions) {
    // Check status codes
    if (!checkStatusCodes(response.statusCodes)) throw new Error('Invalid status code')

    // Check the issuer
    if (response.issuer !== options.issuer) throw new Error('Unknown issuer')

    // Prefix the sp id with spn: if it's not a url - this is what microsoft seems to do so let's duplicate for now
    // If this leads to issues then we can make the prefix a parameter
    const expectedAudience = url.parse(options.audience).hostname ? options.audience : 'spn:' + options.audience

    response.assertions.forEach(assertion => {
        // Check the audience
        if (assertion.audience !== expectedAudience) throw new Error('Unexpected audience')

        // Check the time - dates are ISO according to spec
        const beforeDate = assertion.notBefore
        const afterDate = assertion.notOnOrAfter
        if (!checkTime(beforeDate, afterDate, options.strictTimeCheck)) throw new Error('Assertion expired')
    })
}
