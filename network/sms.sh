#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#


# prepending $PWD/../bin to PATH to ensure we are picking up the correct binaries
# this may be commented out to resolve installed version of tools if desired
export PATH=${PWD}/bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false


# Print the usage message
function printHelp() {
  echo "Usage: "
  echo "	sms.sh generate"
  echo "	sms.sh up"
  echo "	sms.sh down"
}

# Ask user for confirmation to proceed
function askProceed() {
  read -p "Continue? [Y/n] " ans
  case "$ans" in
  y | Y | "")
    echo "proceeding ..."
    ;;
  n | N)
    echo "exiting..."
    exit 1
    ;;
  *)
    echo "invalid response"
    askProceed
    ;;
  esac
}

# Obtain CONTAINER_IDS and remove them
# TODO Might want to make this optional - could clear other containers
function clearContainers() {

  CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /dev-peer.*/) {print $1}')
  if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f $CONTAINER_IDS
  fi
  # remove logspout
  docker kill logspout 2> /dev/null 1>&2 || true
  docker rm logspout 2> /dev/null 1>&2 || true

  # remove network
  docker network rm -f $NETWORK
}

# Delete any images that were generated as a part of this setup
# specifically the following images are often left behind:
# TODO list generated image naming patterns
function removeUnwantedImages() {
  DOCKER_IMAGE_IDS=$(docker images | awk '($1 ~ /dev-peer.*/) {print $3}')
  if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" == " " ]; then
    echo "---- No images available for deletion ----"
  else
    docker rmi -f $DOCKER_IMAGE_IDS
  fi

}

function monitor(){

  #This script uses the logspout and http stream tools to let you watch the docker containers
  # in action.
  #
  # More information at https://github.com/gliderlabs/logspout/tree/master/httpstream
  if [ -z "$1" ]; then
   DOCKER_NETWORK=net_sms
  else
   DOCKER_NETWORK="$1"
  fi

  if [ -z "$2" ]; then
   PORT=8000
  else
   PORT="$2"
  fi

  echo Starting monitoring on all containers on the network ${DOCKER_NETWORK}

  docker kill logspout 2> /dev/null 1>&2 || true
  docker rm logspout 2> /dev/null 1>&2 || true

  docker run -d --name="logspout" \
    --volume=/var/run/docker.sock:/var/run/docker.sock \
    --publish=127.0.0.1:${PORT}:80 \
    --network  ${DOCKER_NETWORK} \
    gliderlabs/logspout
  sleep 3
  curl http://127.0.0.1:${PORT}/logs
}

# Generate the needed certificates, the genesis block and start the network.
function networkUp() {

  # generate artifacts if they don't exist
  if [ ! -d "crypto-config" ]; then
    generateCerts
    generateChannelArtifacts
  fi
  COMPOSE_FILES="-f ${COMPOSE_FILE}"
  
  IMAGE_TAG=$IMAGETAG docker-compose ${COMPOSE_FILES} up -d 2>&1
  docker ps -a
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi

  # now run the end to end script
  docker exec cli scripts/utils.sh $CHANNEL_AWS $CHANNEL_AZURE $CLI_DELAY $CLI_TIMEOUT $VERBOSE
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Unable to join peers"
    exit 1
  fi
  monitor
}

# Tear down running network
function networkDown() {

  docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans

  # Bring down the network, deleting the volumes
  #Delete any ledger backups
  docker run -v $PWD:/tmp/network --rm hyperledger/fabric-tools:$IMAGETAG rm -Rf /tmp/network/ledgers-backup
  #Cleanup the chaincode containers
  clearContainers
  #Cleanup images
  removeUnwantedImages
  # remove orderer block and other channel configuration transactions and certs
  # rm -rf channel-artifacts/*.block channel-artifacts/*.tx crypto-config


}


# We will use the cryptogen tool to generate the cryptographic material (x509 certs)
# for our various network entities.  The certificates are based on a standard PKI
# implementation where validation is achieved by reaching a common trust anchor.
#
# Cryptogen consumes a file - ``crypto-config.yaml`` - that contains the network
# topology and allows us to generate a library of certificates for both the
# Organizations and the components that belong to those Organizations.  Each
# Organization is provisioned a unique root certificate (``ca-cert``), that binds
# specific components (peers and orderers) to that Org.  Transactions and communications
# within Fabric are signed by an entity's private key (``keystore``), and then verified
# by means of a public key (``signcerts``).  You will notice a "count" variable within
# this file.  We use this to specify the number of peers per Organization; in our
# case it's two peers per Org.  The rest of this template is extremely
# self-explanatory.
#
# After we run the tool, the certs will be parked in a folder titled ``crypto-config``.

# Generates Org certs using cryptogen tool
function generateCerts() {
  which cryptogen
  if [ "$?" -ne 0 ]; then
    echo "cryptogen tool not found. exiting"
    exit 1
  fi
  echo
  echo "##########################################################"
  echo "##### Generate certificates using cryptogen tool #########"
  echo "##########################################################"

  if [ -d "crypto-config" ]; then
    rm -Rf crypto-config
  fi
  set -x
  cryptogen generate --config=./crypto-config.yaml
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate certificates..."
    exit 1
  fi

  echo
  echo "##########################################################"
  echo "######### Generate files for Network connection ##########"
  echo "##########################################################"
  set -x
  ./ccp-generate.sh
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate files for network connection..."
    exit 1
  fi
}

