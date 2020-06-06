/*
 *  SPDX-License-Identifier: Apache-2.0
 */

'use strict'

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs')
const { FileSystemWallet, X509WalletMixin } = require('fabric-network')
const path = require('path')

// const fixtures = path.resolve(__dirname, '../../../../basic-network');
const fixtures = path.resolve(__dirname, '../../../network')

// A wallet stores a collection of identities
const wallet = new FileSystemWallet('../identity/user/isabella/wallet')

async function main() {
  // Main try/catch block
  try {
    // Identity to credentials to be stored in the wallet
    const credPath = path.join(
      fixtures,
      '/crypto-config/peerOrganizations/univie.sms.at/users/User1@univie.sms.at'
    )
    const cert = fs
      .readFileSync(
        path.join(credPath, '/msp/signcerts/User1@univie.sms.at-cert.pem')
      )
      .toString()
    const key = fs
      .readFileSync(
        path.join(
          credPath,
          '/msp/keystore/24bdd46525509bebba108f68470270d8053a73cffda75cc8155c205ac6ccc676_sk'
        )
      )
      .toString()

    // Load credentials into wallet
    const identityLabel = 'User1@univie.sms.at'
    const identity = X509WalletMixin.createIdentity('UnivieMSP', cert, key)

    await wallet.import(identityLabel, identity)
  } catch (error) {
    console.log(`Error adding to wallet. ${error}`)
    console.log(error.stack)
  }
}

main()
  .then(() => {
    console.log('done')
  })
  .catch((e) => {
    console.log(e)
    console.log(e.stack)
    process.exit(-1)
  })
