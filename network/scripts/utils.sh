#!/bin/bash
CHANNEL_AWS="$1"
CHANNEL_AZURE="$2"
DELAY="$3"
TIMEOUT="$4"
VERBOSE="$5"
COUNTER=1
MAX_RETRY=10

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/sms.at/orderers/orderer.sms.at/msp/tlscacerts/tlsca.sms.at-cert.pem
PEER0_AWS_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/aws.sms.at/peers/peer0.aws.sms.at/tls/ca.crt
PEER0_AZURE_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/azure.sms.at/peers/peer0.azure.sms.at/tls/ca.crt
PEER0_UNIVIE_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/univie.sms.at/peers/peer0.univie.sms.at/tls/ca.crt

AWS_CONTRACT_PATH="/opt/gopath/src/github.com/chaincode/ec2contract"
AWS_CONTRACT_NAME="ec2contract"
AZURE_CONTRACT_PATH="/opt/gopath/src/github.com/chaincode/azurevmcontract"
AZURE_CONTRACT_NAME="azurevmcontract"
EXAMPLE_CONTRACT_PATH="/opt/gopath/src/github.com/chaincode/node"
EXAMPLE_CONTRACT_NAME="chaincode_example02"


# verify the result of the end-to-end test
verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to setup the network ==========="
    echo
    exit 1
  fi
}

# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  CORE_PEER_LOCALMSPID="OrdererMSP"
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/sms.at/orderers/orderer.sms.at/msp/tlscacerts/tlsca.sms.at-cert.pem
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/sms.at/users/Admin@sms.at/msp
}

