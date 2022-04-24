const ctx_top = document.getElementById('topChart');
const ctx_bottom = document.getElementById('bottomChart');

let range = document.getElementById('thresholdRange');
let rangeLabel = document.getElementById('thresholdLabel');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const nextPrevStep = 1;
const visibleStep = 10;
var btnhold = false;

const tension = 0.5;

var rangeSliderRange;


/*
  Changes threshold
*/
range.addEventListener('input', function () {
	threshold.yValue = range.value;
	rangeLabel.innerHTML = threshold.yValue;

	console.log('threshold changed to ' + threshold.yValue);

	//change color background
	//TO BE CHANGED
	topChart.data.datasets[2].fill.target.value = threshold.yValue;

	//change horizontal line
	topChart.options.plugins.annotation.annotations.tresholdLine.yMin = threshold.yValue;
	topChart.options.plugins.annotation.annotations.tresholdLine.yMax = threshold.yValue;


	topChart.update();
	bottomChart.update();
});

/* Rerenders bottom boxes on threshold change */
range.addEventListener('change', function (){
	bottomChart.options.plugins.annotation = {};
	bottomChart.options.plugins.annotation = drawBoxes(yValues2.topChart,threshold);
	bottomChart.update();
});

// Sample data
const numOfValues = 200;
const xValues = Array.from({ length: numOfValues }, () => (
	String.fromCharCode(Math.floor(Math.random() * ('Z'.charCodeAt() - 'A'.charCodeAt()) + 'A'.charCodeAt())))
);
console.log(xValues);
const yValues = {
	topChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	),
	bottomChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	)
}
const yValues2 = {
	topChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	),
	bottomChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	)
}


let threshold = { yValue: .5 };
range.value = threshold;
rangeLabel.innerHTML = range.value;

/*
  Applies configuration and position of one chart to different chart
*/
function updateChart(getUpdateChart, setUpdateChart) {
	setUpdateChart.options.scales.x.min = getUpdateChart.options.scales.x.min;
	setUpdateChart.options.scales.x.max = getUpdateChart.options.scales.x.max;
	setUpdateChart.update();
	updateValRange(getUpdateChart.options.scales.x.min,getUpdateChart.options.scales.x.max);
}

/*
  Function renders threshold line into the chart
*/
function getThresholdAnnotation(threshold) {
	return {
		annotations: {
			tresholdLine: {
				// Indicates the type of annotation
				type: 'line',
				yMin: threshold,
				yMax: threshold,
				backgroundColor: 'rgba(255, 99, 132, 0.25)',
				borderDash: [5, 15]
			}
		}
	}
}

/* Draws second chart boxes */
function drawBoxes(dataset,threshold) {

	let ret = {
		annotations: {
		}
	}
	let i = 0;
	dataset.forEach((value) => {
		if(value >= threshold.yValue){
			ret.annotations['box' + i] = {
				type: 'box',
				xMin: i-.5,
				xMax: i+.5,
				yMin: 0.1,
				yMax: 0.9,
				backgroundColor: 'rgba(236, 212, 68,0.5)',
				borderWidth:0,
				enter: function(context,event){
					highlightBar(context);
				}
			}
		}
		i++;
	});

	console.log(ret);
	return ret;
}



let topChartData = {
	labels: xValues,
	datasets: [
		{
			label: 'ASA',
			type: 'line',
			data: yValues.topChart,
			borderColor: 'rgb(75, 192, 192)',
			tension: tension,
			borderDash: [5, 5],
			order:1
		},
		{
			label: '_agr',
			type: 'bar',
			data: yValues2.topChart,
			borderColor: '#333333',
			tension: tension,
			hoverBackgroundColor: 'rgba(255, 184, 0,0.5)',
			order:3
		},
		{
			label: 'Aggregation',
			type: 'line',
			data: yValues2.topChart,
			borderColor: '#333333',
			tension: tension,
			fill: {
				backgroundColor: 'rgba(0,0,0,0)',
				target: { value: threshold.yValue },
				above: 'rgba(236, 212, 68,0.5)',
				below: 'rgba(0,0,0,0)'
			},
			order:2
		}
	]
};
const topChartConfig = {
	type: 'line',
	data: topChartData,
	options: {
		barPercentage: 1,
		interaction: {
            mode: 'nearest'
        },
		animation: true,
		responsive: true,
		scales: {
			x: {
				min: 0,
				max: visibleStep,
			}
		},
		transitions: {
			zoom: {
			  animation: {
				duration: 1000,
			  }
			}
		  },
		plugins: {
			zoom: {
				zoom: {
					wheel: {
						enabled: true
					},
					pinch: {
						enabled: true
					},
					mode: 'x',
					onZoom: function () {
						console.log("zoom");
						updateChart(topChart, bottomChart);
					}
				},
				pan: {
					enabled: true,
					mode: 'x',
					threshold: 1,
					onPan: function () {
						console.log("pan");
						updateChart(topChart, bottomChart);
					}
				}
			},
			annotation: getThresholdAnnotation(threshold.yValue)
		},
		maintainAspectRatio: false,
	}
};


