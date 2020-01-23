function processRawData(rawData) {

    let splitByLines = rawData.split("\n");
    let dates = [];
    let times = [];
    let light = [];
    let counts = [];


    for (let i = 1; i < splitByLines.length; i++) {
        let row = splitByLines[i].split(",");

        dates[i] = row[0];
        times[i] = row[1];
        light[i] = parseFloat(row[3]);
        counts[i] = parseFloat(row[2]);
    }

    return {dates, times, light, counts}
}


function formatDataForIntegration(dates, times, counts) {
    let cumulativeSum = 0;
    let timeInHours = [];
    let countsIndexedByHours = [];
    let counter = 0;

    for (let i = 0; i < counts.length; i++) {
        let timestamp = (parseFloat(dates[i]) + parseFloat(times[i])) * 24;

        if (!isNaN(counts[i]) && !isNaN(timestamp)) {
            cumulativeSum = cumulativeSum + counts[i];
            countsIndexedByHours[counter] = counts[i];
            timeInHours[counter] = timestamp;
            counter = counter + 1
        }
    }


    let firstTimestamp = timeInHours[0];
    for (let i = 0; i < timeInHours.length; i++) {
        timeInHours[i] = timeInHours[i] - firstTimestamp;
    }


    let totalMinutes = 60 * timeInHours[timeInHours.length - 1];
    let timeInMinutes = [];
    let countsInMinutes = [];

    let minuteCounter = 0.0;
    let startTimeForCounts = 0;
    for (let i = 0; i < totalMinutes; i++) {
        timeInMinutes[i] = minuteCounter / 60.0;
        let countValue = 0;

        for (let j = startTimeForCounts; j < countsIndexedByHours.length - 1; j++) {

            if (timeInHours[j] * 60 <= minuteCounter && timeInHours[j + 1] * 60 > minuteCounter) {
                let fractionComplete = (minuteCounter / 60.0 - timeInHours[j]) / (timeInHours[j + 1] - timeInHours[j]);
                countValue = countsIndexedByHours[j] + fractionComplete * (countsIndexedByHours[j + 1] - countsIndexedByHours[j]);
                startTimeForCounts = j;
                break;
            }
        }

        countsInMinutes[i] = countValue;

        minuteCounter = minuteCounter + 1.0;

    }

    return {timeInMinutes, countsInMinutes, firstTimestamp}

}


function getDataForPlot(output, firstTimestamp) {
    let data = [];
    let stepCounter = 0;
    let labels = [];
    let lengthOfDay = 24/DELTA_T;
    
    for (let i = 0; i < output.length; i = i + 500) {
        let array = output[i];
        data[stepCounter] = array[0];
        let currentTime = i * DELTA_T + (firstTimestamp % 24);
        labels[stepCounter] = currentTime.toFixed(2);
        stepCounter = stepCounter + 1;
    }
    
    let minimumTime = -1;
    for (let i = output.length - lengthOfDay + 1; i < output.length - 1; i = i + 1) {
        
        let arrayCurrentStep = output[i];
        let arrayPastStep = output[i - 1];
        let arrayNextStep = output[i + 1];

        if (arrayPastStep[0] > arrayCurrentStep[0] && arrayCurrentStep[0] < arrayNextStep[0]){
            minimumTime = i * DELTA_T + (firstTimestamp % 24);
        }
    }
    
    return {data, labels, minimumTime}
}


onmessage = function (e) {
    self.importScripts("models.js");

    let rawData = e.data;

    postMessage(0.1);

    const {dates, times, light, counts} = processRawData(rawData);

    postMessage(0.3);

    const {timeInMinutes, countsInMinutes, firstTimestamp} = formatDataForIntegration(dates, times, counts);

    postMessage(0.5);

    let output = getCircadianOutput(timeInMinutes, countsInMinutes, countsInMinutes, firstTimestamp);

    postMessage(0.8);

    const {labels, data, minimumTime} = getDataForPlot(output, firstTimestamp);

    postMessage(1.0);

    postMessage({labels, data, minimumTime});
}
