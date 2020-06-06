/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Contract, Context } = require("fabric-contract-api");

const AWS = require("aws-sdk");

/**
 * A custom context provides easy access to list of all services
 */
class AwsEC2ContractContext extends Context {
    constructor() {
        super();
    }
}

class AwsEC2Contract extends Contract {
    constructor() {
        super("com.aws.ec2contract");
    }

    createContext() {
        // Unique namespace when multiple contracts per chaincode file
        return new AwsEC2ContractContext();
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
        dimensionName,
        dimensionValue,
        region,
        accessKeyId,
        secretAccessKey,
        promisedAvailability,
        startTime,
        endTime
    ) {
        let data = await this.getMetricsDataEC2(
            accessKeyId,
            secretAccessKey,
            region,
            dimensionName,
            dimensionValue,
            startTime,
            endTime
        );
        const service = {
            name,
            dimensionName,
            dimensionValue,
            region,
            accessKeyId,
            secretAccessKey,
            startTime,
            endTime,
            promisedAvailability,
            timesAvailable: 1,
            timesNotAvailable: 0,
            credit: 0,
            data
        };

        await ctx.stub.putState(
            service.name,
            Buffer.from(JSON.stringify(service))
        );

        return service;
    }

    // async createServiceTest(ctx) {
    //     const service = {
    //         name: "asdf",
    //         dimensionName: "asdf",
    //         timesAvailable: 1,
    //         timesNotAvailable: 0,
    //         credit: 0
    //     };

    //     await ctx.stub.putState(
    //         service.name,
    //         Buffer.from(JSON.stringify(service))
    //     );

    //     return service;
    // }

    async getService(ctx, serviceKey) {
        const serviceAsBytes = await ctx.stub.getState(serviceKey); // get the car from chaincode state
        if (!serviceAsBytes || serviceAsBytes.length === 0) {
            throw new Error(`${serviceKey} does not exist`);
        }

        console.log("GET SERVICE AS BYTES: " + serviceAsBytes);

        console.log(serviceAsBytes.toString());
        return serviceAsBytes.toString();
    }

    async updateService(ctx, serviceKey, startTime, endTime) {
        const serviceAsBytes = await ctx.stub.getState(serviceKey); // get the car from chaincode state
        if (!serviceAsBytes || serviceAsBytes.length === 0) {
            throw new Error(`${serviceKey} does not exist`);
        }

        let service = JSON.parse(serviceAsBytes.toString());

        // Check if endTime from current State is befor startTime of parameter
        /*if (service.endTime > startTime) {
                return "Service already monitored for given time";
            }*/

        service.data = {};

        service.data = await this.getMetricsDataEC2(
            service.accessKeyId,
            service.secretAccessKey,
            service.region,
            service.dimensionName,
            service.dimensionValue,
            startTime,
            endTime
        );

        // calculate availability
        if (service.data.MetricDataResults[0].Values.length == 0) {
            service.timesNotAvailable += 1;
            console.log("No connection");
        } else {
            service.timesAvailable += 1;
            console.log("Connection good");
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

    async getMetricsDataEC2(
        accessKeyId,
        secretAccessKey,
        region,
        dimensionName,
        dimensionValue,
        startTime,
        endTime
    ) {
        AWS.config.accessKeyId = accessKeyId;
        AWS.config.secretAccessKey = secretAccessKey;
        AWS.config.region = region;

        const cloudwatch = new AWS.CloudWatch();

        /*const currentTime = new Date();
            const thirtyMinutesEarlier = new Date(
                currentTime.getTime() - 30 * 60000
            );
            */

        const params = {
            //StartTime: thirtyMinutesEarlier.toISOString(),
            //EndTime: currentTime.toISOString(),
            StartTime: startTime,
            EndTime: endTime,
            MetricDataQueries: [
                {
                    Id: "m1",
                    MetricStat: {
                        Metric: {
                            Dimensions: [
                                {
                                    Name: dimensionName,
                                    Value: dimensionValue
                                }
                            ],
                            Namespace: "AWS/EC2",
                            MetricName: "CPUUtilization"
                        },
                        Period: 3600,
                        Stat: "Average"
                    }
                },
                {
                    Id: "m2",
                    MetricStat: {
                        Metric: {
                            Dimensions: [
                                {
                                    Name: dimensionName,
                                    Value: dimensionValue
                                }
                            ],
                            Namespace: "AWS/EC2",
                            MetricName: "NetworkOut"
                        },
                        Period: 3600,
                        Stat: "Average"
                    }
                }
            ]
        };

        let promise = new Promise(function(resolve, reject) {
            cloudwatch.getMetricData(params, (err, data) => {
                if (err) {
                    //console.info("HERE IN THE IF GETMETRICDATA");
                    //console.log("Error", err);
                    reject(err);
                } else {
                    //console.info("HERE IN THE ELSE GETMETRICDATA");
                    //console.log("Metrics", JSON.stringify(data));
                    resolve(data);
                }
            });
        });

        return promise;
    }
}

module.exports = AwsEC2Contract;
