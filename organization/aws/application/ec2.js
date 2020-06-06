/* eslint-disable indent */
/*
SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to issue commercial paper
 * 5. Submit transaction
 * 6. Process response
 */

'use strict'

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs')
const yaml = require('js-yaml')
const { FileSystemWallet, Gateway } = require('fabric-network')

// A wallet stores a collection of identities for use
//const wallet = new FileSystemWallet('../user/isabella/wallet');
const wallet = new FileSystemWallet('../identity/user/isabella/wallet')

async function createService(contract, serviceInfo) {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - 30 * 60000)

  console.log(startTime)
  console.log(endTime)

  const promisedAvailability = '0.95'

  try {
    await contract.submitTransaction(
      'createService',
      serviceInfo.name,
      serviceInfo.dimensionName,
      serviceInfo.dimensionValue,
      serviceInfo.region,
      serviceInfo.accessKeyId,
      serviceInfo.secretAccessKey,
      promisedAvailability,
      startTime.toISOString(),
      endTime.toISOString()
    )
    console.log('SERVICE CREATED')
  } catch (error) {
    console.log(`ERROR WHILE CREATING SERVICE: ${error}`)
    console.log(error.stack)
  }
}

async function getService(contract, name) {
  try {
    let service = await contract.evaluateTransaction('getService', name)
    let response = JSON.parse(service)
    console.log(response)
    console.log('DATA FROM THE LEDGER:' + JSON.stringify(response.data))
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING SERVICE: ${error}`)
    console.log(error.stack)
  }
}

async function getMetricsfromOracle(contract, name) {
  try {
    let service = await contract.evaluateTransaction(
      'getMetricsfromOracle',
      name
    )
    let response = JSON.parse(service)
    console.log(response)
    console.log('METRICS RECEIVED')
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING METRICS FROM ORACLE: ${error}`)
    console.log(error.stack)
  }
}

async function getServiceHistory(contract, name) {
  try {
    let service = await contract.evaluateTransaction('getStateHistory', name)
    let response = JSON.parse(service)

    console.log(response[0].Record.data)

    console.log('METRICS RECEIVED')
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING SERVICE HISTORY: ${error}`)
    console.log(error.stack)
  }
}

async function getDataHistoryofService(contract, name) {
  try {
    let service = await contract.evaluateTransaction(
      'getDataHistoryofService',
      name
    )
    let response = JSON.parse(service)
    //console.log('RESULTS IN SERVICE-LIST IS TYPE OF: ' + typeof response);
    console.log(response)
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING DATA HISTORY: ${error}`)
    console.log(error.stack)
  }
}
async function updateService(contract, serviceKey) {
  try {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 30 * 60000)

    let service = await contract.submitTransaction(
      'updateService',
      serviceKey,
      startTime.toISOString(),
      endTime.toISOString()
    )

    let response = JSON.parse(service)
    console.log(response)
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING DATA HISTORY: ${error}`)
    console.log(error.stack)
  }
}

async function getAllKeys(contract) {
  try {
    let service = await contract.evaluateTransaction('getAllKeys')
    let response = JSON.parse(service)
    console.log(response)
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING DATA HISTORY: ${error}`)
    console.log(error.stack)
  }
}

async function getStateByRange(contract, startKey, endKey) {
  try {
    let service = await contract.evaluateTransaction(
      'getStateByRange',
      startKey,
      endKey
    )
    let response = JSON.parse(service)
    let record = response[1].Record
    console.log(record)

    console.log('let bufferOriginal = Buffer.from(buffer1.data)')
    let bufferOriginal = Buffer.from(record.toString('utf8'))
    console.log(bufferOriginal)

    console.log('let original = bufferOriginal.toString()')
    let original = bufferOriginal.toString()
    console.log(original)
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING DATA HISTORY: ${error}`)
    console.log(error.stack)
  }
}

async function getAllStates(contract) {
  try {
    let service = await contract.evaluateTransaction('getAllStates')
    const response = JSON.parse(service)
    console.log('THIS IS RESPONSE = JSON.PARSE(STATE)')
    console.log(response)

    console.log('THIS IS let buffer1 = response[0].value.value')
    let buffer1 = response[0].value.value.buffer
    console.log(buffer1)

    console.log('let bufferOriginal = Buffer.from(buffer1.data)')
    let bufferOriginal = Buffer.from(buffer1.data)
    console.log(bufferOriginal)

    console.log('let original = bufferOriginal.toString()')
    let original = bufferOriginal.toString()
    console.log(original)
  } catch (error) {
    console.log(`ERROR WHILE RETRIEVING DATA HISTORY: ${error}`)
    console.log(error.stack)
  }
}

// Main program function
async function main() {
  // A gateway defines the peers used to access Fabric networks
  const gateway = new Gateway()

  // Main try/catch block
  try {
    // Specify userName for network access
    // const userName = 'isabella.issuer@magnetocorp.com';
    const userName = 'User1@univie.sms.at'

    // Load connection profile; will be used to locate a gateway
    let connectionProfile = yaml.safeLoad(
      fs.readFileSync('../gateway/connection-univie.yaml', 'utf8')
    )

    // Set connection options; identity and wallet
    let connectionOptions = {
      identity: userName,
      wallet: wallet,
      discovery: { enabled: false, asLocalhost: true }
    }

    // Connect to gateway using application specified parameters
    console.log('Connect to Fabric gateway.')

    await gateway.connect(connectionProfile, connectionOptions)

    // Access PaperNet network
    console.log('Use network channel: channel-aws.')

    const network = await gateway.getNetwork('channel-aws')

    // Get the contract from the network.
    const contract = network.getContract('ec2contract')

    const serviceInfo = {
      name: 'EC2 Instance',
      accessKeyId: 'AKIATV3XKQLS7ZNLLEUT',
      secretAccessKey: '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',
      region: 'eu-central-1',
      dimensionName: 'InstanceId',
      dimensionValue: 'i-0e1a2b40a43eac5b8'
    }

    await createService(contract, serviceInfo)
    //await getMetricsfromOracle(contract, serviceInfo.name);
    await getService(contract, serviceInfo.name)
    //await getServiceHistory(contract, serviceInfo.name)
    //await getDataHistoryofService(contract, serviceInfo.name);
    //await updateService(contract, serviceInfo.name)
    const startKey = ''
    const endKey = ''
    //await getStateByRange(contract, startKey, endKey)
    //await getAllKeys(contract)

    //results.forEach(item => console.log(item));
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
}

main()
  .then(() => {
    console.log('Issue program complete.')
  })
  .catch(e => {
    console.log('Issue program exception.')
    console.log(e)
    console.log(e.stack)
    process.exit(-1)
  })
