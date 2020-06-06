const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { log, ExpressAPILogMiddleware } = require('@rama41222/node-logger')

const config = {
  name: 'api-tool',
  port: 4001,
  host: '0.0.0.0'
}

const app = express()
const logger = log({ console: true, file: false, label: config.name })

app.use(bodyParser.json())
app.use(cors())
app.use(ExpressAPILogMiddleware(logger, { request: true }))

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs')
const yaml = require('js-yaml')
const { FileSystemWallet, Gateway } = require('fabric-network')

// A wallet stores a collection of identities for use
//const wallet = new FileSystemWallet('../user/isabella/wallet');
const wallet = new FileSystemWallet('../identity/user/isabella/wallet')

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

// ######################################################################################
// ################################ Routes ##############################################
// ######################################################################################

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ a: 1 }))
})

app.get('/aws/services', async (req, res) => {
  const gateway = new Gateway()
  try {
    console.log('CONNECT TO NETWORK')

    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-aws')
    const contract = network.getContract('ec2contract')

    console.log('GET ALL KEYS')
    let keys = await contract.evaluateTransaction('getAllKeys')

    res.setHeader('Content-Type', 'application/json')
    res.end(keys)

    console.log('KEYS RETURNED')
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.post('/aws/services', async (req, res) => {
  console.log(req.body)
  const serviceInfo = req.body
  const gateway = new Gateway()

  // Main try/catch block
  try {
    console.log('CONNECT TO NETWORK')

    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-aws')
    const contract = network.getContract('ec2contract')

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 30 * 60000)

    console.log('SUBMIT SERVICE')
    await contract.submitTransaction(
      'createService',
      serviceInfo.name,
      serviceInfo.dimensionName,
      serviceInfo.dimensionValue,
      serviceInfo.region,
      serviceInfo.accessKeyId,
      serviceInfo.secretAccessKey,
      serviceInfo.promisedAvailability,
      startTime.toISOString(),
      endTime.toISOString()
    )
    console.log('SERVICE CREATED')
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.put('/aws/services/:serviceKey', async (req, res) => {
  console.log(req.body)
  let serviceKey = JSON.parse(req.params.serviceKey)

  const gateway = new Gateway()
  // Main try/catch block
  try {
    console.log('CONNECT TO NETWORK')
    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-aws')
    const contract = network.getContract('ec2contract')

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 30 * 60000)

    await contract.submitTransaction(
      'updateService',
      serviceKey,
      startTime.toISOString(),
      endTime.toISOString()
    )

    console.log('SERVICE UPDATED')
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.get('/aws/services/:serviceKey', async (req, res) => {
  let serviceKey = JSON.parse(req.params.serviceKey)
  console.log('SERVICEKEY: ' + serviceKey)

  const gateway = new Gateway()
  try {
    console.log('CONNECT TO NETWORK')
    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-aws')
    const contract = network.getContract('ec2contract')

    const serviceHistory = await contract.evaluateTransaction(
      'getStateHistory',
      serviceKey
    )

    res.setHeader('Content-Type', 'application/json')
    res.end(serviceHistory)
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.get('/azure/services', async (req, res) => {
  const gateway = new Gateway()
  try {
    console.log('CONNECT TO NETWORK')

    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-azure')
    const contract = network.getContract('azurevmcontract')

    console.log('GET ALL KEYS')
    let keys = await contract.evaluateTransaction('getAllKeys')

    res.setHeader('Content-Type', 'application/json')
    res.end(keys)

    console.log('KEYS RETURNED')
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.post('/azure/services', async (req, res) => {
  console.log(req.body)
  const serviceInfo = req.body
  const gateway = new Gateway()

  // Main try/catch block
  try {
    console.log('CONNECT TO NETWORK')

    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-azure')
    const contract = network.getContract('azurevmcontract')

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 30 * 60000)

    console.log('SUBMIT SERVICE')
    await contract.submitTransaction(
      'createService',
      serviceInfo.name,
      serviceInfo.promisedAvailability,
      startTime.toISOString(),
      endTime.toISOString(),
      serviceInfo.tenant,
      serviceInfo.clientId,
      serviceInfo.clientSecret,
      serviceInfo.subscriptionId,
      serviceInfo.resourceGroup,
      serviceInfo.computerName
    )
    console.log('SERVICE CREATED')
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.put('/azure/services/:serviceKey', async (req, res) => {
  console.log(req.body)
  let serviceKey = JSON.parse(req.params.serviceKey)

  const gateway = new Gateway()
  // Main try/catch block
  try {
    console.log('CONNECT TO NETWORK')
    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-azure')
    const contract = network.getContract('azurevmcontract')

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 30 * 60000)

    await contract.submitTransaction(
      'updateService',
      serviceKey,
      startTime.toISOString(),
      endTime.toISOString()
    )

    console.log('SERVICE UPDATED')
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.get('/azure/services/:serviceKey', async (req, res) => {
  let serviceKey = JSON.parse(req.params.serviceKey)
  console.log('SERVICEKEY: ' + serviceKey)

  const gateway = new Gateway()
  try {
    console.log('CONNECT TO NETWORK')
    await gateway.connect(connectionProfile, connectionOptions)
    const network = await gateway.getNetwork('channel-azure')
    const contract = network.getContract('azurevmcontract')

    const serviceHistory = await contract.evaluateTransaction(
      'getStateHistory',
      serviceKey
    )

    res.setHeader('Content-Type', 'application/json')
    res.end(serviceHistory)
  } finally {
    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    gateway.disconnect()
  }
})

app.listen(config.port, config.host, e => {
  if (e) {
    throw new Error('Internal Server Error')
  }
  logger.info(`${config.name} running on ${config.host}:${config.port}`)
})
