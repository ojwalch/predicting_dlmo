
var barValue = 0.0;

var bar = new ProgressBar.Line('#progress', {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 2000,
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {width: '100%', height: '100%'},
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'},
    step: (state, bar) => {
        bar.path.setAttribute('stroke', state.color);
    }
});

function setSummary(minimumTime){
    var ctx = document.getElementById("summary").innerHTML = "<br>Predicted DLMO is " + (minimumTime % 24).toFixed(2) + " hours after midnight on the last day of recording.";
}

function setPlot(labels, data) {
    var ctx = document.getElementById('circadianChart');

    var xVariableLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,

            datasets: [{
                label: 'x',
                backgroundColor: 'rgb(75, 77, 192)',
                borderColor: 'rgb(75, 192, 192)',
                data: data,
                fill: false
            }
            ]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time (hours, local time)',
                        fontColor: 'rgb(50,50,50,0.8)',
                        fontSize: 16
                    },
                    gridLines: {
                        color: 'rgb(200,200,200,0.4)',
                        zeroLineColor: 'rgb(200,200,200,0.4)'
                    },
                    ticks: {
                        fontColor: 'rgb(50,50,50,0.8)',
                        fontSize: 14
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'x (min aligns with CBTmin)',
                        fontColor: 'rgb(50,50,50,0.8)',
                        fontSize: 14
                    },
                    gridLines: {
                        color: 'rgb(200,200,200,0.4)',
                        zeroLineColor: 'rgb(150,150,150,0.4)'
                    },
                    ticks: {
                        fontColor: 'rgb(50,50,50,0.8)',
                        fontSize: 14
                    }
                }]
            }
        }
    });

    xVariableLineChart.update();

}


if (window.File && window.FileReader && window.FileList && window.Blob) {


    function showFile() {
        var preview = document.getElementById('show-text');
        var file = document.querySelector('input[type=file]').files[0];
        var reader = new FileReader()
        var textFile = /text.*/;

        if (file.type.match(textFile)) {
            reader.onload = function (event) {

                var worker = new Worker('./js/prep_data.js');
                worker.onmessage = function (e) {
                    console.log(e.data);
                    if (typeof e.data === 'number') {
                        bar.animate(e.data);
                    } else {
                        const {labels, data, minimumTime} = e.data;
                        setPlot(labels, data);
                        console.log(minimumTime);
                        console.log(labels);
                        setSummary(minimumTime);
                    }

                };

                let rawData = event.target.result;

                worker.postMessage(rawData);
            }
        } else {
            preview.innerHTML = "<span class='error'>It doesn't seem to be a text file!</span>";
        }
        reader.readAsText(file);
    }
} else {
    alert("Your browser is too old to support HTML5 File API");
}
