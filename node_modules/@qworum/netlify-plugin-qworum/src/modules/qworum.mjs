/**
 * @file   Implements the code of Qworum's build plugin.
 * @see    {@link https://docs.netlify.com/integrations/build-plugins/create-plugins/}
 * @author Doğa Armangil <d.armangil@qworum.net>
 */

import axios from 'axios'

// https://nodejs.org/api/http.html#httpgeturl-options-callback
// import process from 'node:process';

// http client https://www.npmjs.com/package/got
// import got from 'got';

// http client https://www.npmjs.com/package/axios
// import axios from 'axios';

// url of the list of the entitled websites
const domainEntitlementsUrl = new URL(
  'https://qworum.net/semantic/domain-entitlements.jsonld',
)

/**
 * Represents a DNS domain entitlement.
 */
class QworumEntitlement {
  constructor(entitlementObject) {
    this.domain = entitlementObject.domain.toLowerCase()
    this.subdomainsCount =
      entitlementObject.subdomainsCount < 0
        ? 0
        : entitlementObject.subdomainsCount
  }
}

/**
 * Represents a set of DNS domain entitlements.
 */
class QworumEntitlements {
  /**
   * @param {Object} entitlementsObject - A JSON object such as https://qworum.net/semantic/domain-entitlements.jsonld .
   */
  constructor(entitlementsObject) {
    // TODO: check arguments more thoroughly
    // console.debug(entitlementsObject)
    if (!(entitlementsObject.domainEntitlement instanceof Array))
      entitlementsObject.domainEntitlement = [
        entitlementsObject.domainEntitlement,
      ]

    // console.debug('building entitlement object from:', entitlementsObject)

    this.entitlements = entitlementsObject.domainEntitlement.map(
      (e) => new QworumEntitlement(e),
    )
  }

  /**
   * Decides to deploy a website, or not.
   * @param {(string | undefined)} domain - A DNS domain.
   * @returns {boolean}
   */
  domainIsEntitled(domain) {
    if (!domain) return true
    const entitlement = this.entitlements.find(
      (e) =>
        e.domain === domain ||
        (domain.endsWith(`.${e.domain}`) && e.subdomainsCount > 0),
    )

    return !!entitlement
  }

  /**
   * If Qworum is activated for this domain, returns the number of subdomains that can use Qworum.
   * Returns null if Qworum is not activated for this domain.
   * @param {string} domain - A DNS domain.
   * @returns {(number | null)}
   */
  subdomainsCountForDomain(domain) {
    const entitlement = this.entitlements.find((e) => e.domain === domain)
    if (!entitlement) {
      // throw new QworumEntitlementError(`Domain is not entitled: ${domain}`);
      return null
    }
    return entitlement.subdomainsCount
  }
}

/**
 * This error is thrown if Qworum is not activated for a website.
 */
class QworumEntitlementError extends Error {
  constructor(message) {
    super(message)
  }
}

/**
 * Build hooks for Netlify deployments.
 */
class Qworum {
  /**
   * Pre-build hook that checks if Qworum is activated for this website.
   * Throws a QworumEntitlementError if Qworum is not activated.
   * @static
   * @param {(URL | string)} url - URL of the website that is being deployed to Netlify.
   * @param {(QworumEntitlements | undefined)} testEntitlements - Entitlements to use during local testing.
   * @throws {(TypeError | QworumEntitlementError)}
   */
  static async onPreBuild(url, testEntitlements) {
    // Make sure url is a URL
    try {
      // console.info(`url is ${url}`);
      url = new URL(`${url}`)

      // check args
      if (!(url instanceof URL && ['http:', 'https:'].includes(url.protocol))) {
        throw new TypeError(`Bad URL argument: ${url}`)
      }
    } catch (error) {
      // invalid url (the build plugin is not being used in production, don't veto).
      // console.debug(`${error}`);
      return
    }

    let entitlements = testEntitlements

    try {
      // fetch the entitlements file
      const webResponse = entitlements
          ? null
          : await axios.get(domainEntitlementsUrl),
        entitlementsObject = entitlements ? null : webResponse.data

      if (entitlementsObject)
        entitlements = new QworumEntitlements(entitlementsObject)

      if (!entitlements.domainIsEntitled(url.hostname))
        throw new QworumEntitlementError(
          `${url.hostname} is not entitled to use Qworum.`,
        )
    } catch (error) {
      if (error instanceof QworumEntitlementError) throw error
    }
  }
}

export { Qworum, QworumEntitlements, QworumEntitlementError }
