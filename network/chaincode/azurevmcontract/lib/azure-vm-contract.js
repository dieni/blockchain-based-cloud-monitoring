/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Contract, Context } = require("fabric-contract-api");
const adal = require("adal-node").AuthenticationContext;
const request = require("request");
/**
 * A custom context provides easy access to list of all services
 */
class AzureVMContractContext extends Context {
    constructor() {
        super();
    }
}

class AzureVMContract extends Contract {
    constructor() {
        super("com.azure.vmcontract");
    }

    createContext() {
        // Unique namespace when multiple contracts per chaincode file
        return new AzureVMContractContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log("Instantiate the contract");
    }

    async createService(
        ctx,
        name,
        promisedAvailability,
        startTime,
        endTime,
        tenant,
        clientId,
        clientSecret,
        subscriptionId,
        resourceGroup,
        computerName
    ) {
        let cpuUtilization = await this.getCPUUtilization(
            clientId,
            clientSecret,
            tenant,
            subscriptionId,
            resourceGroup,
            computerName,
            startTime,
            endTime
        );

        const service = {
            name,
            startTime,
            endTime,
            promisedAvailability,
            timesAvailable: 1,
            timesNotAvailable: 0,
            credit: 0,
            cpuUtilization,
            clientId,
            clientSecret,
            tenant,
            subscriptionId,
            resourceGroup,
            computerName
        };

        await ctx.stub.putState(
            service.name,
            Buffer.from(JSON.stringify(service))
        );

        return service;
    }

    // async createServiceTest(ctx) {
    //     const service = {
    //         name: "test_service"
    //     };

    //     await ctx.stub.putState(
    //         service.name,
    //         Buffer.from(JSON.stringify(service))
    //     );

    //     return service;
    // }

    async getService(ctx, serviceKey) {
        const serviceAsBytes = await ctx.stub.getState(serviceKey);
        if (!serviceAsBytes || serviceAsBytes.length === 0) {
            throw new Error(`${serviceKey} does not exist`);
        }

        console.log("GET SERVICE AS BYTES: " + serviceAsBytes);

        console.log(serviceAsBytes.toString());
        return serviceAsBytes.toString();
    }

    async updateService(ctx, serviceKey, startTime, endTime) {
        const serviceAsBytes = await ctx.stub.getState(serviceKey);
        if (!serviceAsBytes || serviceAsBytes.length === 0) {
            throw new Error(`${serviceKey} does not exist`);
        }

        let service = JSON.parse(serviceAsBytes.toString());

        // Check if endTime from current State is befor startTime of parameter
        /*if (service.endTime > startTime) {
            return "Service already monitored for given time";
        }*/

        service.cpuUtilization = "";

        service.cpuUtilization = await this.getCPUUtilization(
            service.clientId,
            service.clientSecret,
            service.tenant,
            service.subscriptionId,
            service.resourceGroup,
            service.computerName,
            startTime,
            endTime
        );

        // calculate availability
        if (service.cpuUtilization >= 0) {
            service.timesAvailable += 1;
            console.log("Connection good");
        } else {
            service.timesNotAvailable += 1;
            console.log("No connection");
        }

        const currentAvailability =
            service.timesAvailable /
            (service.timesAvailable + service.timesNotAvailable);

        // give credit if availability is to low
        if (currentAvailability < service.promisedAvailability) {
            service.credit += 100;
        }

        service.startTime = startTime;

        service.endTime = endTime;

        await ctx.stub.putState(
            service.name,
            Buffer.from(JSON.stringify(service))
        );

        return service;
    }

    // async getStateByRange(ctx, startKey, endKey) {
    //     const iterator = await ctx.stub.getStateByRange(startKey, endKey);

    //     const allResults = [];
    //     while (true) {
    //         const res = await iterator.next();

    //         if (res.value && res.value.value.toString()) {
    //             console.log(res.value.value.toString("utf8"));

    //             const Key = res.value.key;
    //             let Record;
    //             try {
    //                 Record = JSON.parse(res.value.value.toString("utf8"));
    //             } catch (err) {
    //                 console.log(err);
    //                 Record = res.value.value.toString("utf8");
    //             }
    //             allResults.push({ Key, Record });
    //         }
    //         if (res.done) {
    //             await iterator.close();
    //             console.info(allResults);
    //             return JSON.stringify(allResults);
    //         }
    //     }
    // }

