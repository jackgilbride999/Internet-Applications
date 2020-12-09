var requestTimeArray = []; 
var timeBetweenInvocationsArray = [];

exports.handler = async (event) => {
    
    // STEP 0: RESET if specified by the event parameters
    if(event.queryStringParameters && event.queryStringParameters.cmd) {
        if(event.queryStringParameters.cmd == "RESET") {
            requestTimeArray = [];
            timeBetweenInvocationsArray = [];
        }
    }

    // STEP 1: log the current time and the number of invocations
    requestTimeArray.push(new Date());
    var invocationsCount = requestTimeArray.length;
    
    // STEP 2: If there was a previous invocation, log the amount of time passed since (to the nearest second)
    var timeSinceLast = requestTimeArray[invocationsCount-1] - requestTimeArray[invocationsCount-2] || 0;
    if(timeSinceLast != 0){
        timeSinceLast = Math.round(timeSinceLast / 1000);
        timeBetweenInvocationsArray.push(timeSinceLast)
    }
    
    // STEP 3: compute the average of the logged invocation gaps (to the nearest second) 
    var invocationsGapSum = timeBetweenInvocationsArray.reduce((a,b) => (a+b), 0); // short lambda function to compute the sum of the array
    var invocationsGapAverage = (invocationsGapSum / timeBetweenInvocationsArray.length);
    invocationsGapAverage = Math.round(invocationsGapAverage)
    
    if(invocationsCount == 1){
        // first invocation or a reset, so only return the ThisInvocation field
        return {
            statusCode: 200,
            body: JSON.stringify({
                ThisInvocation: requestTimeArray[invocationsCount-1].toISOString()
            })

        };
    } else{
        return {
            statusCode: 200,
            body: JSON.stringify({
                ThisInvocation: requestTimeArray[invocationsCount-1].toISOString(),
                TimeSinceLast : timeSinceLast,
                TotalInvocationsOnThisContainer : invocationsCount,
                AverageGapBetweenInvocations : invocationsGapAverage
            })
            
        };
    }
};