# The `configtxgen tool is used to create four artifacts: orderer **bootstrap
# block**, fabric **channel configuration transaction**, and two **anchor
# peer transactions** - one for each Peer Org.
#
# The orderer block is the genesis block for the ordering service, and the
# channel transaction file is broadcast to the orderer at channel creation
# time.  The anchor peer transactions, as the name might suggest, specify each
# Org's anchor peer on this channel.
#
# Configtxgen consumes a file - ``configtx.yaml`` - that contains the definitions
# for the sample network. There are three members - one Orderer Org (``OrdererOrg``)
# and two Peer Orgs (``Univ`` & ``Aws``) each managing and maintaining two peer nodes.
# This file also specifies a consortium - ``SampleConsortium`` - consisting of our
# two Peer Orgs.  Pay specific attention to the "Profiles" section at the top of
# this file.  You will notice that we have two unique headers. One for the orderer genesis
# block - ``TwoOrgsOrdererGenesis`` - and one for our channel - ``TwoOrgsChannel``.
# These headers are important, as we will pass them in as arguments when we create
# our artifacts.  This file also contains two additional specifications that are worth
# noting.  Firstly, we specify the anchor peers for each Peer Org
# (``peer0.org1.example.com`` & ``peer0.org2.example.com``).  Secondly, we point to
# the location of the MSP directory for each member, in turn allowing us to store the
# root certificates for each Org in the orderer genesis block.  This is a critical
# concept. Now any network entity communicating with the ordering service can have
# its digital signature verified.
#
# This function will generate the crypto material and our four configuration
# artifacts, and subsequently output these files into the ``channel-artifacts``
# folder.
#
# If you receive the following warning, it can be safely ignored:
#
# [bccsp] GetDefault -> WARN 001 Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
#
# You can ignore the logs regarding intermediate certs, we are not using them in
# this crypto implementation.

# Generate orderer genesis block, channel configuration transaction and
# anchor peer update transactions
function generateChannelArtifacts() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    echo "configtxgen tool not found. exiting"
    exit 1
  fi

  echo "##########################################################"
  echo "#########  Generating Orderer Genesis block ##############"
  echo "##########################################################"
  # Note: For some unknown reason (at least for now) the block file can't be
  # named orderer.genesis.block or the orderer will fail to launch!
  set -x

  configtxgen -profile TwoOrgsOrdererGenesisAWS -channelID $SYS_CHANNEL -outputBlock ./channel-artifacts/genesis.block

  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
  fi
  echo
  echo "#################################################################"
  echo "### Generating channel configuration transaction 'channel.tx' ###"
  echo "#################################################################"
  set -x
  configtxgen -profile TwoOrgsChannelAWS -outputCreateChannelTx ./channel-artifacts/$CHANNEL_AWS.tx -channelID $CHANNEL_AWS
  configtxgen -profile TwoOrgsChannelAZURE -outputCreateChannelTx ./channel-artifacts/$CHANNEL_AZURE.tx -channelID $CHANNEL_AZURE
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for UnivieMSP   ##########"
  echo "#################################################################"
  set -x
  configtxgen -profile TwoOrgsChannelAWS -outputAnchorPeersUpdate ./channel-artifacts/UnivieMSPanchorsAWS.tx -channelID $CHANNEL_AWS -asOrg UnivieMSP
  configtxgen -profile TwoOrgsChannelAZURE -outputAnchorPeersUpdate ./channel-artifacts/UnivieMSPanchorsAZURE.tx -channelID $CHANNEL_AZURE -asOrg UnivieMSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for UnivieMSP..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for AwsMSP   ##########"
  echo "#################################################################"
  set -x
  configtxgen -profile TwoOrgsChannelAWS -outputAnchorPeersUpdate \
    ./channel-artifacts/AwsMSPanchors.tx -channelID $CHANNEL_AWS -asOrg AwsMSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for AwsMSP..."
    exit 1
  fi
  echo

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for AzureMSP   ##########"
  echo "#################################################################"
  set -x
  configtxgen -profile TwoOrgsChannelAZURE -outputAnchorPeersUpdate \
    ./channel-artifacts/AzureMSPanchors.tx -channelID $CHANNEL_AZURE -asOrg AzureMSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for AzureMSP..."
    exit 1
  fi
  echo
}


CLI_TIMEOUT=10
# default for delay between commands
CLI_DELAY=3
# system channel name defaults to "sms-sys-channel"
SYS_CHANNEL="sms-sys-channel"
# channel names
CHANNEL_AWS="channel-aws"
CHANNEL_AZURE="channel-azure"
# use this as the default docker-compose yaml definition
COMPOSE_FILE=docker-compose-cli.yaml
# name of the docker network
NETWORK='net_sms'
# default image tag
IMAGETAG="1.4.4"

# Parse commandline args
if [ "$1" = "-m" ]; then # supports old usage, muscle memory is powerful!
  shift
fi
MODE=$1
shift

# Determine whether starting, stopping, restarting, generating or upgrading
if [ "$MODE" == "up" ]; then
  EXPMODE="Starting"
elif [ "$MODE" == "down" ]; then
  EXPMODE="Stopping"
elif [ "$MODE" == "generate" ]; then
  EXPMODE="Generating certs and genesis block"
else
  printHelp
  exit 1
fi

# ask for confirmation to proceed
askProceed

#Create the network using docker compose
if [ "${MODE}" == "up" ]; then
  networkUp
elif [ "${MODE}" == "down" ]; then ## Clear the network
  networkDown
elif [ "${MODE}" == "generate" ]; then ## Generate Artifacts
  generateCerts
  generateChannelArtifacts
elif [ "${MODE}" == "restart" ]; then ## Restart the network
  networkDown
  networkUp
else
  printHelp
  exit 1
fi
