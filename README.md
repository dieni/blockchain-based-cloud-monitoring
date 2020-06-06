# blockchain-based-cloud-monitoring
The creation of the blockchain network is done with some command line tools provided by Hyperledger. All the commands to spin up the network including peer nodes for the users are composed in *sms.sh* within the network folder. This script file takes one of the three options: up, down and generate.

## How to:

### Create the network
Navigate into the network folder and execute the command: *./sms.sh up*

This will execute multiple operations:
1. If the do not already exist, this will generate certificates for each of the organizations and stores them into the *crypto-config* folder
  
2. Based on the endorsment policy stated in *configtx.yaml* the artefacts for the channel creation will be generated and stored in the folder *channel-artifacts*. Note: When generateing the artefacts, the folder needs to exist already.

3. Starts docker service containers described in the *docker-compose.yml* file which are and ordering service, peer nodes for each organization and another peer nodewhich acts as helper for further configuration of the network

4. Within the helper peer the script *utils.sh* will be executed which makes use of the crypto files of the different organzations and performs following opertations:
    1. Based on the previous generated channel artefacts two channels will be createdand registered to theordering service: *channel-aws* and *channel-azure*
    2. The AWS peer together with the peer of University Vienna are joined to the channel-aws
    3. Analog to the previous step the Azure peer together with the peer of the University are joined to the channel-azure
    4. The smart contract for the EC2 services get installed on the Univie and AWS peer and instantiated on the channel-aws
    5. The smart contract for the Azure VMs gets installed on the Univie and Azure peer and instantiated on the channel-azure.
    
5. When you see in the terminal following output, the creation of the network was successful:<br>
*========= SMS Up! ===========*
  
### Add the wallets
The walltes are needed for the SDK to interact with the peers of the network and are created as follows:

1. Go into the *crypto-config* folder and copy the name of the pem file of the organization you would like to interact with the network <br>
*{organization}/users/{user}/msp/keystore/{...sk}* <br><br>

Beware that the different users of an organization have different permissions. Those where stated in the endorsement policy on the creation process of the channel. 

2. Within the folder of the organization open the file: <br>
*organization/{organization}/application/addToWallet.js*

3. Past the name of the pem file and make sure that the path of the file matches the location. 

4. Execute *addToWallet.js*<br>
  1. This will create a wallet within the folder of the organization which can be used for an application to authenticate to the peer and manage transactions.
  
5. Repeat the procedure for all three organizations


### Create the UI
1. Execute the *docker-compose* file within the organization folder. This will createthe container for the User Interface and the API of each organization.<br>

The user interfaces for the organizations can be found under:
- localhost:4000 (University)
- localhost:4010 (Azure)
- localhost:4020 (Amazon)