setGlobals() {
  PEER=$1
  if [ $PEER = "peer0.aws.sms.at" ]; then
    CORE_PEER_LOCALMSPID="AwsMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_AWS_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/aws.sms.at/users/Admin@aws.sms.at/msp
    CORE_PEER_ADDRESS=peer0.aws.sms.at:7051
  elif [ $PEER = "peer0.azure.sms.at" ]; then
    CORE_PEER_LOCALMSPID="AzureMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_AZURE_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/azure.sms.at/users/Admin@azure.sms.at/msp
    CORE_PEER_ADDRESS=peer0.azure.sms.at:8051
  elif [ $PEER = "peer0.univie.sms.at" ]; then
    CORE_PEER_LOCALMSPID="UnivieMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_UNIVIE_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/univie.sms.at/users/Admin@univie.sms.at/msp
    CORE_PEER_ADDRESS=peer0.univie.sms.at:9051
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi
  echo "#################################"
  echo $CORE_PEER_LOCALMSPID
  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

updateAnchorPeers() {
  PEER=$1
  CHANNEL_NAME=$2
  OPTION=$3
  setGlobals $PEER

  set -x
  #peer channel update -o orderer.sms.at:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
  peer channel update -o orderer.sms.at:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors${OPTION}.tx >&log.txt
  res=$?
  set +x
  
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep $DELAY
  echo
}

## Sometimes Join takes time hence RETRY at least 5 times
joinChannelWithRetry() {
  PEER=$1
  CHANNEL_NAME=$2
  setGlobals $PEER

  set -x
  peer channel join -b $CHANNEL_NAME.block >&log.txt
  res=$?
  set +x
  cat log.txt
  if [ $res -ne 0 -a $COUNTER -lt $MAX_RETRY ]; then
    COUNTER=$(expr $COUNTER + 1)
    echo "${PEER} failed to join the channel, Retry after $DELAY seconds"
    sleep $DELAY
    joinChannelWithRetry $PEER
  else
    COUNTER=1
  fi
  verifyResult $res "After $MAX_RETRY attempts, ${PEER} has failed to join channel '$CHANNEL_NAME' "
}

installChaincode() {
  PEER=$1
  CONTRACT_NAME=$2
  CONTRACT_PATH=$3
  setGlobals $PEER 
  VERSION=1.0.0
  set -x
  peer chaincode install -n $CONTRACT_NAME -v ${VERSION} -l node -p ${CONTRACT_PATH} >&log.txt
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode installation on ${PEER} has failed"
  echo "===================== Chaincode is installed on ${PEER} ===================== "
  echo
}

instantiateChaincode() {
  PEER=$1
  CONTRACT_NAME=$2
  CHANNEL_NAME=$3
  setGlobals $PEER
  VERSION=1.0.0

  # while 'peer chaincode' command can get the orderer endpoint from the peer
  # (if join was successful), let's supply it directly as we know it using
  # the "-o" option
  set -x
  #peer chaincode instantiate -o orderer.sms.at:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n $AWS_CONTRACT_NAME -l ${LANGUAGE} -v ${VERSION} -c '{"Args":["instantiate"]}' -P "AND ('AwsMSP.peer','UnivieMSP.peer')" >&log.txt
  # peer chaincode instantiate -o orderer.sms.at:7050 -C $CHANNEL_NAME -n $CONTRACT_NAME -l node -v ${VERSION} -c '{"Args":["instantiate"]}' -P "AND ('${CORE_PEER_LOCALMSPID}.peer','UnivieMSP.peer')" >&log.txt
  peer chaincode instantiate -o orderer.sms.at:7050 -C $CHANNEL_NAME -n $CONTRACT_NAME -l node -v ${VERSION} -c '{"Args":["instantiate"]}' -P "OR ('${CORE_PEER_LOCALMSPID}.member','UnivieMSP.member')" >&log.txt
  res=$?
  set +x
 
  cat log.txt
  verifyResult $res "Chaincode instantiation on ${PEER} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is instantiated on ${PEER} on channel '$CHANNEL_NAME' ===================== "
  echo
}

createChannel() {
  PEER=$1
  CHANNEL_NAME=$2
	setGlobals $PEER

  set -x
	#peer channel create -o orderer.sms.at:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
	peer channel create -o orderer.sms.at:7050 -c $CHANNEL_NAME -f ./channel-artifacts/$CHANNEL_NAME.tx >&log.txt
	res=$?
  set +x

	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

## Create channel
echo "Creating channel..."
createChannel "peer0.aws.sms.at" $CHANNEL_AWS
createChannel "peer0.azure.sms.at" $CHANNEL_AZURE

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannelWithRetry "peer0.aws.sms.at" $CHANNEL_AWS
joinChannelWithRetry "peer0.azure.sms.at" $CHANNEL_AZURE
joinChannelWithRetry "peer0.univie.sms.at" $CHANNEL_AWS
joinChannelWithRetry "peer0.univie.sms.at" $CHANNEL_AZURE

## Set the anchor peers for each org in the channel
echo "Updating anchor peers for aws..."
updateAnchorPeers "peer0.aws.sms.at" $CHANNEL_AWS

echo "Updating anchor peers for azure..."
updateAnchorPeers "peer0.azure.sms.at" $CHANNEL_AZURE

echo "Updating anchor peers for univie..."
updateAnchorPeers "peer0.univie.sms.at" $CHANNEL_AZURE "AZURE"
updateAnchorPeers "peer0.univie.sms.at" $CHANNEL_AWS "AWS"



## Install chaincode on peers
echo "Installing chaincode ${AWS_CONTRACT_NAME} on peer0.aws.sms.at"
installChaincode "peer0.aws.sms.at" $AWS_CONTRACT_NAME $AWS_CONTRACT_PATH

echo "Install chaincode ${AWS_CONTRACT_NAME} on peer0.univie.sms.at"
installChaincode "peer0.univie.sms.at" $AWS_CONTRACT_NAME $AWS_CONTRACT_PATH

echo "Install chaincode ${AZURE_CONTRACT_NAME} on peer0.univie.sms.at"
installChaincode "peer0.univie.sms.at" $AZURE_CONTRACT_NAME $AZURE_CONTRACT_PATH

echo "Install chaincode ${AZURE_CONTRACT_NAME} on peer0.azure.sms.at"
installChaincode "peer0.azure.sms.at" $AZURE_CONTRACT_NAME $AZURE_CONTRACT_PATH

# Instantiate chaincodes on channels
echo "Instantiating chaincode on $CHANNEL_AZURE via peer0.azure.sms.at"
instantiateChaincode "peer0.azure.sms.at" $AZURE_CONTRACT_NAME $CHANNEL_AZURE
echo "Instantiating chaincode on $CHANNEL_AWS via peer0.aws.sms.at"
instantiateChaincode "peer0.aws.sms.at" $AWS_CONTRACT_NAME $CHANNEL_AWS
#echo "Instantiating chaincode on peer0.univie.sms.at"
# instantiateChaincode "peer0.univie.sms.at" $AWS_CONTRACT_NAME $CHANNEL_AWS

#setGlobals "peer0.azure.sms.at"

echo
echo "========= SMS networt is up =========== "
echo


exit 0
