import { Signature } from './helpers/saml-types'
import { parseXML } from './helpers/xml'

export namespace SAMLLogoutRequest {
    export type Root = {
        $: {
            ID: string
            Version: string
            IssueInstant: string
            Destination: string
        }
        Issuer: { _: string }[]
        NameID: {
            _: string
            $: {
                SPNameQualifier: string
                Format: string
            }
        }[]
        Signature: Signature[]
    }
}

type LogoutRequest = {
    id: string
    issueInstant: string
    destination: string
    issuer: string
    names: string[]
}

export async function extract(response: string): Promise<LogoutRequest> {
    const jsonResponse = await parseXML<SAMLLogoutRequest.Root>(response)

    const parsedResponse = {
        id: jsonResponse.$.ID,
        issueInstant: jsonResponse.$.IssueInstant,
        destination: jsonResponse.$.Destination,
        issuer: jsonResponse.Issuer[0]._,
        names: jsonResponse.NameID.map(NameId => NameId._)
    }

    return parsedResponse
}