const bottomChartData = {
	labels: xValues,
	datasets: [
		
	]
};
const bottomChartConfig = {
	type: 'bar',
	data: bottomChartData,
	options: {
		interaction: {
            mode: 'nearest'
        },
		animation: false,
		responsive: true,
		legend: {
			labels: {
				display:false
			}
		},
		scales: {
			x: {
				min: 0,
				max: visibleStep,
			},
			y:{
				min:0,
				max:1,
				grid:{
					display:false
				},
				ticks:{
					color:'rgba(0,0,0,0)'
				}
			}
		},
		plugins: {
			zoom: {
				zoom: {
					wheel: { enabled: true },
					mode: 'x',
					onZoom: function () {
						console.log("zoom");
						updateChart(bottomChart, topChart);
					}
				},
				pan: {
					enabled: true,
					mode: 'x',
					threshold: 0,
					onPan: function () {
						console.log("pan");
						updateChart(bottomChart, topChart);
					}
				}
			},
			annotation: drawBoxes(yValues2.topChart,threshold)
		},
		maintainAspectRatio: false,
	}
};

/* Top chart */
const topChart = new Chart(ctx_top, topChartConfig);
/* Bottom Chart */
const bottomChart = new Chart(ctx_bottom, bottomChartConfig);

/*
	Next Button Clicked
*/
nextButton.addEventListener('click', chartNext);

/*
	Prev Button Clicked
*/
prevButton.addEventListener('click', chartPrev);


function moveChart(chart, x){
	let step = chart.options.scales.x.max - chart.options.scales.x.min;
	chart.options.scales.x.min = x;
	chart.options.scales.x.max = x + step;
	chart.update();
}

function chartNext(){
	if (true) { // TO DO bounds
		topChart.options.scales.x.min += nextPrevStep;
		topChart.options.scales.x.max += nextPrevStep;
		bottomChart.options.animation = true;
		topChart.update();
		updateChart(topChart, bottomChart);
		bottomChart.options.animation = false;
	}
}

function chartPrev(){
	if (true) { // TO DO bounds
		topChart.options.scales.x.min -= nextPrevStep;
		topChart.options.scales.x.max -= nextPrevStep;
		bottomChart.options.animation = true;
		topChart.update();
		updateChart(topChart, bottomChart);
		bottomChart.options.animation = false;
	}
}

var valRange = new rSlider({
	target: '#valueRange',
	values: Array.from(Array(numOfValues).keys()),
	range: true,
	tooltip: true,
	scale: true,
	labels: false,
	set: [0, 20],
	onChange: function (values) {
		rangeSliderRange = values;
		changeChartView(topChart,values.split(',')[0],values.split(',')[1]);
		changeChartView(bottomChart,values.split(',')[0],values.split(',')[1]);
	}
});

function changeChartView(chart, start, end){
	console.log("HEY " + start +" " + end);
	chart.options.scales.x.min = parseInt(start);
	chart.options.scales.x.max = parseInt(end);
	bottomChart.options.animation = true;
	chart.update();
	bottomChart.options.animation = false;
}

function updateValRange(x,y){
	valRange.setValues(x,y);
}

function highlightBar(ctx){
	topChart.setActiveElements([
		{datasetIndex: 1, index: bottomChart.options.plugins.annotation.annotations[ctx.id].xMin +.5}
	]);
}