    //GET THE DATA MEASURED FROM A SERVICE
    async getStateHistory(ctx, serviceKey) {
        const iterator = await ctx.stub.getHistoryForKey(serviceKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString("utf8"));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString("utf8"));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString("utf8");
                }
                Record.txId = res.tx_id;
                allResults.push({ Key, Record });
            }
            if (res.done) {
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    //USED TO KNOW WHICH SERVICES ARE CURRENTLY REGISTERD
    async getAllKeys(ctx) {
        const startKey = "";
        const endKey = "";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString("utf8"));

                const Key = res.value.key;

                allResults.push(Key);
            }
            if (res.done) {
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    // async getToken(authorityUrl, resource, clientId, clientSecret) {
    //     // const context = new adal(authorityUrl);
    //     let promise = new Promise(function(resolve, reject) {
    //         // context.acquireTokenWithClientCredentials(
    //         //     resource,
    //         //     clientId,
    //         //     clientSecret,
    //         //     (err, response) => {
    //         //         if (err) {
    //         //             console.log(`Token generation failed due to ${err}`);
    //         //             reject(err);
    //         //         } else {
    //         //             resolve(response.accessToken);
    //         //             //console.dir(accessToken, { depth: null, colors: true })
    //         //         }
    //         //     }
    //         // );
    //         resolve('asdf')
    //     });
    //     return promise;
    // }

    // async getCPUUtilization(
    //     clientId,
    //     clientSecret,
    //     tenant,
    //     subscriptionId,
    //     resourceGroup,
    //     computerName,
    //     startTime,
    //     endTime
    // ) {
    //     const authorityHostUrl = "https://login.windows.net";
    //     const resource = "https://management.azure.com/";
    //     const authorityUrl = authorityHostUrl + "/" + tenant;

    //     const url =
    //         resource +
    //         "subscriptions/" +
    //         subscriptionId +
    //         "/resourceGroups/" +
    //         resourceGroup +
    //         "/providers/Microsoft.Compute/virtualMachines/" +
    //         computerName +
    //         "/providers/microsoft.insights/metrics?api-version=2018-01-01&metricnames=Percentage%20CPU&timespan=" +
    //         startTime +
    //         "/" +
    //         endTime +
    //         "&interval=PT30M";

    //     let promise = new Promise(function(resolve, reject) {
    //         let token = await getToken(
    //             authorityUrl,
    //             resource,
    //             clientId,
    //             clientSecret
    //         );
    //         request
    //             .get(url, function(error, response, body) {
    //                 cpuUtilization = JSON.parse(body).value[0].timeseries[0]
    //                     .data[0].average;
    //                 console.log(cpuUtilization);
    //                 resolve(cpuUtilization);
    //             })
    //             .auth(null, null, true, token);
    //     });
    //     return promise;
    // }

    async getCPUUtilization(
        clientId,
        clientSecret,
        tenant,
        subscriptionId,
        resourceGroup,
        computerName,
        startTime,
        endTime
    ) {
        const authorityHostUrl = "https://login.windows.net";
        const resource = "https://management.azure.com/";
        const authorityUrl = authorityHostUrl + "/" + tenant;
        const context = new adal(authorityUrl);

        const url =
            resource +
            "subscriptions/" +
            subscriptionId +
            "/resourceGroups/" +
            resourceGroup +
            "/providers/Microsoft.Compute/virtualMachines/" +
            computerName +
            "/providers/microsoft.insights/metrics?api-version=2018-01-01&metricnames=Percentage%20CPU&timespan=" +
            startTime +
            "/" +
            endTime +
            "&interval=PT30M";

        let promise = new Promise(function(resolve, reject) {
            context.acquireTokenWithClientCredentials(
                resource,
                clientId,
                clientSecret,
                (err, response) => {
                    if (err) {
                        console.log(`Token generation failed due to ${err}`);
                        reject(err);
                    } else {
                        request
                            .get(url, function(error, response, body) {
                                const cpuUtilization = JSON.parse(body).value[0]
                                    .timeseries[0].data[0].average;
                                console.log(cpuUtilization);
                                resolve(cpuUtilization);
                            })
                            .auth(null, null, true, response.accessToken);
                        //console.dir(accessToken, { depth: null, colors: true })
                    }
                }
            );
        });
        return promise;
    }
}

module.exports = AzureVMContract;
