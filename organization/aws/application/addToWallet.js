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
      '/crypto-config/peerOrganizations/aws.sms.at/users/User1@aws.sms.at'
    )
    const cert = fs
      .readFileSync(
        path.join(credPath, '/msp/signcerts/User1@aws.sms.at-cert.pem')
      )
      .toString()
    const key = fs
      .readFileSync(
        path.join(
          credPath,
          '/msp/keystore/b573776bd802cdbe2e76c0c9debc075aa6c9112ddbf531d20607b543e23b3135_sk'
        )
      )
      .toString()

    // Load credentials into wallet
    const identityLabel = 'User1@aws.sms.at'
    const identity = X509WalletMixin.createIdentity('AwsMSP', cert, key)

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
